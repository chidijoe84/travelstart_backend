/**
 * Applies pending files from database/migrations to the configured DB.
 * Tracks applied files in a schema_migrations table so it is safe to re-run.
 *
 * Usage: node scripts/applyMigrations.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const MIGRATIONS_DIR = path.join(__dirname, "..", "database", "migrations");

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });

  try {
    const dbName = process.env.DB_NAME || "travelstart";
    await connection.query(`USE \`${dbName}\``);

    await connection.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         name      VARCHAR(191) NOT NULL,
         applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
         PRIMARY KEY (name)
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );

    const [appliedRows] = await connection.query(
      "SELECT name FROM schema_migrations"
    );
    const applied = new Set(appliedRows.map((row) => row.name));

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.toLowerCase().endsWith(".sql"))
      .sort();

    const pending = files.filter((file) => !applied.has(file));

    if (pending.length === 0) {
      console.log("No pending migrations.");
      process.exit(0);
    }

    for (const file of pending) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      console.log(`Applying ${file} ...`);
      await connection.query(sql);
      await connection.query("INSERT INTO schema_migrations (name) VALUES (?)", [
        file,
      ]);
    }

    console.log(`\nDone. Applied ${pending.length} migration(s).`);
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
})();
