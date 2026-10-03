/**
 * ==============================================================================
 * AUTHENTICATION ROUTES
 * ==============================================================================
 * 
 * CONCEPT EXPLANATION FOR BEGINNERS:
 * Express Routers allow you to break down your application routing into modular,
 * mountable route handlers.
 * 
 * Here we define routes under the prefix `/api/auth`:
 * - POST /api/auth/register -> Creates new customer or service provider account
 * - POST /api/auth/login    -> Authenticates user and returns JWT
 * - GET  /api/auth/me       -> Protected route returning current user's profile
 */

const express = require('express');
const router = express.Router();

const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public endpoints
router.post('/register', register);
router.post('/login', login);

// Private endpoint (requires valid Bearer token)
router.get('/me', protect, getMe);

module.exports = router;
