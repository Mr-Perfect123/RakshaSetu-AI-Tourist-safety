const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

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
}

module.exports = AuthController;
