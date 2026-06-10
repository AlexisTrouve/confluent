/**
 * check-form — valide une forme Confluent candidate (forge de vocab) : gate + anti-collision + décompo.
 *
 * QUOI : `node scripts/check-form.js <forme> [ancien|mythologique|proto]` → dit si la forme est UTILISABLE
 *        (phonotactique valide ET pas déjà attestée pour un autre concept), + comment elle se décompose.
 * POURQUOI : garantie déterministe de la phase FIX — aucune forme cassée ou en collision ne doit entrer au
 *        lexique. Outil partagé (moi + agents) pour valider chaque forme proposée AVANT de l'adopter.
 * COMMENT : charge le lexique de l'ère, applique validateForm (gate), vérifie byWord (collision), et
 *        execVerifyWord (décompo : une COMPOSITION doit donner des racines toutes ✓ ; un NOUVEAU root sort
 *        « non reconnu » = normal si on voulait une racine neuve). Exit 0 si utilisable, 1 sinon.
 */
'use strict';
const path = require('path');
const { validateForm } = require('../src/core/validation/phonotactics');
const { getEra } = require('../src/core/eras/eras');
const { loadAllLexiques } = require('../src/utils/lexiqueLoader');
const { buildReverseIndex: buildConfluentIndex } = require('../src/core/morphology/reverseIndexBuilder');
const { execVerifyWord } = require('../src/core/translation/translationTools');

const forme = String(process.argv[2] || '').toLowerCase().trim();
const eraId = process.argv[3] || 'ancien';
if (!forme) { console.error('usage: node scripts/check-form.js <forme> [ancien|mythologique|proto]'); process.exit(2); }

const lexAll = loadAllLexiques(path.join(__dirname, '..', '..'));
const lex = lexAll[eraId] || lexAll.ancien;
const era = getEra(eraId);
const ctx = { lexique: lex, morphReverseIndex: buildConfluentIndex(lex), era };

const gate = validateForm(forme, era);
const byWord = ctx.morphReverseIndex.byWord || {};
const collision = Boolean(byWord[forme]);
const v = execVerifyWord({ confluent: forme }, ctx);
const usable = gate.valid && !collision;

console.log(JSON.stringify({
  forme, era: eraId,
  gate: gate.valid ? 'OK' : 'INVALIDE: ' + gate.erreurs.join(', '),
  collision: collision ? `OUI — déjà « ${byWord[forme].francais || '?'} »` : 'non',
  decompo: v.reconnu
    ? `${v.mode} → ${(v.racines || []).map(r => r.racine + (r.trouvee ? '✓' : '✗')).join(' + ') || v.radical}`
    : 'non reconnu (= racine NEUVE ; ok si voulu, sinon revoir)',
  VERDICT: usable ? '✅ UTILISABLE' : '❌ À CORRIGER'
}, null, 2));
process.exit(usable ? 0 : 1);
