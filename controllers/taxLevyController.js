const { pool } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { mapTaxLevy } = require("../utils/mappers");

/**
 * GET /api/v1/admin/tax-levies?hotelId=
 */
const listTaxLevies = asyncHandler(async (req, res) => {
  const { hotelId } = req.query;
  const params = [];
  let where = "";
  if (hotelId) {
    where = "WHERE hotel_id = ?";
    params.push(hotelId);
  }

  const [rows] = await pool.query(
    `SELECT * FROM tax_levies ${where} ORDER BY hotel_id, tax_label`,
    params
  );
  res
    .status(200)
    .json({ success: true, count: rows.length, taxLevies: rows.map(mapTaxLevy) });
});

/**
 * GET /api/v1/admin/tax-levies/:levyId
 */
const getTaxLevy = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM tax_levies WHERE levy_id = ? LIMIT 1",
    [req.params.levyId]
  );
  if (rows.length === 0) {
    throw new ApiError(404, "Tax levy not found");
  }
  res.status(200).json({ success: true, taxLevy: mapTaxLevy(rows[0]) });
});

/**
 * POST /api/v1/admin/tax-levies
 */
const createTaxLevy = asyncHandler(async (req, res) => {
  const {
    levyId,
    hotelId,
    taxLabel,
    taxCategory = null,
    taxType = "percentage",
    flatAmount = null,
    taxPercentage = null,
    taxApplicable = "fd",
  } = req.body;

  await pool.query(
    `INSERT INTO tax_levies
       (levy_id, hotel_id, tax_label, tax_category, tax_type, flat_amount, tax_percentage, tax_applicable)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      levyId,
      hotelId,
      taxLabel,
      taxCategory,
      taxType,
      flatAmount,
      taxPercentage,
      taxApplicable,
    ]
  );

  const [rows] = await pool.query(
    "SELECT * FROM tax_levies WHERE levy_id = ? LIMIT 1",
    [levyId]
  );
  res
    .status(201)
    .json({ success: true, message: "Tax levy created", taxLevy: mapTaxLevy(rows[0]) });
});

/**
 * PUT /api/v1/admin/tax-levies/:levyId
 */
const updateTaxLevy = asyncHandler(async (req, res) => {
  const { levyId } = req.params;

  const [existing] = await pool.query(
    "SELECT levy_id FROM tax_levies WHERE levy_id = ? LIMIT 1",
    [levyId]
  );
  if (existing.length === 0) {
    throw new ApiError(404, "Tax levy not found");
  }

  const fieldMap = {
    hotelId: "hotel_id",
    taxLabel: "tax_label",
    taxCategory: "tax_category",
    taxType: "tax_type",
    flatAmount: "flat_amount",
    taxPercentage: "tax_percentage",
    taxApplicable: "tax_applicable",
  };

  const updates = [];
  const params = [];
  Object.entries(fieldMap).forEach(([camel, column]) => {
    if (req.body[camel] !== undefined) {
      updates.push(`${column} = ?`);
      params.push(req.body[camel]);
    }
  });

  if (updates.length === 0) {
    throw new ApiError(400, "No fields to update");
  }

  params.push(levyId);
  await pool.query(
    `UPDATE tax_levies SET ${updates.join(", ")} WHERE levy_id = ?`,
    params
  );

  const [rows] = await pool.query(
    "SELECT * FROM tax_levies WHERE levy_id = ? LIMIT 1",
    [levyId]
  );
  res
    .status(200)
    .json({ success: true, message: "Tax levy updated", taxLevy: mapTaxLevy(rows[0]) });
});

/**
 * DELETE /api/v1/admin/tax-levies/:levyId
 */
const deleteTaxLevy = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    "DELETE FROM tax_levies WHERE levy_id = ?",
    [req.params.levyId]
  );
  if (result.affectedRows === 0) {
    throw new ApiError(404, "Tax levy not found");
  }
  res.status(200).json({ success: true, message: "Tax levy deleted" });
});

module.exports = {
  listTaxLevies,
  getTaxLevy,
  createTaxLevy,
  updateTaxLevy,
  deleteTaxLevy,
};
