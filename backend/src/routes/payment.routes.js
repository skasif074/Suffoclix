const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  getPlans, 
  createOrder, 
  verifyPayment,
  getPaymentHistory
} = require('../controllers/payment.controller');

// GET /api/payment/plans (public)
router.get('/plans', getPlans);

// POST /api/payment/create-order (protected)
router.post('/create-order', auth, createOrder);

// POST /api/payment/verify (protected)
router.post('/verify', auth, verifyPayment);

// GET /api/payment/history (protected)
router.get('/history', auth, getPaymentHistory);

module.exports = router;