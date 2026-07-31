import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("Testing Cloudinary connection...");
console.log(
  "Cloud Name:",
  process.env.CLOUDINARY_CLOUD_NAME ? "✓ Set" : "✗ Missing",
);
console.log("API Key:", process.env.CLOUDINARY_API_KEY ? "✓ Set" : "✗ Missing");
console.log(
  "API Secret:",
  process.env.CLOUDINARY_API_SECRET ? "✓ Set" : "✗ Missing",
);

cloudinary.api
  .ping()
  .then((result) => {
    console.log("\n✅ Cloudinary connected successfully!");
    console.log("Response:", result);
  })
  .catch((error) => {
    console.error("\n❌ Cloudinary connection failed:");
    console.error(error.message);
    process.exit(1);
  });
