const crypto = require("crypto");

const ALPHANUMERIC =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Generate a cryptographically random alphanumeric id of a given length.
 * Used for booking codes and each guest's tipTopGoGuestId.
 */
const generateId = (length = 15) => {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += ALPHANUMERIC[bytes[i] % ALPHANUMERIC.length];
  }
  return out;
};

module.exports = generateId;
