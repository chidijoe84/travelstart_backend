const { pool } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const generateId = require("../utils/generateId");
const { mapRoomType, mapRoomTypeImage, mapRoomAmenity } = require("../utils/mappers");

/**
 * GET /api/v1/hotels/:hotelId/roomAvailabilitySummary
 * Query: startDate, endDate, sourceType
 * Public endpoint used by the RoomList and HotelRooms pages. Availability is
 * derived from existing reservations so it is always accurate.
 */
const roomAvailabilitySummary = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;
  const { startDate, endDate } = req.query;

  const [hotelRows] = await pool.query(
    "SELECT hotel_id FROM hotels WHERE hotel_id = ? AND is_disabled = 0 LIMIT 1",
    [hotelId]
  );
  if (hotelRows.length === 0) {
    throw new ApiError(404, "Hotel not found");
  }

  const [rows] = await pool.query(
    `SELECT rt.*,
        GREATEST(
          rt.total_rooms - COALESCE((
            SELECT SUM(rr.quantity)
              FROM reservation_rooms rr
              JOIN reservations r ON r.reservation_id = rr.reservation_id
             WHERE rr.room_type_id = rt.room_type_id
               AND r.booking_status <> 'cancelled'
               AND r.check_in_date < ?
               AND r.check_out_date > ?
          ), 0),
          0
        ) AS available_rooms
       FROM room_types rt
      WHERE rt.hotel_id = ?
      ORDER BY rt.room_cost ASC`,
    [endDate || "9999-12-31 23:59:59", startDate || "1970-01-01 00:00:00", hotelId]
  );

  const amenityMap = await loadAmenitiesForRoomTypes(rows.map((r) => r.room_type_id));

  res
    .status(200)
    .json(
      rows.map((row) =>
        mapRoomType(row, [], amenityMap[row.room_type_id] || [])
      )
    );
});

/**
 * Load images for a set of room type ids and group them.
 */
const loadImagesForRoomTypes = async (roomTypeIds) => {
  if (roomTypeIds.length === 0) return {};
  const placeholders = roomTypeIds.map(() => "?").join(",");
  const [images] = await pool.query(
    `SELECT * FROM room_type_images WHERE room_type_id IN (${placeholders})`,
    roomTypeIds
  );
  return images.reduce((acc, img) => {
    acc[img.room_type_id] = acc[img.room_type_id] || [];
    acc[img.room_type_id].push(mapRoomTypeImage(img));
    return acc;
  }, {});
};

/**
 * Load amenities for a set of room type ids and group them.
 */
const loadAmenitiesForRoomTypes = async (roomTypeIds) => {
  if (roomTypeIds.length === 0) return {};
  const placeholders = roomTypeIds.map(() => "?").join(",");
  const [amenities] = await pool.query(
    `SELECT * FROM room_type_amenities WHERE room_type_id IN (${placeholders})`,
    roomTypeIds
  );
  return amenities.reduce((acc, item) => {
    acc[item.room_type_id] = acc[item.room_type_id] || [];
    acc[item.room_type_id].push(mapRoomAmenity(item));
    return acc;
  }, {});
};

/**
 * GET /api/v1/registrations/featuredRooms
 * Public list of room types selected for the homepage Accommodation section.
 */
