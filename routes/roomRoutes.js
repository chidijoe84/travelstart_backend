const express = require("express");
const {
  roomAvailabilitySummary,
  listFeaturedRoomTypes,
  listRoomTypes,
  getRoomType,
  createRoomType,
  updateRoomType,
  deleteRoomType,
} = require("../controllers/roomController");
const { protectAdmin } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const {
  roomTypeCreateRules,
  roomTypeUpdateRules,
} = require("../middleware/validators");

const router = express.Router();

// ---- Public: availability for a hotel ----------------------------------
router.get(
  "/hotels/:hotelId/roomAvailabilitySummary",
  roomAvailabilitySummary
);

// ---- Public: homepage Accommodation carousel ----------------------------
router.get("/registrations/featuredRooms", listFeaturedRoomTypes);

// ---- Admin CRUD ---------------------------------------------------------
router.get("/admin/room-types", protectAdmin, listRoomTypes);
router.get("/admin/room-types/:roomTypeId", protectAdmin, getRoomType);
router.post("/admin/room-types", protectAdmin, roomTypeCreateRules, validate, createRoomType);
router.put("/admin/room-types/:roomTypeId", protectAdmin, roomTypeUpdateRules, validate, updateRoomType);
router.delete("/admin/room-types/:roomTypeId", protectAdmin, deleteRoomType);

module.exports = router;
