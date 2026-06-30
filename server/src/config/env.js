const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGO_URI) {
  console.error("CRITICAL: MONGO_URI is missing from environment variables.");
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error("CRITICAL: JWT_SECRET is missing from environment variables.");
  process.exit(1);
}

const features = {
  redis: Boolean(process.env.REDIS_URL),
  bullmq: Boolean(process.env.REDIS_URL), // BullMQ requires Redis
  smtp: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
  cloudinary: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
  intelligence: Boolean(process.env.INTELLIGENCE_SERVICE_URL),
  socket: true // Default to true, will disable if initSocket throws
};

module.exports = {
  PORT: process.env.PORT || 8080,
  MONGO_URI,
  JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || "30d",
  CLIENT_ORIGINS: (process.env.CLIENT_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  REDIS_URL: process.env.REDIS_URL,
  INTELLIGENCE_SERVICE_URL: process.env.INTELLIGENCE_SERVICE_URL || "http://localhost:8000",
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT || 2525,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  FROM_EMAIL: process.env.FROM_EMAIL || "noreply@FutureMedia.com",
  FROM_NAME: process.env.FROM_NAME || "FutureMedia",
  features
};
