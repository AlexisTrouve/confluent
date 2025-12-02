const rateLimit = require('express-rate-limit');

// Rate limiter global par IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // max 200 requêtes par IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' }
});

// Rate limiter pour les traductions (plus strict)
const translationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // max 10 traductions par minute
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip si l'utilisateur est admin
    return req.user && req.user.role === 'admin';
  },
  message: { error: 'Too many translation requests. Please wait a moment.' }
});

// Rate limiter pour les endpoints sensibles (admin)
const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many admin requests.' }
});

module.exports = {
  globalLimiter,
  translationLimiter,
  adminLimiter
};
