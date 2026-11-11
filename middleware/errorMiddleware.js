const ApiError = require("../utils/ApiError");

/**
 * 404 handler - runs when no route matched.
 */
const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Centralized error handler.
 * Always responds with a consistent JSON shape: { success, message, [errors] }.
 * Never leaks stack traces or credentials in production.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let errors = err.details;

  // MySQL duplicate entry
  if (err.code === "ER_DUP_ENTRY") {
    statusCode = 409;
    message = "A record with these details already exists";
  }

  // MySQL foreign key failure
  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    statusCode = 400;
    message = "Referenced record does not exist";
  }

  // Malformed JSON body
  if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON in request body";
  }

  // Multer upload errors
  if (err.name === "MulterError") {
    statusCode = 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image is too large (max 5MB)"
        : err.message;
  }

  if (statusCode >= 500) {
    console.error("[error]", err);
    if (process.env.NODE_ENV === "production") {
      message = "Internal server error";
      errors = undefined;
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
};

module.exports = { notFound, errorHandler };
