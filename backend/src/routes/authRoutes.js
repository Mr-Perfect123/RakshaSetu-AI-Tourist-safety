const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/auth');
const { registerValidation, loginValidation } = require('../validators/authValidator');
const { authRateLimiter } = require('../middleware/rateLimiter');

router.post('/register', authRateLimiter, registerValidation, AuthController.register);
router.post('/login', authRateLimiter, loginValidation, AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.get('/me', authenticateJWT, AuthController.getCurrentUser);

module.exports = router;
