const express = require("express");
const {
  makeWebReservation,
  listReservations,
  getReservation,
  updateReservationStatus,
  deleteReservation,
} = require("../controllers/reservationController");
const { protectAdmin } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const {
  reservationRules,
  reservationStatusRules,
} = require("../middleware/validators");

const router = express.Router();

// Public: create a reservation after successful payment
router.post(
  "/guests/makeWebReservation",
  reservationRules,
  validate,
  makeWebReservation
);

// Admin
router.get("/admin/reservations", protectAdmin, listReservations);
router.get("/admin/reservations/:reservationId", protectAdmin, getReservation);
router.patch(
  "/admin/reservations/:reservationId/status",
  protectAdmin,
  reservationStatusRules,
  validate,
  updateReservationStatus
);
router.delete("/admin/reservations/:reservationId", protectAdmin, deleteReservation);

module.exports = router;
