const { body, param, query } = require("express-validator");

const passwordRule = (field = "password", min = 6) =>
  body(field)
    .isString()
    .withMessage("Password is required")
    .isLength({ min })
    .withMessage(`Password must be at least ${min} characters`);

// ---- Auth ---------------------------------------------------------------
const registerRules = [
  body("firstName").trim().isLength({ min: 2 }).withMessage("First name is too short"),
  body("lastName").trim().isLength({ min: 2 }).withMessage("Last name is too short"),
  body("emailAddress").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("phoneNumber").trim().matches(/^[0-9]+$/).withMessage("Phone number must contain only digits"),
  passwordRule("password", 6),
  body("country").trim().notEmpty().withMessage("Country is required"),
  body("gender").trim().notEmpty().withMessage("Gender is required"),
  body("guestTitle").trim().notEmpty().withMessage("Title is required"),
  body("address").trim().notEmpty().withMessage("Address is required"),
];

const loginRules = [
  body("emailAddress").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").isString().notEmpty().withMessage("Password is required"),
];

const adminLoginRules = [
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").isString().notEmpty().withMessage("Password is required"),
];

// ---- Subscribers --------------------------------------------------------
const subscriberRules = [
  body("emailAddress").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
];

// ---- Favourites ---------------------------------------------------------
const favoriteRules = [
  body("hotelId").notEmpty().withMessage("hotelId is required"),
  body("type").optional().isIn(["like", "unlike"]).withMessage("type must be like or unlike"),
];

// ---- Reservations -------------------------------------------------------
const reservationRules = [
  body("hotelId").notEmpty().withMessage("hotelId is required"),
  body("checkInDate").notEmpty().withMessage("checkInDate is required"),
  body("checkOutDate").notEmpty().withMessage("checkOutDate is required"),
  body("bookings").isArray({ min: 1 }).withMessage("At least one room booking is required"),
  body("payingGuest").isObject().withMessage("payingGuest is required"),
  body("payingGuest.firstName").trim().notEmpty().withMessage("Guest first name is required"),
  body("payingGuest.lastName").trim().notEmpty().withMessage("Guest last name is required"),
];

// ---- Hotels (admin) -----------------------------------------------------
const hotelCreateRules = [
  body("hotelId")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("hotelId cannot be empty"),
  body("hotelName").trim().notEmpty().withMessage("hotelName is required"),
  body("hotelMinimumPrice").optional().isNumeric().withMessage("hotelMinimumPrice must be a number"),
];

const hotelUpdateRules = [
  body("hotelName").optional().trim().notEmpty().withMessage("hotelName cannot be empty"),
  body("hotelMinimumPrice").optional().isNumeric().withMessage("hotelMinimumPrice must be a number"),
  body("isDisabled").optional().isBoolean().withMessage("isDisabled must be a boolean"),
  body("isFeatured").optional().isBoolean().withMessage("isFeatured must be a boolean"),
];

// ---- Room types (admin) -------------------------------------------------
const roomTypeCreateRules = [
  body("roomTypeId")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("roomTypeId cannot be empty"),
  body("hotelId").trim().notEmpty().withMessage("hotelId is required"),
  body("roomTypeName").trim().notEmpty().withMessage("roomTypeName is required"),
  body("roomCost").optional().isNumeric().withMessage("roomCost must be a number"),
  body("discountPrice")
    .optional({ values: "null" })
    .isNumeric()
    .withMessage("discountPrice must be a number"),
  body("totalRooms").optional().isInt({ min: 0 }).withMessage("totalRooms must be a non-negative integer"),
];

const roomTypeUpdateRules = [
  body("roomTypeName").optional().trim().notEmpty(),
  body("roomCost").optional().isNumeric(),
  body("discountPrice")
    .optional({ values: "null" })
    .isNumeric()
    .withMessage("discountPrice must be a number"),
  body("totalRooms").optional().isInt({ min: 0 }),
  body("isFeatured").optional().isBoolean().withMessage("isFeatured must be a boolean"),
];

// ---- Tax levies (admin) -------------------------------------------------
const taxLevyCreateRules = [
  body("levyId").trim().notEmpty().withMessage("levyId is required"),
  body("hotelId").trim().notEmpty().withMessage("hotelId is required"),
  body("taxLabel").trim().notEmpty().withMessage("taxLabel is required"),
  body("taxType").optional().isIn(["flatAmount", "percentage"]),
  body("taxApplicable").optional().isIn(["fd", "fb"]),
];

const taxLevyUpdateRules = [
  body("taxType").optional().isIn(["flatAmount", "percentage"]),
  body("taxApplicable").optional().isIn(["fd", "fb"]),
];

// ---- Property listing requests (public form) ---------------------------
const listPropertyRules = [
  body("propertyName").trim().isLength({ min: 2 }).withMessage("Property name is required"),
  body("propertyType").trim().notEmpty().withMessage("Property type is required"),
  body("contactName").trim().isLength({ min: 2 }).withMessage("Contact person is required"),
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("phone").trim().notEmpty().withMessage("Phone number is required"),
  body("city").trim().notEmpty().withMessage("City / State is required"),
  body("nearestLandmark")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Nearest landmark is required"),
  body("latitude")
    .optional({ values: "falsy" })
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),
  body("longitude")
    .optional({ values: "falsy" })
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),
  body("rooms").isInt({ min: 1 }).withMessage("Number of rooms is required"),
  body("termsAccepted")
    .custom((value) => value === true || value === "true")
    .withMessage("You must accept the Terms and Conditions"),
];

// ---- Shared -------------------------------------------------------------
const reservationStatusRules = [
  param("reservationId").isInt({ min: 1 }).withMessage("Invalid reservation id"),
  body("bookingStatus")
    .trim()
    .isIn(["unprocessed", "processed", "confirmed", "checked-in", "checked-out", "cancelled"])
    .withMessage("Invalid booking status"),
];

const idParamRules = (name) => [
  param(name).trim().notEmpty().withMessage(`${name} is required`),
];

const availabilityRules = [
  query("startDate").optional().isString(),
  query("endDate").optional().isString(),
];

module.exports = {
  registerRules,
  loginRules,
  adminLoginRules,
  subscriberRules,
  listPropertyRules,
  favoriteRules,
  reservationRules,
  reservationStatusRules,
  hotelCreateRules,
  hotelUpdateRules,
  roomTypeCreateRules,
  roomTypeUpdateRules,
  taxLevyCreateRules,
  taxLevyUpdateRules,
  idParamRules,
  availabilityRules,
};
