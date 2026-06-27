const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/db');
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─────────────────────────────────────────────
// SUBSCRIPTION PLANS
// ─────────────────────────────────────────────
const PLANS = [
  { id: 1, name: 'Basic',    months: 1, price: 1,  days: 30  },
  { id: 2, name: 'Standard', months: 2, price: 2,  days: 60  },
  { id: 3, name: 'Premium',  months: 3, price: 3,  days: 90  },
];

// ─────────────────────────────────────────────
// GET PLANS
// ─────────────────────────────────────────────
const getPlans = async (req, res) => {
  try {
    res.json({ success: true, plans: PLANS });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// CREATE RAZORPAY ORDER
// ─────────────────────────────────────────────
const createOrder = async (req, res) => {
  try {
    const { plan_id } = req.body;

    const plan = PLANS.find(p => p.id === parseInt(plan_id));
    if (!plan) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid plan selected.' 
      });
    }

    // Create Razorpay order
    // Amount in paise (₹1 = 100 paise)
    const order = await razorpay.orders.create({
      amount: plan.price * 100,
      currency: 'INR',
      receipt: `suffoclix_${req.user.id}_${Date.now()}`,
      notes: {
        user_id: req.user.id,
        plan_id: plan.id,
        plan_name: plan.name,
        months: plan.months
      }
    });

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        plan
      },
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (err) {
    console.error('CreateOrder error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// VERIFY PAYMENT + ACTIVATE SUBSCRIPTION
// ─────────────────────────────────────────────
const verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      plan_id
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment verification failed. Invalid signature.' 
      });
    }

    // Get plan
    const plan = PLANS.find(p => p.id === parseInt(plan_id));
    if (!plan) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid plan.' 
      });
    }

    // Activate subscription
    const subscribed_at = new Date();
    const subscription_expires_at = new Date(
      Date.now() + plan.days * 24 * 60 * 60 * 1000
    );

    await db.query(
      `UPDATE users 
       SET is_subscribed = TRUE, 
           subscribed_at = ?, 
           subscription_expires_at = ?
       WHERE id = ?`,
      [subscribed_at, subscription_expires_at, req.user.id]
    );

    // Save payment record
    await db.query(
      `CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        razorpay_order_id VARCHAR(255),
        razorpay_payment_id VARCHAR(255),
        plan_name VARCHAR(100),
        amount DECIMAL(10,2),
        months INT,
        status VARCHAR(50) DEFAULT 'success',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`
    );

    await db.query(
      `INSERT INTO payments 
        (user_id, razorpay_order_id, razorpay_payment_id, plan_name, amount, months)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        razorpay_order_id,
        razorpay_payment_id,
        plan.name,
        plan.price,
        plan.months
      ]
    );

    res.json({
      success: true,
      message: `🎉 Payment successful! ${plan.name} plan activated for ${plan.months} month(s).`,
      subscription: {
        plan: plan.name,
        months: plan.months,
        expires_at: subscription_expires_at
      }
    });

  } catch (err) {
    console.error('VerifyPayment error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// GET PAYMENT HISTORY
// ─────────────────────────────────────────────
const getPaymentHistory = async (req, res) => {
  try {
    await db.query(
      `CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        razorpay_order_id VARCHAR(255),
        razorpay_payment_id VARCHAR(255),
        plan_name VARCHAR(100),
        amount DECIMAL(10,2),
        months INT,
        status VARCHAR(50) DEFAULT 'success',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`
    );

    const [payments] = await db.query(
      `SELECT * FROM payments 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, payments });

  } catch (err) {
    console.error('GetPaymentHistory error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getPlans, createOrder, verifyPayment, getPaymentHistory };