const express = require("express");
const { adminLogin, adminMe } = require("../controllers/authController");
const {
  listGuests,
  getGuest,
  getStats,
} = require("../controllers/adminController");
const { protectAdmin } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { adminLoginRules } = require("../middleware/validators");

const router = express.Router();

// Admin auth
router.post("/admin/auth/login", adminLoginRules, validate, adminLogin);
router.get("/admin/auth/me", protectAdmin, adminMe);

// Admin: guests + dashboard
router.get("/admin/guests", protectAdmin, listGuests);
router.get("/admin/guests/:guestId", protectAdmin, getGuest);
router.get("/admin/stats", protectAdmin, getStats);

module.exports = router;
