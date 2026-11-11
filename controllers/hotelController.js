const { pool } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const generateId = require("../utils/generateId");
const parseCoordinate = require("../utils/coordinates");
const { uploadImageBuffer } = require("../utils/cloudinaryUpload");
const {
  mapHotel,
  mapHotelImage,
  mapAmenity,
  mapTaxLevy,
  mapRoomTypeImage,
} = require("../utils/mappers");

/**
 * Bulk-load amenities, room type images and tax levies for a list of hotels
 * and attach the grouped relations to the mapped hotel objects.
 */
const attachHotelRelations = async (rows) => {
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.hotel_id);
  const placeholders = ids.map(() => "?").join(",");

  const [amenities] = await pool.query(
    `SELECT * FROM hotel_amenities WHERE hotel_id IN (${placeholders})`,
    ids
  );
  const [hotelImages] = await pool.query(
    `SELECT * FROM hotel_images WHERE hotel_id IN (${placeholders})`,
    ids
  );
  const [images] = await pool.query(
    `SELECT rti.*, rt.hotel_id FROM room_type_images rti
       JOIN room_types rt ON rt.room_type_id = rti.room_type_id
      WHERE rt.hotel_id IN (${placeholders})`,
    ids
  );
  const [levies] = await pool.query(
    `SELECT * FROM tax_levies WHERE hotel_id IN (${placeholders})`,
    ids
  );

  const groupBy = (list, key) =>
    list.reduce((acc, item) => {
      const k = item[key];
      acc[k] = acc[k] || [];
      acc[k].push(item);
      return acc;
    }, {});

  const amenityMap = groupBy(amenities, "hotel_id");
  const hotelImageMap = groupBy(hotelImages, "hotel_id");
  const imageMap = groupBy(images, "hotel_id");
  const levyMap = groupBy(levies, "hotel_id");

  return rows.map((row) =>
    mapHotel(row, {
      amenities: (amenityMap[row.hotel_id] || []).map(mapAmenity),
      images: (hotelImageMap[row.hotel_id] || []).map(mapHotelImage),
      roomTypeImages: (imageMap[row.hotel_id] || []).map(mapRoomTypeImage),
      taxLevies: (levyMap[row.hotel_id] || []).map(mapTaxLevy),
    })
  );
};

/**
 * GET /api/v1/registrations/hotels
 * Query: sourceType, hotelGroupName, location, genFilter
 * Public endpoint used by the Hero, Navbar, SearchForm, Locations, Favourites
 * and hotel listing pages.
 */
const listHotels = asyncHandler(async (req, res) => {
  const { sourceType, hotelGroupName, location, genFilter } = req.query;

  const conditions = ["is_disabled = 0"];
  const params = [];

  if (sourceType) {
    conditions.push("source_type = ?");
    params.push(sourceType);
  }
  if (hotelGroupName) {
    conditions.push("hotel_group_name = ?");
    params.push(hotelGroupName);
  }
  if (location) {
    conditions.push("location LIKE ?");
    params.push(`%${location}%`);
  }
  if (genFilter) {
    conditions.push("(hotel_name LIKE ? OR location LIKE ?)");
    params.push(`%${genFilter}%`, `%${genFilter}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await pool.query(
    `SELECT * FROM hotels ${where} ORDER BY hotel_name ASC`,
    params
  );

  const hotels = await attachHotelRelations(rows);
  res.status(200).json(hotels);
});

/**
 * GET /api/v1/admin/hotels
 * Admin listing with optional filters and pagination.
 */
const adminListHotels = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM hotels ORDER BY hotel_name ASC"
  );
  const hotels = await attachHotelRelations(rows);
  res.status(200).json({ success: true, count: hotels.length, hotels });
});

/**
 * GET /api/v1/admin/hotels/:hotelId
 */
const getHotel = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM hotels WHERE hotel_id = ? LIMIT 1",
    [req.params.hotelId]
  );

  if (rows.length === 0) {
    throw new ApiError(404, "Hotel not found");
  }

  const [hotel] = await attachHotelRelations(rows);
  res.status(200).json({ success: true, hotel });
});

/**
 * Replace a hotel's amenities with the supplied list of strings.
 */
const replaceAmenities = async (hotelId, amenities, connection) => {
  await connection.query("DELETE FROM hotel_amenities WHERE hotel_id = ?", [
    hotelId,
  ]);
  if (!Array.isArray(amenities) || amenities.length === 0) return;

  const values = amenities
    .filter((item) => typeof item === "string" && item.trim())
    .map((item) => [hotelId, item.trim()]);

  if (values.length === 0) return;
  await connection.query(
    "INSERT INTO hotel_amenities (hotel_id, amenity) VALUES ?",
    [values]
  );
};

const replaceHotelImages = async (hotelId, images, connection) => {
  await connection.query("DELETE FROM hotel_images WHERE hotel_id = ?", [
    hotelId,
  ]);
  if (!Array.isArray(images) || images.length === 0) return;

  const values = images
    .filter((url) => typeof url === "string" && url.trim())
    .slice(0, 10)
    .map((url, index) => [hotelId, url.trim(), index]);

  if (values.length === 0) return;
  await connection.query(
    "INSERT INTO hotel_images (hotel_id, image_url, sort_order) VALUES ?",
    [values]
  );
};

/**
 * POST /api/v1/admin/hotels
 */
const createHotel = asyncHandler(async (req, res) => {
  const {
    hotelId: providedHotelId,
    hotelName,
    propertyType = null,
    hotelGroupName = "Residency",
    sourceType = "showInCompanySite",
    location = null,
    stateName = null,
    lgaName = null,
    address = null,
    nearestLandmark = null,
    latitude = null,
    longitude = null,
    hotelDescription = null,
    shortHotelDescription = null,
    picture = null,
    hotelMinimumPrice = 0,
    hotelRating = null,
    totalRatings = 0,
    amenities = [],
    images = [],
    listingId = null,
  } = req.body;

  const hotelId =
    (providedHotelId || "").trim() || `HTL-${generateId(12)}`;
  const coverPicture =
    picture ||
    (Array.isArray(images)
      ? images.find((url) => typeof url === "string" && url.trim())
      : null);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      `INSERT INTO hotels
         (hotel_id, hotel_name, property_type, hotel_group_name, source_type,
          location, state_name, lga_name, address, nearest_landmark, latitude,
          longitude, hotel_description, short_hotel_description, picture,
          hotel_minimum_price, hotel_rating, total_ratings)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        hotelId,
        hotelName,
        propertyType,
        hotelGroupName,
        sourceType,
        location,
        stateName && stateName.trim() ? stateName.trim() : null,
        lgaName && lgaName.trim() ? lgaName.trim() : null,
        address,
        nearestLandmark && nearestLandmark.trim()
          ? nearestLandmark.trim()
          : null,
        parseCoordinate(latitude, -90, 90),
        parseCoordinate(longitude, -180, 180),
        hotelDescription,
        shortHotelDescription,
        coverPicture,
        hotelMinimumPrice,
        hotelRating,
        totalRatings,
      ]
    );

    await replaceAmenities(hotelId, amenities, connection);
    await replaceHotelImages(hotelId, images, connection);

    if (listingId) {
      const [listings] = await connection.query(
        "SELECT status FROM property_listings WHERE listing_id = ? FOR UPDATE",
        [listingId]
      );
      if (listings.length === 0) {
        throw new ApiError(404, "Listing request not found");
      }
      if (listings[0].status === "completed") {
        throw new ApiError(409, "Listing request has already been onboarded");
      }

      await connection.query(
        "UPDATE property_listings SET status = 'completed', hotel_id = ? WHERE listing_id = ?",
        [hotelId, listingId]
      );
    }

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  const [rows] = await pool.query(
    "SELECT * FROM hotels WHERE hotel_id = ? LIMIT 1",
    [hotelId]
  );
  const [hotel] = await attachHotelRelations(rows);
  res.status(201).json({ success: true, message: "Hotel created", hotel });
});

