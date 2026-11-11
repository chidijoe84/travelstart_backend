/**
 * Imports database/schema.sql, database/seed.sql and
 * database/states_lgas_wards.sql (in that order).
 * Usage: node scripts/importSql.js
 * Requires DB_* credentials in backend/.env.
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });

  try {
    const files = ["schema.sql", "seed.sql", "states_lgas_wards.sql"];
    for (const file of files) {
      const full = path.join(__dirname, "..", "database", file);
      const sql = fs.readFileSync(full, "utf8");
      console.log(`Importing ${file} ...`);
      await connection.query(sql);
    }
    console.log("✅ Database schema and seed imported successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Import failed:", err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
})();
