const rateLimit = require('express-rate-limit');

// Rate limiter pour les endpoints sensibles (admin)
// Note: Pour les traductions et requêtes LLM, on utilise checkLLMLimit() dans auth.js
// qui gère les limites par API key (plus flexible et précis que les rate limiters par IP)
const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many admin requests.' }
});

module.exports = {
  adminLimiter
};
