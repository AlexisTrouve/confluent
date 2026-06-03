/**
 * Test du validateur phonotactique (le gate de l'agent).
 *
 * QUOI : verrouille le comportement du gate sur 3 jeux : les 8 formes cassées RÉELLES
 *        observées dans example-phrases.json, un échantillon de formes canon valides, et
 *        la validation d'une phrase complète.
 * POURQUOI : ce module rend `tbime` impossible à servir ; un test de régression garantit
 *        qu'on ne réintroduira jamais le trou. Chaque bug = un test qui le verrouille.
 * COMMENT : assertions natives (pas de framework) ; sortie lisible ; exit code 1 si échec
 *        pour intégration CI.
 */

'use strict';

const { validateForm, validateTranslation } = require('../../src/core/validation/phonotactics');

let pass = 0;
let fail = 0;

function check(label, condition) {
  if (condition) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.log(`  ✗ ${label}`);
  }
}

// ============================================================
// 1. Les 8 formes CASSÉES réelles (example-phrases.json) → toutes INVALIDES
// ============================================================
console.log('\n[1] Formes cassées connues → doivent être REJETÉES');
const CASSEES = ['tbime', 'lnosu', 'zbipo', 'mkaso', 'vzena', 'spima', 'plozi', 'psate'];
for (const f of CASSEES) {
  const r = validateForm(f);
  check(`${f} rejeté (${r.erreurs.join(', ') || 'aucune erreur !'})`, r.valid === false);
}

// ============================================================
// 2. Formes canon → toutes VALIDES
// ============================================================
console.log('\n[2] Formes canon → doivent PASSER');
const VALIDES = [
  'miki', 'sinu', 'tani', 'ura', 'naki', 'mirak', 'apo', 'zanak', 'kari', 'pasak',
  'nekan', 'tori', 'pesa', 'zakis', 'aita', 'zunop', 'vamo', 'buka', 'viku', 'aki',
  'ora', 'umi', 'sekam', 'sora', 'luna', 'tasa', 'suki', 'tekis', 'kitan',
  'akoazana', 'uraakota', 'siliaska', 'zakitori', 'nakukeko'
];
for (const f of VALIDES) {
  const r = validateForm(f);
  check(`${f} accepté${r.valid ? '' : ' — ERREUR: ' + r.erreurs.join(', ')}`, r.valid === true);
}

// ============================================================
// 3. Voyelles réservées et hors-alphabet → INVALIDES
// ============================================================
console.log('\n[3] Caractères interdits → REJETÉS');
check('forme avec é rejetée', validateForm('vélu').valid === false);
check('forme avec y rejetée', validateForm('syka').valid === false);
check('forme avec w (hors-alphabet) rejetée', validateForm('waka').valid === false);

// ============================================================
// 4. Validation de phrases complètes
// ============================================================
console.log('\n[4] Phrases complètes');
const phraseOK = 'va naki vo ura mirak u';
const rOK = validateTranslation(phraseOK);
check(`phrase canon valide ("${phraseOK}")`, rOK.valid === true);

const phraseKO = 'va tbime vo onu teki kasi es';
const rKO = validateTranslation(phraseKO);
check(`phrase avec tbime invalide`, rKO.valid === false);
check(`tbime identifié comme fautif dans la phrase`, rKO.invalides.some(i => i.mot === 'tbime'));

// ============================================================
// Bilan
// ============================================================
console.log(`\n==== ${pass} pass, ${fail} fail ====`);
if (fail > 0) {
  console.error('ÉCHEC : le gate phonotactique ne se comporte pas comme attendu.');
  process.exit(1);
}
console.log('Gate phonotactique vérifié.');