const listFeaturedRoomTypes = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT rt.*, h.hotel_name, h.location, h.address, h.hotel_rating,
            h.total_ratings, h.picture AS hotel_picture
       FROM room_types rt
       JOIN hotels h ON h.hotel_id = rt.hotel_id
      WHERE rt.is_featured = 1 AND h.is_disabled = 0
      ORDER BY rt.room_cost ASC`
  );

  const imageMap = await loadImagesForRoomTypes(
    rows.map((row) => row.room_type_id)
  );
  const amenityMap = await loadAmenitiesForRoomTypes(
    rows.map((row) => row.room_type_id)
  );

  const rooms = rows.map((row) => {
    const room = mapRoomType(
      row,
      imageMap[row.room_type_id] || [],
      amenityMap[row.room_type_id] || []
    );
    const pictures = room.images
      .map((image) => image.roomTypePicture)
      .filter(Boolean);

    return {
      ...room,
      hotelName: row.hotel_name,
      location: row.location || row.address || "Nigeria",
      address: row.address,
      hotelRating: row.hotel_rating,
      hotelTotalRatings: row.total_ratings,
      hotelPicture: row.hotel_picture,
      roomTypeImages: pictures,
      roomTypePicture: pictures[0] || row.hotel_picture || null,
    };
  });

  res.status(200).json(rooms);
});

const listRoomTypes = asyncHandler(async (req, res) => {
  const { hotelId } = req.query;
  const conditions = [];
  const params = [];
  if (hotelId) {
    conditions.push("hotel_id = ?");
    params.push(hotelId);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `SELECT * FROM room_types ${where} ORDER BY hotel_id, room_cost ASC`,
    params
  );

  const imageMap = await loadImagesForRoomTypes(rows.map((r) => r.room_type_id));
  const amenityMap = await loadAmenitiesForRoomTypes(
    rows.map((r) => r.room_type_id)
  );
  const roomTypes = rows.map((row) =>
    mapRoomType(
      row,
      imageMap[row.room_type_id] || [],
      amenityMap[row.room_type_id] || []
    )
  );

  res.status(200).json({ success: true, count: roomTypes.length, roomTypes });
});

const getRoomType = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM room_types WHERE room_type_id = ? LIMIT 1",
    [req.params.roomTypeId]
  );
  if (rows.length === 0) {
    throw new ApiError(404, "Room type not found");
  }
  const imageMap = await loadImagesForRoomTypes([req.params.roomTypeId]);
  const amenityMap = await loadAmenitiesForRoomTypes([req.params.roomTypeId]);
  res.status(200).json({
    success: true,
    roomType: mapRoomType(
      rows[0],
      imageMap[req.params.roomTypeId] || [],
      amenityMap[req.params.roomTypeId] || []
    ),
  });
});

const replaceRoomImages = async (roomTypeId, images, connection) => {
  await connection.query(
    "DELETE FROM room_type_images WHERE room_type_id = ?",
    [roomTypeId]
  );
  if (!Array.isArray(images) || images.length === 0) return;

  const values = images
    .filter((item) => typeof item === "string" && item.trim())
    .map((item) => [roomTypeId, item.trim()]);

  if (values.length === 0) return;
  await connection.query(
    "INSERT INTO room_type_images (room_type_id, room_type_picture) VALUES ?",
    [values]
  );
};

/**
 * Replace the amenity list of a room type with the supplied strings.
 */
const replaceRoomAmenities = async (roomTypeId, amenities, connection) => {
  await connection.query(
    "DELETE FROM room_type_amenities WHERE room_type_id = ?",
    [roomTypeId]
  );
  if (!Array.isArray(amenities) || amenities.length === 0) return;

  const values = amenities
    .filter((item) => typeof item === "string" && item.trim())
    .map((item) => [roomTypeId, item.trim().slice(0, 150)]);

  if (values.length === 0) return;
  await connection.query(
    "INSERT INTO room_type_amenities (room_type_id, amenity) VALUES ?",
    [values]
  );
};

const createRoomType = asyncHandler(async (req, res) => {
  const {
    roomTypeId: providedRoomTypeId,
    hotelId,
    roomTypeName,
    roomCost = 0,
    discountPrice = null,
    totalRooms = 0,
    capacity = 2,
    shortDescription = null,
    images = [],
    amenities = [],
  } = req.body;

  const roomTypeId =
    (providedRoomTypeId || "").trim() || `RT-${generateId(12)}`;

  const normalizedDiscount =
    discountPrice === null ||
    discountPrice === undefined ||
    discountPrice === ""
      ? null
      : Number(discountPrice);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `INSERT INTO room_types
         (room_type_id, hotel_id, room_type_name, room_cost, discount_price,
          total_rooms, capacity, short_description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        roomTypeId,
        hotelId,
        roomTypeName,
        roomCost,
        normalizedDiscount,
        totalRooms,
        capacity,
        shortDescription,
      ]
    );
    await replaceRoomImages(roomTypeId, images, connection);
    await replaceRoomAmenities(roomTypeId, amenities, connection);
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  const [rows] = await pool.query(
    "SELECT * FROM room_types WHERE room_type_id = ? LIMIT 1",
    [roomTypeId]
  );
  const imageMap = await loadImagesForRoomTypes([roomTypeId]);
  const amenityMap = await loadAmenitiesForRoomTypes([roomTypeId]);
  res.status(201).json({
    success: true,
    message: "Room type created",
    roomType: mapRoomType(
      rows[0],
      imageMap[roomTypeId] || [],
      amenityMap[roomTypeId] || []
    ),
  });
});

const updateRoomType = asyncHandler(async (req, res) => {
  const { roomTypeId } = req.params;

  const [existing] = await pool.query(
    "SELECT room_type_id FROM room_types WHERE room_type_id = ? LIMIT 1",
    [roomTypeId]
  );
  if (existing.length === 0) {
    throw new ApiError(404, "Room type not found");
  }

  const fieldMap = {
    hotelId: "hotel_id",
    roomTypeName: "room_type_name",
    roomCost: "room_cost",
    discountPrice: "discount_price",
    totalRooms: "total_rooms",
    capacity: "capacity",
    shortDescription: "short_description",
    isFeatured: "is_featured",
  };

  const updates = [];
  const params = [];
  Object.entries(fieldMap).forEach(([camel, column]) => {
    if (req.body[camel] !== undefined) {
      updates.push(`${column} = ?`);
      if (camel === "discountPrice") {
        const value = req.body[camel];
        params.push(
          value === null || value === undefined || value === ""
            ? null
            : Number(value)
        );
      } else {
        params.push(req.body[camel]);
      }
    }
  });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (updates.length > 0) {
      params.push(roomTypeId);
      await connection.query(
        `UPDATE room_types SET ${updates.join(", ")} WHERE room_type_id = ?`,
        params
      );
    }

    if (req.body.images !== undefined) {
      await replaceRoomImages(roomTypeId, req.body.images, connection);
    }

    if (req.body.amenities !== undefined) {
      await replaceRoomAmenities(roomTypeId, req.body.amenities, connection);
    }

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  const [rows] = await pool.query(
    "SELECT * FROM room_types WHERE room_type_id = ? LIMIT 1",
    [roomTypeId]
  );
  const imageMap = await loadImagesForRoomTypes([roomTypeId]);
  const amenityMap = await loadAmenitiesForRoomTypes([roomTypeId]);
  res.status(200).json({
    success: true,
    message: "Room type updated",
    roomType: mapRoomType(
      rows[0],
      imageMap[roomTypeId] || [],
      amenityMap[roomTypeId] || []
    ),
  });
});

const deleteRoomType = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    "DELETE FROM room_types WHERE room_type_id = ?",
    [req.params.roomTypeId]
  );
  if (result.affectedRows === 0) {
    throw new ApiError(404, "Room type not found");
  }
  res.status(200).json({ success: true, message: "Room type deleted" });
});

module.exports = {
  roomAvailabilitySummary,
  listFeaturedRoomTypes,
  listRoomTypes,
  getRoomType,
  createRoomType,
  updateRoomType,
  deleteRoomType,
};
