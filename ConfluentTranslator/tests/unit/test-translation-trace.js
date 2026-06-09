/**
 * Test de l'extraction du SIGNAL d'apprentissage depuis les résultats d'outils (collectSignals).
 *
 * QUOI : vérifie que collectSignals tire correctement, de chaque forme de retour d'outil, les
 *        GAPS de lexique (concepts/racines non trouvés) et les FORMES CASSÉES rejetées.
 * POURQUOI : c'est le cœur du log d'apprentissage ; si l'extraction se trompe, l'analyseur sort
 *        une mauvaise liste de mots à ajouter. Testable SANS LLM (entrées synthétiques).
 * COMMENT : assertions natives, exit 1 si échec, pour `npm test`.
 */
'use strict';
const { collectSignals } = require('../../src/core/translation/translationAgent');

let pass = 0, fail = 0;
function check(label, cond) { if (cond) { pass++; console.log(`  ✓ ${label}`); } else { fail++; console.log(`  ✗ ${label}`); } }

// Helper : applique collectSignals à un seul (name, result) sur une trace neuve.
function run(name, result) {
  const trace = { toolCalls: [], gateAttempts: [], gaps: [], brokenForms: [] };
  collectSignals(trace, name, {}, result);
  return trace;
}

console.log('\n[1] analyze_text → a_composer = gaps (strings ET objets)');
check('a_composer strings', JSON.stringify(run('analyze_text', { a_composer: ['lune', 'étoile'] }).gaps) === '["lune","étoile"]');
check('a_composer objets {input}', run('analyze_text', { a_composer: [{ input: 'soleil' }] }).gaps[0] === 'soleil');

console.log('\n[2] lookup_concept → gap seulement si found:false');
check('found:false → gap', run('lookup_concept', { found: false, francais: 'brume' }).gaps[0] === 'brume');
check('found:true → aucun gap', run('lookup_concept', { found: true, francais: 'eau' }).gaps.length === 0);

console.log('\n[3] check_composition → racine inconnue = gap, forme rejetée = cassée');
const cc = run('check_composition', { valid: false, forme: 'tbime', racines_inconnues: ['xyz'] });
check('racine inconnue → gap', cc.gaps.includes('xyz'));
check('forme invalide → brokenForm', cc.brokenForms.includes('tbime'));

console.log('\n[4] verify_word → racine trouvee:false = gap (pas les trouvées)');
const vw = run('verify_word', { racines: [{ racine: 'daku', trouvee: false }, { racine: 'sili', trouvee: true }] });
check('daku (absente) → gap', vw.gaps.includes('daku'));
check('sili (trouvée) → pas un gap', !vw.gaps.includes('sili'));

console.log('\n[5] validate_form → formes invalides = cassées');
check('mkaso → brokenForm', run('validate_form', { valid: false, invalides: [{ mot: 'mkaso' }] }).brokenForms.includes('mkaso'));

console.log(`\n${fail === 0 ? '✓' : '✗'} trace : ${pass} ok, ${fail} ko`);
process.exit(fail === 0 ? 0 : 1);
