/**
 * Creates or updates the bootstrap admin account using the credentials in .env.
 * Usage: node scripts/createAdmin.js
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool, testConnection } = require("../config/db");

const name = process.env.ADMIN_NAME || "Travel Start Admin";
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

(async () => {
  if (!email || !password) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in backend/.env");
    process.exit(1);
  }

  try {
    await testConnection();
    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO admins (name, email, password_hash, role)
       VALUES (?, ?, ?, 'admin')
       ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash)`,
      [name, email, hash]
    );

    console.log(`Admin ready: ${email}`);
    process.exit(0);
  } catch (err) {
    console.error("Failed to create admin:", err.message);
    process.exit(1);
  }
})();
