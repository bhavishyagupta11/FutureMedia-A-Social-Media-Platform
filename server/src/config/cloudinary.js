const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const env = require("./env");

let storage;

if (env.features.cloudinary) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'FutureMedia_posts',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4'],
    },
  });
} else {
  console.warn("WARNING:\nCloudinary unavailable.\nRunning with local disk storage.");
  
  const localUploadDir = path.resolve(__dirname, "../../uploads");
  if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, localUploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  });
}

const upload = multer({ storage });

module.exports = { cloudinary: env.features.cloudinary ? cloudinary : null, upload };
