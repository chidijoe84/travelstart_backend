const express = require("express");
const {
  createSubscriber,
  listSubscribers,
  deleteSubscriber,
} = require("../controllers/subscriberController");
const { protectAdmin } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { subscriberRules } = require("../middleware/validators");

const router = express.Router();

// Public newsletter signup (Footer)
router.post(
  "/registrations/createSubscribers",
  subscriberRules,
  validate,
  createSubscriber
);

// Admin
router.get("/admin/subscribers", protectAdmin, listSubscribers);
router.delete("/admin/subscribers/:subscriberId", protectAdmin, deleteSubscriber);

module.exports = router;
