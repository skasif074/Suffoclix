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

// GET /api/content/:id/stream (protected)
router.get('/:id/stream', auth, streamVideo);

// POST /api/content/chunk (admin - upload one chunk)
router.post(
  '/chunk',
  auth,
  admin,
  uploadChunk.single('chunk'),
  uploadChunkController
);

// POST /api/content/merge (admin - merge all chunks)
router.post(
  '/merge',
  auth,
  admin,
  uploadThumbnail.fields([{ name: 'thumbnail', maxCount: 1 }]),
  mergeChunks
);

// DELETE /api/content/cancel/:uploadId (admin - cancel upload)
router.delete('/cancel/:uploadId', auth, admin, cancelUpload);

// DELETE /api/content/:id (admin)
router.delete('/:id', auth, admin, deleteVideo);

module.exports = router;