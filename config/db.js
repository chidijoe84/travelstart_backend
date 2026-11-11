const mysql = require("mysql2/promise");
require("dotenv").config();

/**
 * Central MySQL connection pool.
 * All queries use parameterized placeholders (?) to prevent SQL injection.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "travelstart",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
  timezone: "Z",
  dateStrings: true,
  decimalNumbers: true,
});

/**
 * Verify the database is reachable. Called on server startup.
 */
const testConnection = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.query("SELECT 1");
  } finally {
    connection.release();
  }
};

module.exports = { pool, testConnection };
