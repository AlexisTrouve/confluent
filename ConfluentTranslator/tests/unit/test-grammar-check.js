/**
 * Test de grammarCheck (vérif syntaxe ADVISORY, warn-not-fail).
 *
 * QUOI : verrouille les 2 règles haute-confiance (conjugateur unique, pluriel `su` placé) ET
 *        l'absence de FAUX POSITIF sur une formule rituelle sans verbe (langue en construction).
 * POURQUOI : l'outil ne doit JAMAIS bloquer ni crier au loup sur une tournure originale légitime.
 * COMMENT : assertions natives, exit 1 si échec, pour `npm test`.
 */
'use strict';
const { checkGrammar } = require('../../src/core/validation/grammarCheck');
const { executeTool } = require('../../src/core/translation/translationTools');
const { ANCIEN } = require('../../src/core/eras/eras');

let pass = 0, fail = 0;
function check(label, cond) { if (cond) { pass++; console.log(`  ✓ ${label}`); } else { fail++; console.log(`  ✗ ${label}`); } }
const warn = (cf) => checkGrammar(cf, ANCIEN);

console.log('\n[1] Conjugateur — un seul temps par proposition');
const r1 = warn('va naki u nura vo mori u aita konu u');   // bug réel run 1 : `u` partout
check('« u » multiple → warning conjugateur', !r1.ok && r1.warnings.some(w => w.regle === 'conjugateur'));
check('« u » sur le verbe seul → OK', warn('va siliaska vo mori konu u').ok);

console.log('\n[2] Pluriel su — placé après le nom');
const r2 = warn('va su naki vo ura miraku');               // erreur typique : su avant le nom
check('« va su naki » → warning pluriel', !r2.ok && r2.warnings.some(w => w.regle === 'pluriel'));
check('« va naki su » → OK', warn('va naki su vo ura miraku').ok);

console.log('\n[2bis] Ponctuation (bug trouvé en prod : virgule/point collés aux tokens)');
// Série de verbes coordonnés : chaque verbe a son propre temps → LÉGITIME, pas un faux positif.
check('« tikam u, mori u, kisun u » (série virgulée) → OK', warn('va siliaska tikam u, mori u, kisun u').ok);
// Conjugateur collé à un point dans la même proposition → doit quand même être vu (faux négatif corrigé).
check('« va naki u u. » (2 temps, point collé) → warning', !warn('va naki u u.').ok);

console.log('\n[3] Pas de FAUX POSITIF sur l\'original');
check('formule rituelle sans verbe « va sili aska » → OK', warn('va sili aska').ok);
check('phrase vide → OK (rien à signaler)', warn('').ok);

console.log('\n[4] Jamais bloquant — structure de retour');
const r4 = warn('va naki u u');
check('retourne { ok:false, warnings:[...] } sans throw', r4.ok === false && Array.isArray(r4.warnings));

console.log('\n[5] Câblage outil — executeTool route bien vers grammar_check');
const viaTool = executeTool('grammar_check', { confluent: 'va naki u nura vo mori u' }, { era: ANCIEN });
check('executeTool(grammar_check) renvoie {ok, warnings}', viaTool && viaTool.ok === false && Array.isArray(viaTool.warnings) && viaTool.warnings.length >= 1);
check('entrée vide → erreur propre (pas de crash)', executeTool('grammar_check', { confluent: '' }, { era: ANCIEN }).erreur != null);

console.log('\n[6] confirme_choix — outil de la vérification de clôture (corrige-ou-confirme)');
const conf = executeTool('confirme_choix', { note: 'formule rituelle figée, pas de verbe attendu' }, { era: ANCIEN });
check('avec note → { ok:true, confirme:true, note }', conf.ok === true && conf.confirme === true && /rituelle/.test(conf.note));
check('sans note → refus propre (note requise)', executeTool('confirme_choix', {}, { era: ANCIEN }).ok === false);

console.log(`\n${fail === 0 ? '✓' : '✗'} grammar_check : ${pass} ok, ${fail} ko`);
process.exit(fail === 0 ? 0 : 1);
