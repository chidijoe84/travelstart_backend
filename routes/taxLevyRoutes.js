const express = require("express");
const {
  listTaxLevies,
  getTaxLevy,
  createTaxLevy,
  updateTaxLevy,
  deleteTaxLevy,
} = require("../controllers/taxLevyController");
const { protectAdmin } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const {
  taxLevyCreateRules,
  taxLevyUpdateRules,
} = require("../middleware/validators");

const router = express.Router();

router.get("/admin/tax-levies", protectAdmin, listTaxLevies);
router.get("/admin/tax-levies/:levyId", protectAdmin, getTaxLevy);
router.post("/admin/tax-levies", protectAdmin, taxLevyCreateRules, validate, createTaxLevy);
router.put("/admin/tax-levies/:levyId", protectAdmin, taxLevyUpdateRules, validate, updateTaxLevy);
router.delete("/admin/tax-levies/:levyId", protectAdmin, deleteTaxLevy);

module.exports = router;
