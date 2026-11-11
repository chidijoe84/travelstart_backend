const { pool } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

/**
 * GET /api/v1/health
 * Reports service and database status.
 */
const health = asyncHandler(async (req, res) => {
  let dbStatus = "up";
  try {
    await pool.query("SELECT 1");
  } catch (err) {
    dbStatus = "down";
  }

  const healthy = dbStatus === "up";
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? "ok" : "degraded",
    service: "travelstart-backend",
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = { health };
