const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { uploadChunk, uploadThumbnail } = require('../services/upload.service');
const {
  uploadChunk: uploadChunkController,
  mergeChunks,
  getAllVideos,
  getVideo,
  streamVideo,
  deleteVideo,
  cancelUpload
} = require('../controllers/video.controller');

// GET /api/content
router.get('/', getAllVideos);

// GET /api/content/:id
router.get('/:id', getVideo);

// GET /api/content/:id/stream (token in query or header)
router.get('/:id/stream', (req, res, next) => {
  if (req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
}, auth, streamVideo);

// POST /api/content/chunk (admin only)
router.post(
  '/chunk',
  auth,
  admin,
  uploadChunk.single('chunk'),
  uploadChunkController
);

// POST /api/content/merge (admin only)
router.post(
  '/merge',
  auth,
  admin,
  uploadThumbnail.fields([{ name: 'thumbnail', maxCount: 1 }]),
  mergeChunks
);

// DELETE /api/content/cancel/:uploadId (admin only)
router.delete('/cancel/:uploadId', auth, admin, cancelUpload);

// DELETE /api/content/:id (admin only)
router.delete('/:id', auth, admin, deleteVideo);

module.exports = router;