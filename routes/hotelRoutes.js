const express = require("express");
const {
  listHotels,
  adminListHotels,
  getHotel,
  createHotel,
  updateHotel,
  deleteHotel,
  uploadHotelPicture,
} = require("../controllers/hotelController");
const { protectAdmin } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const upload = require("../middleware/cloudinaryUpload");
const {
  hotelCreateRules,
  hotelUpdateRules,
} = require("../middleware/validators");

const router = express.Router();

// ---- Public (used by the frontend) -------------------------------------
router.get("/registrations/hotels", listHotels);

// ---- Admin CRUD ---------------------------------------------------------
router.post(
  "/admin/hotels/picture",
  protectAdmin,
  upload.single("image"),
  uploadHotelPicture
);
router.get("/admin/hotels", protectAdmin, adminListHotels);
router.get("/admin/hotels/:hotelId", protectAdmin, getHotel);
router.post("/admin/hotels", protectAdmin, hotelCreateRules, validate, createHotel);
router.put("/admin/hotels/:hotelId", protectAdmin, hotelUpdateRules, validate, updateHotel);
router.delete("/admin/hotels/:hotelId", protectAdmin, deleteHotel);

module.exports = router;
