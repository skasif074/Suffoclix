const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const auth = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/google
router.post('/google', authController.googleLogin);

// GET /api/auth/me (protected)
router.get('/me', auth, authController.getMe);

module.exports = router;