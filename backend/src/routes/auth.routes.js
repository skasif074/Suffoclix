const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/auth.controller');
const auth = require('../middleware/auth');
const { register, login, getMe, googleLogin } = require('../controllers/auth.controller');
// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

router.post('/google', googleLogin);
// GET /api/auth/me  (protected)
router.get('/me', auth, getMe);

module.exports = router;