const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const generateId = require("../utils/generateId");
const { mapGuest } = require("../utils/mappers");

/**
 * POST /api/v1/registrations/createUser
 * Register a new guest. Mirrors the Register page payload.
 */
const createUser = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    emailAddress,
    phoneNumber,
    password,
    country = null,
    gender = null,
    guestTitle = null,
    sourceType = "ResidencyWeb",
    address = null,
  } = req.body;

  const [existing] = await pool.query(
    "SELECT guest_id FROM guests WHERE email_address = ? LIMIT 1",
    [emailAddress]
  );

  if (existing.length > 0) {
    return res.status(409).json({
      success: false,
      message: "A user with this email already exists",
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const tipTopGoGuestId = generateId(15);

  const [result] = await pool.query(
    `INSERT INTO guests
       (tip_top_go_guest_id, guest_title, first_name, last_name, email_address,
        phone_number, password_hash, country, gender, address, source_type, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      tipTopGoGuestId,
      guestTitle,
      firstName,
      lastName,
      emailAddress,
      phoneNumber,
      passwordHash,
      country,
      gender,
      address,
      sourceType,
    ]
  );

  const [rows] = await pool.query(
    "SELECT * FROM guests WHERE guest_id = ? LIMIT 1",
    [result.insertId]
  );

  res.status(201).json({
    success: true,
    message: "Registrated Successfully",
    guestDetails: mapGuest(rows[0]),
  });
});

/**
 * POST /api/v1/registrations/accessApp
 * Guest login. Returns the exact `guestDetails` shape the frontend stores.
 */
const accessApp = asyncHandler(async (req, res) => {
  const { emailAddress, password } = req.body;

  const [rows] = await pool.query(
    "SELECT * FROM guests WHERE email_address = ? LIMIT 1",
    [emailAddress]
  );

  if (rows.length === 0) {
    return res.status(200).json({
      success: false,
      message: "user does not exist",
    });
  }

  const guest = rows[0];
  const isMatch = await bcrypt.compare(password, guest.password_hash);

  if (!isMatch) {
    return res.status(200).json({
      success: false,
      message: "Incorrect login details",
    });
  }

  if (!guest.active) {
    return res.status(200).json({
      success: false,
      message: "Your account is not active. Please contact support.",
    });
  }

  res.status(200).json({
    success: true,
    message: "Login Successful",
    guestDetails: mapGuest(guest),
  });
});

/**
 * POST /api/v1/admin/auth/login
 * Admin login - returns a JWT used by the protected /admin routes.
 */
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await pool.query(
    "SELECT * FROM admins WHERE email = ? LIMIT 1",
    [email]
  );

  if (rows.length === 0) {
    throw new ApiError(401, "Invalid email or password");
  }

  const admin = rows[0];
  const isMatch = await bcrypt.compare(password, admin.password_hash);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = jwt.sign(
    { adminId: admin.admin_id, email: admin.email, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );

  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    admin: {
      adminId: admin.admin_id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  });
});

/**
 * GET /api/v1/admin/auth/me
 * Returns the currently authenticated admin.
 */
const adminMe = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    "SELECT admin_id, name, email, role, created_at FROM admins WHERE admin_id = ? LIMIT 1",
    [req.admin.adminId]
  );

  if (rows.length === 0) {
    throw new ApiError(404, "Admin not found");
  }

  const admin = rows[0];
  res.status(200).json({
    success: true,
    admin: {
      adminId: admin.admin_id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      createdAt: admin.created_at,
    },
  });
});

module.exports = { createUser, accessApp, adminLogin, adminMe };
