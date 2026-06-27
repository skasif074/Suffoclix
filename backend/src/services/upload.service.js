const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

ensureDir(path.join(__dirname, '../../uploads/movies'));
ensureDir(path.join(__dirname, '../../uploads/series'));
ensureDir(path.join(__dirname, '../../uploads/thumbnails'));
ensureDir(path.join(__dirname, '../../uploads/temp'));

// ─────────────────────────────────────────────
// CHUNK STORAGE (temp folder)
// ─────────────────────────────────────────────
const chunkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '../../uploads/temp');
    ensureDir(tempDir);
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, `chunk_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  }
});

// ─────────────────────────────────────────────
// THUMBNAIL STORAGE
// ─────────────────────────────────────────────
const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/thumbnails'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const thumbnailFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WEBP images allowed.'));
  }
};

// Chunk upload (single chunk at a time)
const uploadChunk = multer({
  storage: chunkStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB per chunk
});

// Thumbnail only upload
const uploadThumbnail = multer({
  storage: thumbnailStorage,
  fileFilter: thumbnailFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = { uploadChunk, uploadThumbnail };