const db = require('../config/db');

// ─────────────────────────────────────────────
// GET ALL USERS
// ─────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT id, name, email, role, is_subscribed, 
        subscribed_at, subscription_expires_at, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );

    res.json({ success: true, users });

  } catch (err) {
    console.error('GetAllUsers error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// GET DASHBOARD STATS
// ─────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const [[{ total_users }]] = await db.query(
      'SELECT COUNT(*) as total_users FROM users WHERE role = "user"'
    );

    const [[{ subscribed_users }]] = await db.query(
      'SELECT COUNT(*) as subscribed_users FROM users WHERE is_subscribed = TRUE'
    );

    const [[{ total_videos }]] = await db.query(
      'SELECT COUNT(*) as total_videos FROM videos'
    );

    const [[{ total_playlists }]] = await db.query(
      'SELECT COUNT(*) as total_playlists FROM playlists'
    );

    const [[{ total_watches }]] = await db.query(
      'SELECT COUNT(*) as total_watches FROM watch_history'
    );

    const [{ price, currency, duration_days }] = (await db.query(
      'SELECT price, currency, duration_days FROM subscription_settings LIMIT 1'
    ))[0];

    res.json({
      success: true,
      stats: {
        total_users,
        subscribed_users,
        total_videos,
        total_playlists,
        total_watches,
        subscription: { price, currency, duration_days }
      }
    });

  } catch (err) {
    console.error('GetDashboardStats error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// UPDATE SUBSCRIPTION PRICE
// ─────────────────────────────────────────────
const updateSubscriptionPrice = async (req, res) => {
  try {
    const { price, duration_days } = req.body;

    if (!price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid price is required.'
      });
    }

    await db.query(
      `UPDATE subscription_settings 
       SET price = ?, duration_days = ?
       WHERE id = 1`,
      [price, duration_days || 30]
    );

    res.json({
      success: true,
      message: 'Subscription price updated!',
      subscription: { price, duration_days: duration_days || 30 }
    });

  } catch (err) {
    console.error('UpdateSubscriptionPrice error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// GET SUBSCRIPTION SETTINGS
// ─────────────────────────────────────────────
const getSubscriptionSettings = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM subscription_settings LIMIT 1'
    );

    res.json({ success: true, subscription: rows[0] });

  } catch (err) {
    console.error('GetSubscriptionSettings error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// TOGGLE USER SUBSCRIPTION (manual)
// ─────────────────────────────────────────────
const toggleUserSubscription = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { is_subscribed } = req.body;

    const subscribed_at = is_subscribed ? new Date() : null;
    const subscription_expires_at = is_subscribed 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
      : null;

    await db.query(
      `UPDATE users 
       SET is_subscribed = ?, subscribed_at = ?, subscription_expires_at = ?
       WHERE id = ?`,
      [is_subscribed, subscribed_at, subscription_expires_at, user_id]
    );

    res.json({
      success: true,
      message: `User subscription ${is_subscribed ? 'activated' : 'deactivated'}.`
    });

  } catch (err) {
    console.error('ToggleUserSubscription error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// DELETE USER
// ─────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    const [users] = await db.query(
      'SELECT role FROM users WHERE id = ?', [user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (users[0].role === 'admin') {
      return res.status(403).json({ 
        success: false, message: 'Cannot delete admin user.' 
      });
    }

    await db.query('DELETE FROM users WHERE id = ?', [user_id]);

    res.json({ success: true, message: 'User deleted successfully.' });

  } catch (err) {
    console.error('DeleteUser error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getAllUsers,
  getDashboardStats,
  updateSubscriptionPrice,
  getSubscriptionSettings,
  toggleUserSubscription,
  deleteUser
};