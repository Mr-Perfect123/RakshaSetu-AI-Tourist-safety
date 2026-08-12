const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Tourist Multi-Step Registration with File Uploads (Photo & ID Proof)
router.post(
  '/register',
  upload.fields([
    { name: 'profile_image', maxCount: 1 },
    { name: 'id_proof', maxCount: 1 }
  ]),
  AuthController.register
);

router.post('/login', AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);

// Dual Email + Phone OTP Verification Routes
router.post('/send-otp', AuthController.sendOTP);
router.post('/verify-otp', AuthController.verifyOTP);
router.post('/verify-email-otp', AuthController.verifyEmailOTP);
router.post('/verify-phone-otp', AuthController.verifyPhoneOTP);
router.post('/resend-email-otp', AuthController.resendEmailOTP);
router.post('/resend-phone-otp', AuthController.resendPhoneOTP);

// Admin 2FA OTP Login Routes
router.post('/admin/login-step1', AuthController.adminLoginStep1);
router.post('/admin/verify-otp', AuthController.adminVerifyOTP);

router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.get('/me', authenticateJWT, AuthController.getCurrentUser);

module.exports = router;
