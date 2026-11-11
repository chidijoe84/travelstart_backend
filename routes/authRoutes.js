const express = require("express");
const {
  createUser,
  accessApp,
} = require("../controllers/authController");
const validate = require("../middleware/validate");
const { registerRules, loginRules } = require("../middleware/validators");

const router = express.Router();

// Guest registration (Register page)
router.post("/registrations/createUser", registerRules, validate, createUser);

// Guest login (Login page)
router.post("/registrations/accessApp", loginRules, validate, accessApp);

module.exports = router;
