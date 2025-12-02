const express = require('express');
const router = express.Router();
const { requireAdmin, createToken, listTokens, disableToken, enableToken, deleteToken, getGlobalStats } = require('./auth');
const { getLogs, getLogStats } = require('./logger');
const { adminLimiter } = require('./rateLimiter');

// Appliquer l'auth et rate limiting à toutes les routes admin
router.use(requireAdmin);
router.use(adminLimiter);

// Liste des tokens
router.get('/tokens', (req, res) => {
  const tokens = listTokens();
  res.json({ tokens });
});

// Créer un nouveau token
router.post('/tokens', (req, res) => {
  const { name, role = 'user', dailyLimit = 100 } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Missing parameter: name' });
  }

  const token = createToken(name, role, dailyLimit);
  res.json({
    success: true,
    token: {
      ...token,
      apiKey: token.apiKey // Retourner la clé complète seulement à la création
    }
  });
});

// Désactiver un token
router.post('/tokens/:id/disable', (req, res) => {
  const { id } = req.params;
  const success = disableToken(id);

  if (success) {
    res.json({ success: true, message: 'Token disabled' });
  } else {
    res.status(404).json({ error: 'Token not found' });
  }
});

// Réactiver un token
router.post('/tokens/:id/enable', (req, res) => {
  const { id } = req.params;
  const success = enableToken(id);

  if (success) {
    res.json({ success: true, message: 'Token enabled' });
  } else {
    res.status(404).json({ error: 'Token not found' });
  }
});

// Supprimer un token
router.delete('/tokens/:id', (req, res) => {
  const { id } = req.params;
  const success = deleteToken(id);

  if (success) {
    res.json({ success: true, message: 'Token deleted' });
  } else {
    res.status(404).json({ error: 'Token not found or cannot be deleted' });
  }
});

// Stats globales
router.get('/stats', (req, res) => {
  const tokenStats = getGlobalStats();
  const logStats = getLogStats();

  res.json({
    tokens: tokenStats,
    logs: logStats
  });
});

// Logs
router.get('/logs', (req, res) => {
  const { limit = 100, user, path, statusCode } = req.query;

  const filter = {};
  if (user) filter.user = user;
  if (path) filter.path = path;
  if (statusCode) filter.statusCode = parseInt(statusCode);

  const logs = getLogs(parseInt(limit), filter);
  res.json({ logs });
});

module.exports = router;
