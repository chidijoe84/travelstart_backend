const { pool } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { mapSubscriber } = require("../utils/mappers");

/**
 * POST /api/v1/registrations/createSubscribers
 * Footer newsletter signup.
 */
const createSubscriber = asyncHandler(async (req, res) => {
  const { emailAddress } = req.body;

  const [existing] = await pool.query(
    "SELECT subscriber_id FROM subscribers WHERE email_address = ? LIMIT 1",
    [emailAddress]
  );

  if (existing.length > 0) {
    return res.status(200).json({
      success: false,
      message: "This email is already subscribed",
    });
  }

  const [result] = await pool.query(
    "INSERT INTO subscribers (email_address) VALUES (?)",
    [emailAddress]
  );

  res.status(201).json({
    success: true,
    message: "subscription created successfully",
    subscriber: mapSubscriber({
      subscriber_id: result.insertId,
      email_address: emailAddress,
    }),
  });
});

/**
 * GET /api/v1/admin/subscribers
 */
const listSubscribers = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM subscribers ORDER BY created_at DESC"
  );
  res
    .status(200)
    .json({ success: true, count: rows.length, subscribers: rows.map(mapSubscriber) });
});

/**
 * DELETE /api/v1/admin/subscribers/:subscriberId
 */
const deleteSubscriber = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    "DELETE FROM subscribers WHERE subscriber_id = ?",
    [req.params.subscriberId]
  );
  if (result.affectedRows === 0) {
    throw new ApiError(404, "Subscriber not found");
  }
  res.status(200).json({ success: true, message: "Subscriber deleted" });
});

module.exports = { createSubscriber, listSubscribers, deleteSubscriber };
