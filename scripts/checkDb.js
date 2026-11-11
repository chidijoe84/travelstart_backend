/**
 * Verifies the MySQL connection and prints table row counts.
 * Usage: npm run db:check
 */
require("dotenv").config();
const { pool, testConnection } = require("../config/db");

const TABLES = [
  "states",
  "lgas",
  "wards",
  "hotels",
  "hotel_images",
  "hotel_amenities",
  "room_types",
  "room_type_images",
  "tax_levies",
  "guests",
  "admins",
  "favorite_hotels",
  "subscribers",
  "reservations",
  "reservation_rooms",
  "reservation_taxes",
  "payments",
];

(async () => {
  try {
    await testConnection();
    console.log(
      `Connected to MySQL at ${process.env.DB_HOST}:${process.env.DB_PORT} db=${process.env.DB_NAME}`
    );

    for (const table of TABLES) {
      try {
        const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM ${table}`);
        console.log(`  ${table.padEnd(20)} ${rows[0].total}`);
      } catch (err) {
        console.log(`  ${table.padEnd(20)} (missing - run schema.sql)`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error("Database check failed:", err.message);
    process.exit(1);
  }
})();
