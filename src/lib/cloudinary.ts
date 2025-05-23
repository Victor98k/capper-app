import { v2 as cloudinary } from "cloudinary";

// Add logging before configuration
console.log("Configuring Cloudinary with:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "undefined",
  api_key: process.env.CLOUDINARY_API_KEY ? "**present**" : "undefined",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "**present**" : "undefined",
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