/**
 * PUT /api/v1/admin/hotels/:hotelId
 */
const updateHotel = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;

  const [existing] = await pool.query(
    "SELECT hotel_id FROM hotels WHERE hotel_id = ? LIMIT 1",
    [hotelId]
  );
  if (existing.length === 0) {
    throw new ApiError(404, "Hotel not found");
  }

  const fields = [
    "hotel_name",
    "property_type",
    "hotel_group_name",
    "source_type",
    "location",
    "state_name",
    "lga_name",
    "address",
    "nearest_landmark",
    "latitude",
    "longitude",
    "hotel_description",
    "short_hotel_description",
    "picture",
    "hotel_minimum_price",
    "hotel_rating",
    "total_ratings",
    "is_disabled",
    "is_featured",
  ];

  const updates = [];
  const params = [];
  fields.forEach((field) => {
    const camel = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (req.body[camel] !== undefined) {
      updates.push(`${field} = ?`);
      params.push(req.body[camel]);
    }
  });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (updates.length > 0) {
      params.push(hotelId);
      await connection.query(
        `UPDATE hotels SET ${updates.join(", ")} WHERE hotel_id = ?`,
        params
      );
    }

    if (req.body.amenities !== undefined) {
      await replaceAmenities(hotelId, req.body.amenities, connection);
    }

    if (req.body.images !== undefined) {
      await replaceHotelImages(hotelId, req.body.images, connection);

      if (req.body.picture === undefined) {
        const cover =
          Array.isArray(req.body.images) &&
          req.body.images.find(
            (url) => typeof url === "string" && url.trim()
          );
        await connection.query(
          "UPDATE hotels SET picture = ? WHERE hotel_id = ?",
          [cover || null, hotelId]
        );
      }
    }

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  const [rows] = await pool.query(
    "SELECT * FROM hotels WHERE hotel_id = ? LIMIT 1",
    [hotelId]
  );
  const [hotel] = await attachHotelRelations(rows);
  res.status(200).json({ success: true, message: "Hotel updated", hotel });
});

/**
 * DELETE /api/v1/admin/hotels/:hotelId
 */
const deleteHotel = asyncHandler(async (req, res) => {
  const [result] = await pool.query("DELETE FROM hotels WHERE hotel_id = ?", [
    req.params.hotelId,
  ]);

  if (result.affectedRows === 0) {
    throw new ApiError(404, "Hotel not found");
  }

  res.status(200).json({ success: true, message: "Hotel deleted" });
});

/**
 * POST /api/v1/admin/hotels/picture
 * Multipart upload (field name: "image"). Uploads hotel/room images to
 * Cloudinary and returns the secure URL to save in the database.
 */
const uploadHotelPicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No image file received");
  }

  const result = await uploadImageBuffer(req.file.buffer, "travelstart/hotels");

  res.status(201).json({
    success: true,
    url: result.secure_url,
    publicId: result.public_id,
  });
});

module.exports = {
  attachHotelRelations,
  listHotels,
  adminListHotels,
  getHotel,
  createHotel,
  updateHotel,
  deleteHotel,
  uploadHotelPicture,
};
