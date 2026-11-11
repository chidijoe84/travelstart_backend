const express = require("express");
const {
  getGuestFavoriteHotels,
  addFavoriteHotel,
} = require("../controllers/favoriteController");
const validate = require("../middleware/validate");
const { favoriteRules } = require("../middleware/validators");

const router = express.Router();

router.get(
  "/registrations/getGuestFavoriteHotels/:tipTopGoGuestId",
  getGuestFavoriteHotels
);
router.post(
  "/registrations/addFavoriteHotel",
  favoriteRules,
  validate,
  addFavoriteHotel
);

module.exports = router;
