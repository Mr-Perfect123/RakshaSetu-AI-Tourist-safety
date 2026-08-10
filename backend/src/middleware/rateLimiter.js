const rateLimit = require('express-rate-limit');

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
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
  max: 20, // max 20 login/register attempts
  message: {
    success: false,
    statusCode: 429,
    message: 'Excessive login attempts detected. Please try again later.'
  }
});

const sosRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10, // Allows rapid SOS triggers in genuine panic without crashing server
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
