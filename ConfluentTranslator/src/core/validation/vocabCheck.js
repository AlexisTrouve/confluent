/**
 * vocabCheck — vérif VOCABULAIRE d'une phrase Confluent (ADVISORY, pour la clôture corrige-ou-confirme).
 *
 * QUOI : pour chaque MOT DE CONTENU de la traduction, réutilise `verify_word` (déjà notre vrai
 *        vocab-check : attesté ? verbe conjugué ? composition de racines déclarées ?) et signale
 *        les formes « inventées non vérifiables » — ni attestées, ni composées de racines déclarées.
 * POURQUOI : le gate phono garantit la FORME ; il ne dit pas si le mot EXISTE/est dérivable. Une
 *        invention papier-mâché (ex. un mot phono-valide mais sans racine connue) passait inaperçue.
 *        On la remonte en clôture : l'agent l'atteste, la compose proprement, ou CONFIRME l'invention.
 * COMMENT : on saute les tokens GRAMMATICAUX (particules, conjugateurs, négation, connecteurs — gérés
 *        par la grammaire, pas le vocab). Sans index morpho (ctx.morphReverseIndex) → no-op (rien à
 *        vérifier). Conservateur : on ne flagge que `reconnu=false && mode='inconnu'` (signal le plus sûr).
 */
'use strict';
const { execVerifyWord } = require('../translation/translationTools');

// Tokens grammaticaux à ignorer (relèvent de grammar_check, pas du vocab).
function grammaticalSet(era) {
  const s = new Set(['zo', 'zom', 'zob', 'zoe', 'ti', 'bo', 'po', 'lo', 'se', 'me', 'ne', 'ka']);
  for (const k of Object.keys((era && era.particules) || {})) s.add(k);
  const temps = era && era.conjugateurs;
  if (temps) for (const grp of Object.values(temps)) if (grp && typeof grp === 'object') for (const k of Object.keys(grp)) s.add(k);
  return s;
}

function checkVocab(cf, ctx) {
  // Sans index morpho, verify_word ne peut rien attester → on ne flagge rien (no-op honnête).
  if (!ctx || !ctx.morphReverseIndex) return { ok: true, warnings: [] };

  const skip = grammaticalSet(ctx.era);
  const seen = new Set();
  const warnings = [];
  const tokens = String(cf || '').toLowerCase().split(/[\s.!?;,]+/)
    .map(t => t.replace(/^[^a-z]+|[^a-z]+$/g, '')).filter(Boolean);

  for (const tok of tokens) {
    if (skip.has(tok) || seen.has(tok)) continue;
    seen.add(tok);
    const v = execVerifyWord({ confluent: tok }, ctx);
    // Phono déjà gaté ; on ne retient que l'invention NON vérifiable (ni attestée, ni décomposable).
    if (v && v.phonotactique_valide && v.reconnu === false && v.mode === 'inconnu') {
      warnings.push({ regle: 'vocab', gravite: 'haute',
        message: `Mot « ${tok} » non vérifiable (ni attesté au lexique, ni composition de racines déclarées) — atteste-le, compose-le proprement, ou confirme l'invention.` });
    }
  }
  return { ok: warnings.length === 0, warnings };
}

module.exports = { checkVocab, grammaticalSet };
