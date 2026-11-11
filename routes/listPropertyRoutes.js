const express = require("express");
const {
  createListing,
  listListings,
  updateListingStatus,
  deleteListing,
} = require("../controllers/listPropertyController");
const upload = require("../middleware/cloudinaryUpload");
const { protectAdmin } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { listPropertyRules } = require("../middleware/validators");

const router = express.Router();

// Public "List Your Property" form (max 3 images)
router.post(
  "/registrations/listYourProperty",
  upload.array("images", 3),
  listPropertyRules,
  validate,
  createListing
);

// Admin
router.get("/admin/listing-requests", protectAdmin, listListings);
router.put(
  "/admin/listing-requests/:listingId/status",
  protectAdmin,
  updateListingStatus
);
router.delete("/admin/listing-requests/:listingId", protectAdmin, deleteListing);

module.exports = router;
