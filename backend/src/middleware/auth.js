const { verifyAccessToken } = require('../config/jwt');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

/**
 * Verify JWT Access Token
 */
const authenticateJWT = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Access denied. Authorization Bearer token is missing.');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new ApiError(401, 'User account associated with this token no longer exists.');
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired access token.');
  }
});

/**
 * Optional Authentication (Allows both guest tourists & authenticated users)
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id);
      if (user) req.user = user;
    } catch (e) {
      // Continue as guest
    }
  }
  next();
});

/**
 * Role-Based Access Control (RBAC) Authorization
 * @param  {...string} roles Allowed roles (Admin, Tourist, Police, Hospital)
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Forbidden access. User role '${req.user ? req.user.role : 'Guest'}' is not authorized. Required: [${roles.join(', ')}]`)
      );
    }
    next();
  };
};

module.exports = {
  authenticateJWT,
  optionalAuth,
  authorizeRoles
};
