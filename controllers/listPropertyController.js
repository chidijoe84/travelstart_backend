const fs = require("fs");
const path = require("path");
const { pool } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const cloudinary = require("../utils/cloudinary");
const { uploadImages } = require("../utils/cloudinaryUpload");
const { mapListingRequest } = require("../utils/mappers");
const { notifyListingCreated } = require("../utils/mailer");
const parseCoordinate = require("../utils/coordinates");

const LISTING_STATUSES = ["new", "contacted", "closed", "completed"];
const CLOUDINARY_FOLDER = "travelstart/property-listings";

const cloudinaryPublicId = (url) => {
  if (!url || !url.includes("res.cloudinary.com")) return null;

  const marker = "/upload/";
  const index = url.indexOf(marker);
  if (index === -1) return null;

  return url
    .slice(index + marker.length)
    .replace(/^v\d+\//, "")
    .replace(/\.[^./]+$/, "");
};

const uploadListingImages = async (files) => {
  const uploaded = await uploadImages(files, CLOUDINARY_FOLDER);
  return uploaded.map((item) => item.secure_url);
};

/**
 * POST /api/v1/registrations/listYourProperty
 * Public "List Your Property" form — multipart, up to 3 images.
 */
const createListing = asyncHandler(async (req, res) => {
  const {
    propertyName,
    propertyType,
    contactName,
    email,
    phone,
    city,
    stateName,
    lgaName,
    nearestLandmark,
    latitude,
    longitude,
    rooms,
    message,
    termsAccepted,
  } = req.body;

  const acceptedTerms = termsAccepted === true || termsAccepted === "true";
  const images = await uploadListingImages(req.files || []);

  const [result] = await pool.query(
    `INSERT INTO property_listings
       (property_name, property_type, contact_name, email, phone, city,
        state_name, lga_name, nearest_landmark, latitude, longitude, rooms,
        message, terms_accepted, terms_accepted_at, images)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, IF(?, NOW(), NULL), ?)`,
    [
      propertyName,
      propertyType,
      contactName,
      email,
      phone,
      city,
      stateName || null,
      lgaName || null,
      nearestLandmark && nearestLandmark.trim()
        ? nearestLandmark.trim()
        : null,
      parseCoordinate(latitude, -90, 90),
      parseCoordinate(longitude, -180, 180),
      Number(rooms) || 0,
      message && message.trim() ? message.trim() : null,
      acceptedTerms ? 1 : 0,
      acceptedTerms ? 1 : 0,
      JSON.stringify(images),
    ]
  );

  const [rows] = await pool.query(
    "SELECT * FROM property_listings WHERE listing_id = ?",
    [result.insertId]
  );

  const listing = mapListingRequest(rows[0]);

  notifyListingCreated(listing).catch((err) => {
    console.error("[mail] Listing notification failed:", err.message);
  });

  res.status(201).json({
    success: true,
    message: "Property request received",
    listing,
  });
});

/**
 * GET /api/v1/admin/listing-requests?status=new
 */
const listListings = asyncHandler(async (req, res) => {
  const { status } = req.query;

  let sql = "SELECT * FROM property_listings";
  const params = [];

  if (status) {
    if (!LISTING_STATUSES.includes(status)) {
      throw new ApiError(400, "Invalid status filter");
    }
    sql += " WHERE status = ?";
    params.push(status);
  }

  sql += " ORDER BY created_at DESC";

  const [rows] = await pool.query(sql, params);

  res.status(200).json({
    success: true,
    count: rows.length,
    listings: rows.map(mapListingRequest),
  });
});

/**
 * PUT /api/v1/admin/listing-requests/:listingId/status
 */
const updateListingStatus = asyncHandler(async (req, res) => {
  const { listingId } = req.params;
  const { status } = req.body;

  if (!LISTING_STATUSES.includes(status)) {
    throw new ApiError(400, "Status must be new, contacted or closed");
  }

  const [result] = await pool.query(
    "UPDATE property_listings SET status = ? WHERE listing_id = ?",
    [status, listingId]
  );

  if (result.affectedRows === 0) {
    throw new ApiError(404, "Listing request not found");
  }

  const [rows] = await pool.query(
    "SELECT * FROM property_listings WHERE listing_id = ?",
    [listingId]
  );

  res.status(200).json({
    success: true,
    message: "Listing request updated",
    listing: mapListingRequest(rows[0]),
  });
});

/**
 * DELETE /api/v1/admin/listing-requests/:listingId
 */
const deleteListing = asyncHandler(async (req, res) => {
  const { listingId } = req.params;

  const [rows] = await pool.query(
    "SELECT * FROM property_listings WHERE listing_id = ?",
    [listingId]
  );

  if (rows.length === 0) {
    throw new ApiError(404, "Listing request not found");
  }

  const listing = mapListingRequest(rows[0]);

  const [result] = await pool.query(
    "DELETE FROM property_listings WHERE listing_id = ?",
    [listingId]
  );

  if (result.affectedRows === 0) {
    throw new ApiError(404, "Listing request not found");
  }

  listing.images.forEach((image) => {
    if (image.startsWith("/uploads/")) {
      const filePath = path.join(
        __dirname,
        "..",
        "uploads",
        path.basename(image)
      );
      fs.unlink(filePath, () => {});
      return;
    }

    const publicId = cloudinaryPublicId(image);
    if (publicId) {
      cloudinary.uploader.destroy(publicId).catch(() => {});
    }
  });

  res.status(200).json({ success: true, message: "Listing request deleted" });
});

module.exports = {
  createListing,
  listListings,
  updateListingStatus,
  deleteListing,
};
