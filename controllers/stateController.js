const { pool } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { mapState, mapLga } = require("../utils/mappers");

/**
 * GET /api/v1/registrations/states
 * Public list of Nigerian states used by the search and listing forms.
 */
const listStates = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM states ORDER BY state_name ASC"
  );
  res.status(200).json(rows.map(mapState));
});

/**
 * GET /api/v1/registrations/lgas?stateId=...
 * Public list of local government areas, optionally filtered by state.
 */
const listLgas = asyncHandler(async (req, res) => {
  const { stateId } = req.query;

  let sql = "SELECT * FROM lgas";
  const params = [];

  if (stateId) {
    sql += " WHERE state_id = ?";
    params.push(stateId);
  }

  sql += " ORDER BY lga_name ASC";

  const [rows] = await pool.query(sql, params);
  res.status(200).json(rows.map(mapLga));
});

module.exports = { listStates, listLgas };
