const express = require("express");
const { listStates, listLgas } = require("../controllers/stateController");

const router = express.Router();

// ---- Public (used by the frontend) -------------------------------------
router.get("/registrations/states", listStates);
router.get("/registrations/lgas", listLgas);

module.exports = router;
