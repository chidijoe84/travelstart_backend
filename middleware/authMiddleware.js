const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");

/**
 * Protects admin routes with a Bearer JWT.
 * Admins obtain a token from POST /api/v1/admin/auth/login.
 *
 * NOTE: the customer-facing endpoints used by the frontend are intentionally
 * public, because the existing frontend keeps its session in localStorage and
 * does not send the token on those requests.
 */
const protectAdmin = (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    return next();
  } catch (err) {
    return next(new ApiError(401, "Invalid or expired token"));
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.admin || !roles.includes(req.admin.role)) {
    return next(new ApiError(403, "You do not have permission to do this"));
  }
  return next();
};

module.exports = { protectAdmin, requireRole };
