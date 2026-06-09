/**
 * Test de vocabCheck (vérif vocabulaire de clôture, ADVISORY).
 *
 * QUOI : flagge l'INVENTION non vérifiable (phono OK mais ni attestée ni composée), ignore les mots
 *        attestés et les tokens grammaticaux, et se désactive proprement sans index morpho.
 * POURQUOI : c'est verify_word rebranché en clôture ; il ne doit JAMAIS flagger un mot du lexique ni
 *        une particule, ni planter sans index. Conservateur (langue en construction).
 * COMMENT : assertions natives + index morpho MINIMAL construit à la main. exit 1 si échec.
 */
'use strict';
const { checkVocab } = require('../../src/core/validation/vocabCheck');
const { ANCIEN } = require('../../src/core/eras/eras');

let pass = 0, fail = 0;
const check = (l, c) => { if (c) { pass++; console.log('  ✓ ' + l); } else { fail++; console.log('  ✗ ' + l); } };

// ctx avec un index morpho MINIMAL : seul « naki » est attesté.
const ctx = { era: ANCIEN, morphReverseIndex: { byWord: { naki: { francais: 'enfant', type: 'racine' } }, byFormeLiee: {} } };

console.log('\n[1] Invention non vérifiable → warning vocab');
const r = checkVocab('va naki vo koto', ctx);   // koto : phono-valide mais inconnu/non décomposable
check('« koto » flaggé (vocab)', !r.ok && r.warnings.some(w => w.regle === 'vocab' && /koto/.test(w.message)));
check('« naki » (attesté) NON flaggé', !r.warnings.some(w => /« naki »/.test(w.message)));
check('« va » (particule) NON flaggé', !r.warnings.some(w => /« va »/.test(w.message)));

console.log('\n[2] Tout attesté/grammatical → propre');
check('« va naki » → 0 warning', checkVocab('va naki', ctx).ok);

console.log('\n[3] Sans index morpho → no-op (ne flagge rien, ne plante pas)');
check('pas d\'index → { ok:true, warnings:[] }', checkVocab('va koto naki', { era: ANCIEN }).ok);

console.log(`\n${fail === 0 ? '✓' : '✗'} vocab_check : ${pass} ok, ${fail} ko`);
process.exit(fail === 0 ? 0 : 1);
