const { pool } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { mapGuest } = require("../utils/mappers");

/**
 * GET /api/v1/admin/guests
 * Optional search across name / email.
 */
const listGuests = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const params = [];
  let where = "";
  if (search) {
    where =
      "WHERE first_name LIKE ? OR last_name LIKE ? OR email_address LIKE ?";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const [rows] = await pool.query(
    `SELECT * FROM guests ${where} ORDER BY created_at DESC`,
    params
  );

  res
    .status(200)
    .json({ success: true, count: rows.length, guests: rows.map(mapGuest) });
});

/**
 * GET /api/v1/admin/guests/:guestId
 */
const getGuest = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM guests WHERE guest_id = ? LIMIT 1",
    [req.params.guestId]
  );
  if (rows.length === 0) {
    throw new ApiError(404, "Guest not found");
  }
  res.status(200).json({ success: true, guest: mapGuest(rows[0]) });
});

/**
 * GET /api/v1/admin/stats
 * Small dashboard summary.
 */
const getStats = asyncHandler(async (req, res) => {
  const [[hotels]] = await pool.query("SELECT COUNT(*) AS total FROM hotels");
  const [[rooms]] = await pool.query("SELECT COUNT(*) AS total FROM room_types");
  const [[guests]] = await pool.query("SELECT COUNT(*) AS total FROM guests");
  const [[reservations]] = await pool.query(
    "SELECT COUNT(*) AS total FROM reservations"
  );
  const [[subscribers]] = await pool.query(
    "SELECT COUNT(*) AS total FROM subscribers"
  );
  const [[revenue]] = await pool.query(
    "SELECT COALESCE(SUM(total_bill), 0) AS total FROM reservations WHERE booking_status <> 'cancelled'"
  );

  res.status(200).json({
    success: true,
    stats: {
      hotels: hotels.total,
      roomTypes: rooms.total,
      guests: guests.total,
      reservations: reservations.total,
      subscribers: subscribers.total,
      revenue: revenue.total,
    },
  });
});

module.exports = { listGuests, getGuest, getStats };
