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
      // Tracking des tokens LLM
      llmTokens: {
        totalInput: 0,
        totalOutput: 0,
        today: {
          input: 0,
          output: 0,
          date: new Date().toISOString().split('T')[0]
        }
      }
    }
  };

  saveTokens(defaultTokens);
  console.log('🔑 Token admin créé:', defaultTokens.admin.apiKey);
  return defaultTokens;
}

function saveTokens(tokensToSave = tokens) {
  try {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokensToSave, null, 2));
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

  // Mettre à jour les stats
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
function createToken(name, role = 'user') {
  const id = uuidv4();
  const apiKey = uuidv4();

  tokens[id] = {
    id,
    name,
    role,
    apiKey,
    createdAt: new Date().toISOString(),
    active: true,
    // Tracking des tokens LLM
    llmTokens: {
      totalInput: 0,
      totalOutput: 0,
      today: {
        input: 0,
        output: 0,
        date: new Date().toISOString().split('T')[0]
      }
    }
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
    activeTokens: tokenList.filter(t => t.active).length
  };
}

// Vérifier la limite de requêtes LLM
function checkLLMLimit(apiKey) {
  const token = Object.values(tokens).find(t => t.apiKey === apiKey);

  if (!token) return { allowed: false, error: 'Invalid API key' };

  // Initialiser si n'existe pas
  if (token.llmRequestsToday === undefined) {
    token.llmRequestsToday = 0;
    token.llmDailyLimit = token.role === 'admin' ? -1 : 20;
    saveTokens();
  }

  // Initialiser llmTokens.today.date si n'existe pas
  if (!token.llmTokens) {
    token.llmTokens = {
      totalInput: 0,
      totalOutput: 0,
      today: {
        input: 0,
        output: 0,
        date: new Date().toISOString().split('T')[0]
      }
    };
    saveTokens();
  }

  const today = new Date().toISOString().split('T')[0];

  // Reset si changement de jour
  if (token.llmTokens.today.date !== today) {
    token.llmRequestsToday = 0;
    token.llmTokens.today = {
      input: 0,
      output: 0,
      date: today
    };
    saveTokens();
  }

  // Vérifier la limite (-1 = illimité pour admin)
  if (token.llmDailyLimit > 0 && token.llmRequestsToday >= token.llmDailyLimit) {
    return {
      allowed: false,
      error: 'Daily LLM request limit reached',
      limit: token.llmDailyLimit,
      used: token.llmRequestsToday
    };
  }

  return {
    allowed: true,
    remaining: token.llmDailyLimit > 0 ? token.llmDailyLimit - token.llmRequestsToday : -1,
    limit: token.llmDailyLimit,
    used: token.llmRequestsToday
  };
}

// Tracker les tokens LLM utilisés
function trackLLMUsage(apiKey, inputTokens, outputTokens) {
  const token = Object.values(tokens).find(t => t.apiKey === apiKey);

  if (!token) return false;

  // Initialiser la structure si elle n'existe pas (tokens existants)
  if (!token.llmTokens) {
    token.llmTokens = {
      totalInput: 0,
      totalOutput: 0,
      today: {
        input: 0,
        output: 0,
        date: new Date().toISOString().split('T')[0]
      }
    };
  }

  // Initialiser rate limiting LLM si n'existe pas
  if (token.llmRequestsToday === undefined) {
    token.llmRequestsToday = 0;
    token.llmDailyLimit = token.role === 'admin' ? -1 : 20;
  }

  const today = new Date().toISOString().split('T')[0];

  // Reset des compteurs quotidiens si changement de jour
  if (token.llmTokens.today.date !== today) {
    token.llmTokens.today = {
      input: 0,
      output: 0,
      date: today
    };
    token.llmRequestsToday = 0; // Reset compteur requêtes LLM
  }

  // Incrémenter les compteurs
  token.llmTokens.totalInput += inputTokens;
  token.llmTokens.totalOutput += outputTokens;
  token.llmTokens.today.input += inputTokens;
  token.llmTokens.today.output += outputTokens;
  token.llmRequestsToday++;

  saveTokens();
  return true;
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
  trackLLMUsage,
  checkLLMLimit,
  tokens
};
