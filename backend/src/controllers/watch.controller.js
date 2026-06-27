const db = require('../config/db');

// ─────────────────────────────────────────────
// UPDATE WATCH PROGRESS
// Called every ~10 seconds from video player
// ─────────────────────────────────────────────
const updateProgress = async (req, res) => {
  try {
    const { content_id, watched_seconds, total_seconds } = req.body;
    const user_id = req.user.id;

    if (!content_id || watched_seconds === undefined) {
      return res.status(400).json({
        success: false,
        message: 'content_id and watched_seconds are required.'
      });
    }

    // Mark completed if watched 90% or more
    const completed = total_seconds > 0 
      ? (watched_seconds / total_seconds) >= 0.9 
      : false;

    // Insert or update watch history
    await db.query(
      `INSERT INTO watch_history 
        (user_id, content_id, watched_seconds, total_seconds, completed)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        watched_seconds = VALUES(watched_seconds),
        total_seconds = VALUES(total_seconds),
        completed = VALUES(completed),
        last_watched = CURRENT_TIMESTAMP`,
      [user_id, content_id, watched_seconds, total_seconds || 0, completed]
    );

    res.json({ 
      success: true, 
      message: 'Progress saved.',
      completed
    });

  } catch (err) {
    console.error('UpdateProgress error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// GET WATCH HISTORY
// ─────────────────────────────────────────────
const getHistory = async (req, res) => {
  try {
    const user_id = req.user.id;

    const [history] = await db.query(
      `SELECT 
        wh.id,
        wh.watched_seconds,
        wh.total_seconds,
        wh.completed,
        wh.last_watched,
        v.id as video_id,
        v.title,
        v.type,
        v.genre,
        v.thumbnail_path,
        v.duration_seconds,
        ROUND((wh.watched_seconds / NULLIF(wh.total_seconds, 0)) * 100) as progress_percent
       FROM watch_history wh
       JOIN videos v ON wh.content_id = v.id
       WHERE wh.user_id = ?
       ORDER BY wh.last_watched DESC`,
      [user_id]
    );

    res.json({ success: true, history });

  } catch (err) {
    console.error('GetHistory error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// GET CONTINUE WATCHING
// Videos not completed, watched recently
// ─────────────────────────────────────────────
const getContinueWatching = async (req, res) => {
  try {
    const user_id = req.user.id;

    const [videos] = await db.query(
      `SELECT 
        wh.watched_seconds,
        wh.total_seconds,
        wh.last_watched,
        v.id as video_id,
        v.title,
        v.type,
        v.genre,
        v.thumbnail_path,
        ROUND((wh.watched_seconds / NULLIF(wh.total_seconds, 0)) * 100) as progress_percent
       FROM watch_history wh
       JOIN videos v ON wh.content_id = v.id
       WHERE wh.user_id = ? AND wh.completed = FALSE
       ORDER BY wh.last_watched DESC
       LIMIT 10`,
      [user_id]
    );

    res.json({ success: true, videos });

  } catch (err) {
    console.error('GetContinueWatching error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// GET PROGRESS FOR SINGLE VIDEO
// Used to resume video at last position
// ─────────────────────────────────────────────
const getVideoProgress = async (req, res) => {
  try {
    const user_id = req.user.id;
    const content_id = req.params.id;

    const [rows] = await db.query(
      `SELECT watched_seconds, total_seconds, completed 
       FROM watch_history 
       WHERE user_id = ? AND content_id = ?`,
      [user_id, content_id]
    );

    if (rows.length === 0) {
      return res.json({ 
        success: true, 
        progress: { watched_seconds: 0, completed: false } 
      });
    }

    res.json({ success: true, progress: rows[0] });

  } catch (err) {
    console.error('GetVideoProgress error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// CLEAR HISTORY (single video)
// ─────────────────────────────────────────────
const clearHistory = async (req, res) => {
  try {
    await db.query(
      'DELETE FROM watch_history WHERE user_id = ? AND content_id = ?',
      [req.user.id, req.params.id]
    );

    res.json({ success: true, message: 'History cleared.' });

  } catch (err) {
    console.error('ClearHistory error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { 
  updateProgress, 
  getHistory, 
  getContinueWatching, 
  getVideoProgress,
  clearHistory
};