const express = require("express");
const { health } = require("../controllers/healthController");

const authRoutes = require("./authRoutes");
const stateRoutes = require("./stateRoutes");
const hotelRoutes = require("./hotelRoutes");
const roomRoutes = require("./roomRoutes");
const favoriteRoutes = require("./favoriteRoutes");
const subscriberRoutes = require("./subscriberRoutes");
const listPropertyRoutes = require("./listPropertyRoutes");
const reservationRoutes = require("./reservationRoutes");
const taxLevyRoutes = require("./taxLevyRoutes");
const adminRoutes = require("./adminRoutes");

const router = express.Router();

// Health check
router.get("/health", health);

// Feature routers (each declares its own sub-paths, all under /api/v1)
router.use(authRoutes);
router.use(stateRoutes);
router.use(hotelRoutes);
router.use(roomRoutes);
router.use(favoriteRoutes);
router.use(subscriberRoutes);
router.use(listPropertyRoutes);
router.use(reservationRoutes);
router.use(taxLevyRoutes);
router.use(adminRoutes);

module.exports = router;
