const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '300', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
});

const securityMiddleware = [
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
  apiLimiter,
];

module.exports = { securityMiddleware, authLimiter };
