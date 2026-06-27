const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  updateProgress,
  getHistory,
  getContinueWatching,
  getVideoProgress,
  clearHistory
} = require('../controllers/watch.controller');

// POST /api/watch/update-progress  (protected)
router.post('/update-progress', auth, updateProgress);

// GET /api/watch/history  (protected)
router.get('/history', auth, getHistory);

// GET /api/watch/continue  (protected)
router.get('/continue', auth, getContinueWatching);

// GET /api/watch/progress/:id  (protected)
router.get('/progress/:id', auth, getVideoProgress);

// DELETE /api/watch/history/:id  (protected)
router.delete('/history/:id', auth, clearHistory);

module.exports = router;