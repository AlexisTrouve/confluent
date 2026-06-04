/**
 * Test multi-ère : le gate et les outils se paramètrent bien par ère (proto vs ancien).
 *
 * QUOI : verrouille que chaque ère applique SES règles (phonotactique, liaisons, particules,
 *        conjugateurs) — et pas celles de l'ancien par défaut.
 * POURQUOI : l'infra était ancien-en-dur ; ce test garantit qu'on ne régresse pas vers ça.
 */
'use strict';

const path = require('path');
const { loadAllLexiques } = require('../../src/utils/lexiqueLoader');
const { buildReverseIndex: bmi } = require('../../src/core/morphology/reverseIndexBuilder');
const { executeTool } = require('../../src/core/translation/translationTools');
const { validateForm } = require('../../src/core/validation/phonotactics');
const { PROTO, ANCIEN, MYTHOLOGIQUE } = require('../../src/core/eras/eras');

const { ancien, proto } = loadAllLexiques(path.join(__dirname, '..', '..', '..'));
const ctxA = { lexique: ancien, morphReverseIndex: bmi(ancien), era: ANCIEN };
const ctxP = { lexique: proto, morphReverseIndex: bmi(proto), era: PROTO };

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}${detail !== undefined ? ' — ' + JSON.stringify(detail) : ''}`); }
};

console.log('\n[gate par ère]');
check('ura valide en ancien', validateForm('ura', ANCIEN).valid === true);
check('ura INVALIDE en proto (u réservé)', validateForm('ura', PROTO).valid === false);
check('vena INVALIDE en proto (v réservé)', validateForm('vena', PROTO).valid === false);
check('aka valide en proto', validateForm('aka', PROTO).valid === true);
check('véli valide en mythologique (é activé)', validateForm('véli', MYTHOLOGIQUE).valid === true);
check('véli INVALIDE en ancien (é réservé)', validateForm('véli', ANCIEN).valid === false);
check('tbime INVALIDE partout (attaque CC)', validateForm('tbime', ANCIEN).valid === false && validateForm('tbime', PROTO).valid === false);

console.log('\n[get_grammar par ère]');
const liA = executeTool('get_grammar', { sujet: 'liaisons' }, ctxA);
const liP = executeTool('get_grammar', { sujet: 'liaisons' }, ctxP);
check('ancien : 16 liaisons', Object.keys(liA.liaisons.liaisons).length === 16);
check('proto : 0 liaison', Object.keys(liP.liaisons.liaisons).length === 0);
const paP = executeTool('get_grammar', { sujet: 'particules' }, ctxP);
check('proto : particules na/no/ni (pas va/vo)', paP.particules.particules.na && paP.particules.particules.no && !paP.particules.particules.va, Object.keys(paP.particules.particules));

console.log('\n[check_composition par ère]');
check('ancien : liaison i valide', executeTool('check_composition', { forme: 'siliaska', racines: ['sili', 'aska'], liaison: 'i' }, ctxA).liaison_valide === true);
check('proto : liaison i INVALIDE (pas de liaisons)', executeTool('check_composition', { forme: 'siliaska', racines: ['sili', 'aska'], liaison: 'i' }, ctxP).liaison_valide === false);

console.log('\n[validate_form via outil, par ère]');
check('proto rejette ura via validate_form', executeTool('validate_form', { confluent: 'ura' }, ctxP).valid === false);

console.log('\n[corpus proto valide au gate proto]');
const protoForms = [];
for (const e of Object.values(proto.dictionnaire || {})) for (const t of (e.traductions || [])) {
  if (t.confluent && !/\s/.test(t.confluent)) protoForms.push(t.confluent);
}
const protoBad = protoForms.filter(f => !validateForm(f, PROTO).valid);
check(`corpus proto 100% valide au gate proto (${protoForms.length} formes, ${protoBad.length} invalides)`, protoBad.length === 0, protoBad.slice(0, 10));

console.log(`\n==== ${pass} pass, ${fail} fail ====`);
process.exit(fail > 0 ? 1 : 0);
