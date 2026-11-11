const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

/**
 * Collects express-validator errors and forwards a single 422 ApiError.
 * Keep route files free of business logic by using this in the route chain.
 */
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((item) => ({
    field: item.path,
    message: item.msg,
  }));

  return next(new ApiError(422, "Validation failed", errors));
};

module.exports = validate;
