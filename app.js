require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { testConnection } = require("./config/db");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

// ---- Core middleware ----------------------------------------------------
app.disable("x-powered-by");
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ---- CORS ---------------------------------------------------------------
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin / tools like Postman (no origin header)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origin ${origin} is not allowed`));
    },
    credentials: true,
  })
);

// ---- Uploaded images ----------------------------------------------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---- Routes -------------------------------------------------------------
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Travel Start Hotels API",
    version: "v1",
    docs: "/api/v1/health",
  });
});

app.use("/api/v1", routes);

// ---- 404 + error handling ----------------------------------------------
app.use(notFound);
app.use(errorHandler);

// ---- Start --------------------------------------------------------------
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await testConnection();
    console.log("✅ MySQL connection established");
  } catch (err) {
    console.error("❌ Unable to connect to MySQL:", err.message);
    console.error("   Check your backend/.env DB settings and that MySQL is running.");
    // Still start so /api/v1/health can report the DB as down.
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}/api/v1`);
  });
};

if (require.main === module) {
  start();
}

module.exports = app;
