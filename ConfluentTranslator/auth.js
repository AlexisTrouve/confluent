const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const TOKENS_FILE = path.join(__dirname, 'data', 'tokens.json');
const JWT_SECRET = process.env.JWT_SECRET || 'confluent-secret-key-change-in-production';

// Structure des tokens
let tokens = {};

function loadTokens() {
  try {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(TOKENS_FILE)) {
      return JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading tokens:', error);
  }

  // Default: créer un token admin si aucun token n'existe
  const defaultTokens = {
    admin: {
      id: 'admin',
      name: 'Admin',
      role: 'admin',
      apiKey: uuidv4(),
      createdAt: new Date().toISOString(),
      active: true,
      requestsToday: 0,
      dailyLimit: -1 // illimité
    }
  };

  saveTokens(defaultTokens);
  console.log('🔑 Token admin créé:', defaultTokens.admin.apiKey);
  return defaultTokens;
}

function saveTokens() {
  try {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
  } catch (error) {
    console.error('Error saving tokens:', error);
  }
}

// Middleware d'authentification
function authenticate(req, res, next) {
  // Routes publiques (GET seulement)
  const publicRoutes = ['/api/lexique', '/api/stats', '/lexique'];
  if (req.method === 'GET' && publicRoutes.some(route => req.path.startsWith(route))) {
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  // Chercher le token
  const token = Object.values(tokens).find(t => t.apiKey === apiKey);

  if (!token) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  if (!token.active) {
    return res.status(403).json({ error: 'Token disabled' });
  }

  // Vérifier la limite quotidienne
  const today = new Date().toISOString().split('T')[0];
  const tokenToday = token.lastUsed?.split('T')[0];

  if (tokenToday !== today) {
    token.requestsToday = 0;
  }

  if (token.dailyLimit > 0 && token.requestsToday >= token.dailyLimit) {
    return res.status(429).json({ error: 'Daily limit reached' });
  }

  // Mettre à jour les stats
  token.requestsToday++;
  token.lastUsed = new Date().toISOString();
  saveTokens();

  // Ajouter les infos au req
  req.user = {
    id: token.id,
    name: token.name,
    role: token.role
  };

  next();
}

// Middleware admin uniquement
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Créer un nouveau token
function createToken(name, role = 'user', dailyLimit = 100) {
  const id = uuidv4();
  const apiKey = uuidv4();

  tokens[id] = {
    id,
    name,
    role,
    apiKey,
    createdAt: new Date().toISOString(),
    active: true,
    requestsToday: 0,
    dailyLimit
  };

  saveTokens();
  return tokens[id];
}

// Lister tous les tokens
function listTokens() {
  return Object.values(tokens).map(t => ({
    id: t.id,
    name: t.name,
    role: t.role,
    apiKey: t.apiKey.substring(0, 8) + '...',
    createdAt: t.createdAt,
    active: t.active,
    requestsToday: t.requestsToday,
    dailyLimit: t.dailyLimit,
    lastUsed: t.lastUsed
  }));
}

// Désactiver un token
function disableToken(id) {
  if (tokens[id]) {
    tokens[id].active = false;
    saveTokens();
    return true;
  }
  return false;
}

// Réactiver un token
function enableToken(id) {
  if (tokens[id]) {
    tokens[id].active = true;
    saveTokens();
    return true;
  }
  return false;
}

// Supprimer un token
function deleteToken(id) {
  if (id === 'admin') {
    return false; // Ne pas supprimer l'admin
  }
  if (tokens[id]) {
    delete tokens[id];
    saveTokens();
    return true;
  }
  return false;
}

// Stats globales
function getGlobalStats() {
  const tokenList = Object.values(tokens);
  return {
    totalTokens: tokenList.length,
    activeTokens: tokenList.filter(t => t.active).length,
    totalRequestsToday: tokenList.reduce((sum, t) => sum + t.requestsToday, 0)
  };
}

// Charger les tokens au démarrage
tokens = loadTokens();

module.exports = {
  authenticate,
  requireAdmin,
  createToken,
  listTokens,
  disableToken,
  enableToken,
  deleteToken,
  getGlobalStats,
  loadTokens,
  tokens
};
