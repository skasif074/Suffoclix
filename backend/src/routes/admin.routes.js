const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const {
  getAllUsers,
  getDashboardStats,
  updateSubscriptionPrice,
  getSubscriptionSettings,
  toggleUserSubscription,
  deleteUser
} = require('../controllers/admin.controller');

// All admin routes are protected
router.use(auth, admin);

// GET /api/admin/stats
router.get('/stats', getDashboardStats);

// GET /api/admin/users
router.get('/users', getAllUsers);

// DELETE /api/admin/users/:user_id
router.delete('/users/:user_id', deleteUser);

// PATCH /api/admin/users/:user_id/subscription
router.patch('/users/:user_id/subscription', toggleUserSubscription);

// GET /api/admin/subscription
router.get('/subscription', getSubscriptionSettings);

// PUT /api/admin/subscription-price
router.put('/subscription-price', updateSubscriptionPrice);

module.exports = router;