const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production' || process.env.DEV_OTP_ENABLED === 'true';

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 10000 : 500, // Generous limit in dev to allow interactive dashboard testing
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

const authRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: isDev ? 500 : 30, // max attempts
  message: {
    success: false,
    statusCode: 429,
    message: 'Excessive login attempts detected. Please try again later.'
  }
});

const sosRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isDev ? 100 : 15, // Allows rapid SOS triggers in genuine panic without crashing server
  message: {
    success: false,
    statusCode: 429,
    message: 'SOS trigger limit reached. Emergency dispatches in progress.'
  }
});

module.exports = {
  globalRateLimiter,
  authRateLimiter,
  sosRateLimiter
};
