/**
 * grammarCheck — vérif SYNTAXE/grammaire d'une phrase Confluent (ADVISORY, jamais bloquant).
 *
 * QUOI : prend du Confluent, le découpe en propositions + tokens, classe chaque token (particule /
 *        conjugateur de temps / mot de contenu) et signale des WARNINGS de grammaire haute-confiance.
 * POURQUOI : le gate phonotactique ne voit QUE la forme des mots ; les fautes de structure
 *        (conjugateur éparpillé, `su` mal placé, verbe pas en fin) PASSENT. Cet outil donne à
 *        l'agent un miroir déterministe pour s'auto-corriger — SANS jamais refuser (langue en
 *        construction : on veut pouvoir oser des tournures originales).
 * COMMENT : règles conservatrices, warn-not-fail. R1 ici (conjugateur) ; R2/R3 ajoutées ensuite.
 */
'use strict';

// Codes de conjugateurs de TEMPS de l'ère (un seul par proposition, sur le verbe). Fallback ANCIEN.
function tenseCodes(era) {
  const t = era && era.conjugateurs && era.conjugateurs.temps;
  return new Set(t ? Object.keys(t) : ['u', 'at', 'aan', 'ait', 'amat', 'en']);
}

// Particules de CAS de l'ère (placées AVANT le nom), hors pluriel `su`. Fallback ANCIEN.
function caseParticles(era) {
  const p = era && era.particules;
  const keys = p ? Object.keys(p) : ['va', 'vo', 'vi', 've', 'vu', 'na', 'ni', 'no', 'su'];
  return new Set(keys.filter(k => k !== 'su'));
}

// Découpe en propositions puis en tokens propres.
// COMMENT : la VIRGULE sépare aussi — une série de verbes coordonnés (« écoute, se souvient,
//   transmet » → « tikam u, mori u, kisun u ») est LÉGITIME : chaque verbe porte son propre temps.
//   Sans ça, on crierait au faux positif sur des coordinations valides (langue en construction).
//   Et on STRIPPE la ponctuation en bordure de chaque token (« u, » → « u ») — sinon un conjugateur
//   collé à une virgule n'est pas reconnu et on rate la faute (faux NÉGATIF trouvé en prod).
function clausesOf(cf) {
  return String(cf || '').toLowerCase().split(/[.!?;,]+/)
    .map(c => c.trim().split(/\s+/).map(t => t.replace(/^[^a-z]+|[^a-z]+$/g, '')).filter(Boolean))
    .filter(toks => toks.length > 0);
}

/**
 * Vérifie la grammaire d'un texte Confluent. Retourne { ok, warnings:[{regle, gravite, message}] }.
 * ok=true signifie "aucun warning" — PAS "grammaire parfaite" (seules les règles encodées sont vues).
 */
function checkGrammar(cf, era) {
  const TENSE = tenseCodes(era);
  const CASE = caseParticles(era);
  const warnings = [];
  const clauses = clausesOf(cf);

  clauses.forEach((toks, ci) => {
    const phrase = toks.join(' ');

    // R1 — DISCIPLINE DU CONJUGATEUR : un seul marqueur de temps par proposition.
    // POURQUOI : c'est le bug n°1 observé (« va naki u nura vo mori u … » — `u` partout). Plusieurs
    //        temps dans une proposition = quasi toujours faux. Très haute confiance → warning sûr.
    const tenses = toks.filter(t => TENSE.has(t));
    if (tenses.length > 1) {
      warnings.push({ regle: 'conjugateur', gravite: 'haute',
        message: `Proposition ${ci + 1} : ${tenses.length} conjugateurs de temps (${tenses.join(', ')}) — il en faut UN seul, sur le verbe. « ${phrase} »` });
    }

    // R2 — PLACEMENT DU PLURIEL `su` : il suit le NOM (jamais en tête, jamais après une particule
    // de cas qui, elle, précède le nom). POURQUOI : exception du Confluent (su = la seule particule
    // postposée) ; « va su naki » est l'erreur typique. Conservateur : on ne flagge que ces 2 cas sûrs.
    toks.forEach((t, i) => {
      if (t !== 'su') return;
      const prev = toks[i - 1];
      if (i === 0 || CASE.has(prev)) {
        warnings.push({ regle: 'pluriel', gravite: 'haute',
          message: `Proposition ${ci + 1} : « su » mal placé (doit suivre le NOM, ex. « naki su », pas « ${prev || ''} su »). « ${phrase} »` });
      }
    });
  });

  return { ok: warnings.length === 0, warnings };
}

module.exports = { checkGrammar, clausesOf, tenseCodes };
