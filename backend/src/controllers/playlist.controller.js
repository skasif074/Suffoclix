const db = require('../config/db');

// ─────────────────────────────────────────────
// CREATE PLAYLIST (Admin only)
// ─────────────────────────────────────────────
const createPlaylist = async (req, res) => {
  try {
    const { title, description, is_featured } = req.body;

    if (!title) {
      return res.status(400).json({ 
        success: false, 
        message: 'Playlist title is required.' 
      });
    }

    const [result] = await db.query(
      `INSERT INTO playlists (title, description, is_featured, created_by) 
       VALUES (?, ?, ?, ?)`,
      [title, description || null, is_featured || false, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Playlist created successfully!',
      playlist: {
        id: result.insertId,
        title,
        description,
        is_featured: is_featured || false
      }
    });

  } catch (err) {
    console.error('CreatePlaylist error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// GET ALL PLAYLISTS
// ─────────────────────────────────────────────
const getAllPlaylists = async (req, res) => {
  try {
    const [playlists] = await db.query(
      `SELECT p.*, 
        COUNT(pi.id) as video_count 
       FROM playlists p
       LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
       GROUP BY p.id
       ORDER BY p.is_featured DESC, p.created_at DESC`
    );

    res.json({ success: true, playlists });

  } catch (err) {
    console.error('GetAllPlaylists error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// GET SINGLE PLAYLIST WITH VIDEOS
// ─────────────────────────────────────────────
const getPlaylist = async (req, res) => {
  try {
    const [playlists] = await db.query(
      'SELECT * FROM playlists WHERE id = ?',
      [req.params.id]
    );

    if (playlists.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Playlist not found.' 
      });
    }

    // Get videos inside this playlist
    const [videos] = await db.query(
      `SELECT v.*, pi.sort_order 
       FROM videos v
       JOIN playlist_items pi ON v.id = pi.content_id
       WHERE pi.playlist_id = ?
       ORDER BY pi.sort_order ASC`,
      [req.params.id]
    );

    res.json({
      success: true,
      playlist: {
        ...playlists[0],
        videos
      }
    });

  } catch (err) {
    console.error('GetPlaylist error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// ADD VIDEO TO PLAYLIST (Admin only)
// ─────────────────────────────────────────────
const addToPlaylist = async (req, res) => {
  try {
    const { content_id, sort_order } = req.body;
    const playlist_id = req.params.id;

    if (!content_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'content_id is required.' 
      });
    }

    // Check playlist exists
    const [playlists] = await db.query(
      'SELECT id FROM playlists WHERE id = ?', [playlist_id]
    );
    if (playlists.length === 0) {
      return res.status(404).json({ 
        success: false, message: 'Playlist not found.' 
      });
    }

    // Check video exists
    const [videos] = await db.query(
      'SELECT id FROM videos WHERE id = ?', [content_id]
    );
    if (videos.length === 0) {
      return res.status(404).json({ 
        success: false, message: 'Video not found.' 
      });
    }

    await db.query(
      `INSERT INTO playlist_items (playlist_id, content_id, sort_order) 
       VALUES (?, ?, ?)`,
      [playlist_id, content_id, sort_order || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Video added to playlist!'
    });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        success: false, 
        message: 'Video already in this playlist.' 
      });
    }
    console.error('AddToPlaylist error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// REMOVE VIDEO FROM PLAYLIST (Admin only)
// ─────────────────────────────────────────────
const removeFromPlaylist = async (req, res) => {
  try {
    const { playlist_id, content_id } = req.params;

    await db.query(
      'DELETE FROM playlist_items WHERE playlist_id = ? AND content_id = ?',
      [playlist_id, content_id]
    );

    res.json({ success: true, message: 'Video removed from playlist.' });

  } catch (err) {
    console.error('RemoveFromPlaylist error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// DELETE PLAYLIST (Admin only)
// ─────────────────────────────────────────────
const deletePlaylist = async (req, res) => {
  try {
    const [playlists] = await db.query(
      'SELECT id FROM playlists WHERE id = ?', [req.params.id]
    );

    if (playlists.length === 0) {
      return res.status(404).json({ 
        success: false, message: 'Playlist not found.' 
      });
    }

    await db.query('DELETE FROM playlists WHERE id = ?', [req.params.id]);

    res.json({ success: true, message: 'Playlist deleted successfully.' });

  } catch (err) {
    console.error('DeletePlaylist error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { 
  createPlaylist, 
  getAllPlaylists, 
  getPlaylist, 
  addToPlaylist, 
  removeFromPlaylist,
  deletePlaylist
};