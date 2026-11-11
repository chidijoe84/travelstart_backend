const { pool } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { attachHotelRelations } = require("./hotelController");

/**
 * Find a guest using whichever identifier the frontend supplied.
 */
const resolveGuest = async ({ tipTopGoGuestId, guestId }) => {
  if (tipTopGoGuestId) {
    const [rows] = await pool.query(
      "SELECT * FROM guests WHERE tip_top_go_guest_id = ? LIMIT 1",
      [tipTopGoGuestId]
    );
    if (rows.length > 0) return rows[0];
  }
  if (guestId) {
    const [rows] = await pool.query(
      "SELECT * FROM guests WHERE guest_id = ? LIMIT 1",
      [guestId]
    );
    if (rows.length > 0) return rows[0];
  }
  return null;
};

/**
 * GET /api/v1/registrations/getGuestFavoriteHotels/:tipTopGoGuestId
 * Returns the full hotel records the guest has favourited.
 */
const getGuestFavoriteHotels = asyncHandler(async (req, res) => {
  const { tipTopGoGuestId } = req.params;

  const guest = await resolveGuest({ tipTopGoGuestId });
  if (!guest) {
    // Unknown guest - return an empty list rather than erroring.
    return res.status(200).json([]);
  }

  const [rows] = await pool.query(
    `SELECT h.*
      FROM favorite_hotels f
      JOIN hotels h ON h.hotel_id = f.hotel_id
      WHERE f.guest_id = ? AND h.is_disabled = 0
      ORDER BY f.created_at DESC`,
    [guest.guest_id]
  );

  const hotels = await attachHotelRelations(rows);
  res.status(200).json(hotels);
});

/**
 * POST /api/v1/registrations/addFavoriteHotel
 * Body: { hotelId, guestId, tipTopGoGuestId, type: 'like' | 'unlike', sourceType }
 */
const addFavoriteHotel = asyncHandler(async (req, res) => {
  const { hotelId, guestId, tipTopGoGuestId, type = "like" } = req.body;

  const guest = await resolveGuest({ tipTopGoGuestId, guestId });
  if (!guest) {
    throw new ApiError(404, "Guest not found");
  }

  const [hotelRows] = await pool.query(
    "SELECT hotel_id FROM hotels WHERE hotel_id = ? LIMIT 1",
    [hotelId]
  );
  if (hotelRows.length === 0) {
    throw new ApiError(404, "Hotel not found");
  }

  if (type === "unlike") {
    await pool.query(
      "DELETE FROM favorite_hotels WHERE guest_id = ? AND hotel_id = ?",
      [guest.guest_id, hotelId]
    );
    return res
      .status(200)
      .json({ success: true, message: "Removed from favourites" });
  }

  await pool.query(
    `INSERT INTO favorite_hotels (guest_id, hotel_id) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE created_at = created_at`,
    [guest.guest_id, hotelId]
  );

  res.status(201).json({ success: true, message: "Added to favourites" });
});

module.exports = { getGuestFavoriteHotels, addFavoriteHotel };
