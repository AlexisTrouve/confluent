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

console.log('\n[3] Pas de FAUX POSITIF sur l\'original');
check('formule rituelle sans verbe « va sili aska » → OK', warn('va sili aska').ok);
check('phrase vide → OK (rien à signaler)', warn('').ok);

console.log('\n[4] Jamais bloquant — structure de retour');
const r4 = warn('va naki u u');
check('retourne { ok:false, warnings:[...] } sans throw', r4.ok === false && Array.isArray(r4.warnings));

console.log(`\n${fail === 0 ? '✓' : '✗'} grammar_check : ${pass} ok, ${fail} ko`);
process.exit(fail === 0 ? 0 : 1);
