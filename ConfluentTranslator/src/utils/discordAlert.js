/**
 * discordAlert — alerte Discord sur erreur applicative (couche 1 du monitoring).
 *
 * QUOI : `reportError(label, error, meta)` poste un message sur un webhook Discord quand une VRAIE
 *        erreur survient (5xx, exception, échec proxy/agent). PAS sur le 422 attendu (échec franc).
 * POURQUOI : ton état final = « systèmes monitorés, intervenir sur les exceptions ». Sans ça,
 *        une panne (proxy down, deploy cassé) passe inaperçue. Discord = canal instantané, gratuit.
 * COMMENT : best-effort ABSOLU — si l'alerte échoue (réseau, pas de webhook), on ne casse JAMAIS
 *        l'app (jamais de throw, jamais de await bloquant). Throttle in-memory par label (anti-spam :
 *        une boucle d'erreur ne doit pas noyer le salon). Webhook lu dans l'env (secret, hors git).
 *        Pas de dépendance : module https natif, POST fire-and-forget.
 */
'use strict';
const https = require('https');
const os = require('os');

const THROTTLE_MS = 5 * 60 * 1000;     // 1 alerte par label / 5 min
const HOST = os.hostname();
const lastSent = new Map();            // label → timestamp ms (dédup)

/**
 * Décide si on alerte pour ce label maintenant (throttle). Exporté pour test déterministe.
 * Effet de bord : mémorise l'instant si la réponse est true.
 */
function shouldAlert(label, now = Date.now(), throttleMs = THROTTLE_MS) {
  // 1er appel d'un label → toujours alerter (cas « jamais vu » explicite, pas de prev=0 fragile).
  if (lastSent.has(label) && (now - lastSent.get(label)) < throttleMs) return false;  // doublon récent → coupé
  lastSent.set(label, now);
  return true;
}

/**
 * Poste une alerte d'erreur sur Discord. Best-effort, non bloquant, ne throw jamais.
 * @param {string} label  - catégorie courte (ex: 'translate 500', 'express GET /api/x')
 * @param {Error|string} error - l'erreur
 * @param {Object} [meta] - contexte additionnel (ex: { fr: '...', model: '...' })
 */
function reportError(label, error, meta = {}) {
  try {
    const webhook = process.env.DISCORD_WEBHOOK_URL;     // lu à l'appel → testable + picks-up env
    if (!webhook) return;                                // pas de webhook configuré → no-op (dev safe)
    if (!shouldAlert(label)) return;                     // throttle anti-spam

    const msg = (error && error.message) ? error.message : String(error || 'erreur inconnue');
    const metaStr = Object.entries(meta)
      .map(([k, v]) => `${k}=${String(v == null ? '' : v).slice(0, 140)}`).join(' · ');
    const content = (`🔴 **Confluent** \`[${HOST}]\` — **${label}**\n` +
      '```' + msg.slice(0, 600) + '```' + (metaStr ? '\n' + metaStr : '')).slice(0, 1900);

    const u = new URL(webhook);
    const body = JSON.stringify({ content });
    const req = https.request(
      { hostname: u.hostname, path: u.pathname + u.search, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, timeout: 5000 },
      (res) => { res.resume(); });                        // on draine, on ignore la réponse
    req.on('error', () => {});                            // échec d'alerte → silencieux (jamais casser l'app)
    req.on('timeout', () => req.destroy());
    req.write(body); req.end();
  } catch (_) { /* best-effort : jamais throw */ }
}

module.exports = { reportError, shouldAlert, _resetThrottle: () => lastSent.clear() };
