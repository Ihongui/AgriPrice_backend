import { v2 as cloudinary } from "cloudinary";

const hasDiscreteCloudinaryVars = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET,
);
const hasCloudinaryUrl = Boolean(process.env.CLOUDINARY_URL);

let isCloudinaryConfigured = false;

if (hasDiscreteCloudinaryVars) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  isCloudinaryConfigured = true;
} else if (hasCloudinaryUrl) {
  try {
    const parsedCloudinaryUrl = new URL(process.env.CLOUDINARY_URL);
    const cloudName = parsedCloudinaryUrl.pathname.replace(/^\//, "");

    if (
      parsedCloudinaryUrl.username &&
      parsedCloudinaryUrl.password &&
      cloudName
    ) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: decodeURIComponent(parsedCloudinaryUrl.username),
        api_secret: decodeURIComponent(parsedCloudinaryUrl.password),
      });

      isCloudinaryConfigured = true;
    }
  } catch {
    isCloudinaryConfigured = false;
  }
}

export { isCloudinaryConfigured };
export default cloudinary;
