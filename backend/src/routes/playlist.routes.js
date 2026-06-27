const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const {
  createPlaylist,
  getAllPlaylists,
  getPlaylist,
  addToPlaylist,
  removeFromPlaylist,
  deletePlaylist
} = require('../controllers/playlist.controller');

// GET /api/playlists  (public)
router.get('/', getAllPlaylists);

// GET /api/playlists/:id  (public)
router.get('/:id', getPlaylist);

// POST /api/playlists  (admin only)
router.post('/', auth, admin, createPlaylist);

// POST /api/playlists/:id/add-content  (admin only)
router.post('/:id/add-content', auth, admin, addToPlaylist);

// DELETE /api/playlists/:playlist_id/remove/:content_id  (admin only)
router.delete('/:playlist_id/remove/:content_id', auth, admin, removeFromPlaylist);

// DELETE /api/playlists/:id  (admin only)
router.delete('/:id', auth, admin, deletePlaylist);

module.exports = router;