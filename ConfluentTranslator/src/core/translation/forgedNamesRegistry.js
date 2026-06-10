/**
 * forgedNamesRegistry — registre PERSISTANT des noms propres forgés à la volée.
 *
 * QUOI : stocke les noms propres Confluent forgés par `forge_proper_name` (Œil-Bas, le Sans-Sommeil…)
 *        dans un fichier SÉPARÉ (`data/noms-forges.json`), hors des fichiers lexique versionnés.
 *        `lookup(nomFr)` → la forme déjà forgée (ou null) ; `add(entry)` → ajoute + persiste.
 * POURQUOI : un nom doit être STABLE (même personnage = même forme, toujours). Le tool forge UNE
 *        fois, puis ce registre garantit que tout appel ultérieur RENVOIE la même forme (lookup-first)
 *        au lieu de re-forger (ce qui donnerait des noms différents d'une traduction à l'autre).
 *        Fichier séparé volontairement : le serveur prod y écrit à chaud — on ne touche JAMAIS aux
 *        .json du lexique versionnés (sinon le lexique diverge de git). Les noms `provisoire:true`
 *        attendent la bénédiction du créateur, puis seront promus au vrai lexique.
 * COMMENT : cache mémoire chargé paresseusement depuis le fichier ; écriture best-effort (ne throw
 *        JAMAIS — une panne d'écriture ne doit pas casser une traduction). `makeRegistry(path)` permet
 *        d'isoler un registre temporaire pour les tests. Un singleton par défaut sert la prod.
 */
'use strict';
const fs = require('fs');
const path = require('path');

// Sous ConfluentTranslator/data/ (à côté de tokens.json) — état runtime, gitignoré (écrit par le serveur).
const DEFAULT_PATH = path.join(__dirname, '..', '..', '..', 'data', 'noms-forges.json');

// Normalisation des clés FR : minuscules + sans accents + œ→oe (aligné sur le lexique).
function norm(s) {
  return String(s || '').toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

/**
 * Crée un registre lié à un fichier donné (par défaut data/noms-forges.json).
 * @param {string} [filePath]
 */
function makeRegistry(filePath = DEFAULT_PATH) {
  let cache = null;   // { noms: [...] } chargé paresseusement

  function load() {
    if (cache) return cache;
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      cache = Array.isArray(raw.noms) ? raw : { noms: [] };
    } catch (_) {
      cache = { noms: [] };   // fichier absent/illisible → registre vide (pas une erreur)
    }
    return cache;
  }

  /** Renvoie l'entrée déjà forgée pour ce nom FR, ou null. */
  function lookup(nomFr) {
    const k = norm(nomFr);
    if (!k) return null;
    return load().noms.find(n => norm(n.nom_fr) === k) || null;
  }

  /** Ajoute une entrée (idempotent : si le nom existe déjà, renvoie l'existant sans réécrire). */
  function add(entry) {
    const existing = lookup(entry.nom_fr);
    if (existing) return existing;
    const reg = load();
    reg.noms.push(entry);
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(
        { _comment: 'Noms propres forgés à la volée par forge_proper_name. provisoire:true = à bénir/renommer puis promouvoir au lexique. Écrit par le serveur — ne pas éditer à chaud.', noms: reg.noms },
        null, 2));
    } catch (_) { /* best-effort : une panne d'écriture ne casse pas la traduction */ }
    return entry;
  }

  /** Toutes les entrées (pour revue/atelier). */
  function all() { return load().noms.slice(); }

  return { lookup, add, all, _path: filePath, _reset: () => { cache = null; } };
}

// Singleton de production. Chemin surchargé par FORGED_NAMES_PATH (E2E/tests → fichier temp isolé,
// pour ne JAMAIS polluer le registre réel data/noms-forges.json pendant les tests).
const defaultRegistry = makeRegistry(process.env.FORGED_NAMES_PATH || DEFAULT_PATH);

module.exports = { makeRegistry, defaultRegistry, norm };
