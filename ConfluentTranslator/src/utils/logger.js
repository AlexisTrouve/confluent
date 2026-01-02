const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, 'logs');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10 MB

// Créer le dossier logs s'il n'existe pas
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function getLogFile() {
  const today = new Date().toISOString().split('T')[0];
  return path.join(LOGS_DIR, `requests-${today}.log`);
}

function log(type, data) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type,
    ...data
  };

  const logFile = getLogFile();
  const logLine = JSON.stringify(logEntry) + '\n';

  fs.appendFileSync(logFile, logLine);

  // Rotation si le fichier devient trop gros
  try {
    const stats = fs.statSync(logFile);
    if (stats.size > MAX_LOG_SIZE) {
      const archiveName = logFile.replace('.log', `-${Date.now()}.log`);
      fs.renameSync(logFile, archiveName);
    }
  } catch (error) {
    console.error('Error rotating log file:', error);
  }
}

// Middleware de logging
function requestLogger(req, res, next) {
  const start = Date.now();

  // Capturer la réponse
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - start;

    log('request', {
      method: req.method,
      path: req.path,
      ip: req.ip || req.connection.remoteAddress,
      user: req.user?.name || 'anonymous',
      userId: req.user?.id || null,
      statusCode: res.statusCode,
      duration,
      userAgent: req.headers['user-agent']
    });

    originalSend.apply(res, arguments);
  };

  next();
}

// Lire les logs
function getLogs(limit = 100, filter = {}) {
  const logFile = getLogFile();

  if (!fs.existsSync(logFile)) {
    return [];
  }

  const logs = fs.readFileSync(logFile, 'utf8')
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return null;
      }
    })
    .filter(log => log !== null);

  // Appliquer les filtres
  let filtered = logs;

  if (filter.user) {
    filtered = filtered.filter(log => log.user === filter.user);
  }

  if (filter.path) {
    filtered = filtered.filter(log => log.path && log.path.includes(filter.path));
  }

  if (filter.statusCode) {
    filtered = filtered.filter(log => log.statusCode === filter.statusCode);
  }

  // Retourner les derniers logs
  return filtered.slice(-limit).reverse();
}

// Stats des logs
function getLogStats() {
  const logs = getLogs(1000);

  const stats = {
    totalRequests: logs.length,
    byUser: {},
    byPath: {},
    byStatus: {},
    avgDuration: 0,
    errors: 0
  };

  let totalDuration = 0;

  logs.forEach(log => {
    // Par utilisateur
    stats.byUser[log.user] = (stats.byUser[log.user] || 0) + 1;

    // Par path
    stats.byPath[log.path] = (stats.byPath[log.path] || 0) + 1;

    // Par status
    stats.byStatus[log.statusCode] = (stats.byStatus[log.statusCode] || 0) + 1;

    // Durée
    totalDuration += log.duration || 0;

    // Erreurs
    if (log.statusCode >= 400) {
      stats.errors++;
    }
  });

  stats.avgDuration = logs.length > 0 ? Math.round(totalDuration / logs.length) : 0;

  return stats;
}

module.exports = {
  log,
  requestLogger,
  getLogs,
  getLogStats
};
