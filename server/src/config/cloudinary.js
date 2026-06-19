const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const env = require("./env");

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'socialloop_posts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4'],
  },
});

const upload = multer({ storage });

module.exports = { cloudinary, upload };
