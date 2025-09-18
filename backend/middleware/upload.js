// backend/middleware/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed extensions
const allowedExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Example: post-<userid>-<timestamp>.ext
    const ext = path.extname(file.originalname).toLowerCase();
    const safeUser = req.user ? String(req.user._id) : "guest";
    const filename = `${file.fieldname}-${safeUser}-${Date.now()}${ext}`;
    cb(null, filename);
  },
});

// File filter (accept only images, by mimetype or extension)
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();

  if (file.mimetype && file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }
  if (allowedExts.includes(ext)) {
    return cb(null, true);
  }

  cb(new Error("Only image files are allowed!"), false);
};

// Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
});

module.exports = upload;
