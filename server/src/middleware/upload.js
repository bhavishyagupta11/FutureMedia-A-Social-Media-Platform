const multer = require("multer");

// File size limits matching prompt requirements
const limits = {
  image: 10 * 1024 * 1024, // 10 MB
  video: 100 * 1024 * 1024, // 100 MB
  document: 25 * 1024 * 1024, // 25 MB
  audio: 15 * 1024 * 1024 // 15 MB
};

const storage = multer.memoryStorage(); // Cloudinary will handle upload stream

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    if (file.size > limits.image) {
      return cb(new Error("Image exceeds 10MB limit"), false);
    }
    cb(null, true);
  } else if (file.mimetype.startsWith("video/")) {
    if (file.size > limits.video) {
      return cb(new Error("Video exceeds 100MB limit"), false);
    }
    cb(null, true);
  } else if (file.mimetype.startsWith("audio/")) {
    if (file.size > limits.audio) {
      return cb(new Error("Audio exceeds 15MB limit"), false);
    }
    cb(null, true);
  } else if (
    file.mimetype === "application/pdf" || 
    file.mimetype.includes("msword") || 
    file.mimetype.includes("officedocument")
  ) {
    if (file.size > limits.document) {
      return cb(new Error("Document exceeds 25MB limit"), false);
    }
    cb(null, true);
  } else {
    cb(new Error("Unsupported file format"), false);
  }
};

const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // Absolute max handled by multer buffer, strict checks in filter
});

module.exports = { uploadMiddleware };
