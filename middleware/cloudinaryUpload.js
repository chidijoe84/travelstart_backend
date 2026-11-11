const multer = require("multer");
const ApiError = require("../utils/ApiError");

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(
        new ApiError(400, "Only JPG, PNG, WebP or GIF images are allowed")
      );
    }
    cb(null, true);
  },
});

module.exports = upload;
