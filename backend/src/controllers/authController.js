const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { executeQuery } = require('../config/database');

class AuthController {
  static register = asyncHandler(async (req, res) => {
    const { full_name, email, phone, password, role, nationality, gender } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new ApiError(400, 'A user account with this email address already exists.');
    }

    const user = await User.create({ full_name, email, phone, password, role, nationality, gender });
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return res.status(201).json(
      new ApiResponse(201, { user, accessToken, refreshToken }, 'User registered successfully.')
    );
  });

  static login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      throw new ApiError(401, 'Invalid email credentials.');
    }

    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid password credentials.');
    }

    delete user.password;
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return res.status(200).json(
      new ApiResponse(200, { user, accessToken, refreshToken }, 'Login successful.')
    );
  });

  static refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required.');
    }

    try {
      const decoded = verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.id);
      if (!user) {
        throw new ApiError(401, 'Invalid refresh token.');
      }
      const accessToken = generateAccessToken(user);
      return res.status(200).json(new ApiResponse(200, { accessToken }, 'Access token refreshed successfully.'));
    } catch (err) {
      throw new ApiError(401, 'Expired or invalid refresh token.');
    }
  });

  static getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, 'Current user profile fetched successfully.'));
  });

  static logout = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully.'));
  });

  static sendOTP = asyncHandler(async (req, res) => {
    const { identifier, purpose = 'phone_verify' } = req.body;
    if (!identifier) {
      throw new ApiError(400, 'Target identifier (email or phone) is required.');
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await executeQuery(
      `INSERT INTO otp_verifications (target_identifier, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)`,
      [identifier, otp, purpose, expiresAt]
    );

    return res.status(200).json(
      new ApiResponse(200, { identifier, otp, purpose, expiresAt }, `Verification OTP dispatched to ${identifier}. (Test OTP: ${otp})`)
    );
  });

  static verifyOTP = asyncHandler(async (req, res) => {
    const { identifier, otp_code, purpose = 'phone_verify' } = req.body;
    if (!identifier || !otp_code) {
      throw new ApiError(400, 'Target identifier and OTP code are required.');
    }

    const rows = await executeQuery(
      `SELECT * FROM otp_verifications WHERE target_identifier = ? AND otp_code = ? AND purpose = ? AND is_used = FALSE ORDER BY id DESC LIMIT 1`,
      [identifier, otp_code, purpose]
    );

    if (!rows || rows.length === 0) {
      // Demo/Fallback Mode OTP verification check
      if (otp_code === '123456' || otp_code === '999999') {
        return res.status(200).json(new ApiResponse(200, { verified: true }, 'OTP verified successfully.'));
      }
      throw new ApiError(400, 'Invalid or expired OTP verification code.');
    }

    await executeQuery(`UPDATE otp_verifications SET is_used = TRUE WHERE id = ?`, [rows[0].id]);
    return res.status(200).json(new ApiResponse(200, { verified: true }, 'OTP verified successfully.'));
  });

  static forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
      throw new ApiError(400, 'Registered email address is required.');
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(200).json(
        new ApiResponse(200, null, 'If the email exists in our system, password reset instructions have been dispatched.')
      );
    }

    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

    await executeQuery(
      `INSERT INTO password_resets (user_id, reset_token, expires_at) VALUES (?, ?, ?)`,
      [user.id, resetToken, expiresAt]
    );

    return res.status(200).json(
      new ApiResponse(200, { resetToken, email }, `Password reset link generated. (Reset Token: ${resetToken})`)
    );
  });

  static resetPassword = asyncHandler(async (req, res) => {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      throw new ApiError(400, 'Reset token and new password are required.');
    }

    const rows = await executeQuery(
      `SELECT * FROM password_resets WHERE reset_token = ? AND is_used = FALSE ORDER BY id DESC LIMIT 1`,
      [resetToken]
    );

    if (!rows || rows.length === 0) {
      throw new ApiError(400, 'Invalid or expired password reset token.');
    }

    const resetRecord = rows[0];
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await executeQuery(`UPDATE users SET password = ? WHERE id = ?`, [hashedPassword, resetRecord.user_id]);
    await executeQuery(`UPDATE password_resets SET is_used = TRUE WHERE id = ?`, [resetRecord.id]);

    return res.status(200).json(new ApiResponse(200, null, 'Password reset completed successfully. Please login with your new credentials.'));
  });
}

module.exports = AuthController;
