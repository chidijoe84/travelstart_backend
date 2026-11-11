const cloudinary = require("./cloudinary");
const ApiError = require("./ApiError");

const assertCloudinaryConfigured = () => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new ApiError(500, "Cloudinary is not configured");
  }
};

const uploadBuffer = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });

const uploadImageBuffer = async (buffer, folder) => {
  assertCloudinaryConfigured();

  if (!buffer) {
    throw new ApiError(400, "No image file received");
  }

  let result;
  try {
    result = await uploadBuffer(buffer, folder);
  } catch (err) {
    throw new ApiError(502, "Could not upload image to Cloudinary");
  }

  if (!result?.secure_url) {
    throw new ApiError(502, "Cloudinary did not return an image URL");
  }

  return result;
};

const uploadImages = async (files, folder) => {
  const uploaded = [];

  try {
    for (const file of files || []) {
      uploaded.push(await uploadImageBuffer(file.buffer, folder));
    }
  } catch (err) {
    await Promise.all(
      uploaded.map((item) =>
        cloudinary.uploader.destroy(item.public_id).catch(() => {})
      )
    );
    throw err;
  }

  return uploaded;
};

module.exports = { uploadImageBuffer, uploadImages };
