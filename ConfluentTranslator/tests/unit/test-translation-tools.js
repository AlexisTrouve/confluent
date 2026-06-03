/**
 * Test des 5 outils de l'agent de traduction (en conditions réelles : lexique chargé).
 *
 * QUOI : exerce lookup_concept, get_grammar, validate_form, verify_word, check_composition
 *        contre le vrai corpus ancien + les vrais index morpho.
 * POURQUOI : prouver que les outils renvoient des verdicts corrects AVANT de les brancher dans
 *        la boucle d'agent — sinon l'agent s'appuierait sur des outils non vérifiés (low-trust).
 */

'use strict';

const path = require('path');
const { loadAllLexiques, buildReverseIndex } = require('../../src/utils/lexiqueLoader');
const { buildReverseIndex: buildMorphIndex } = require('../../src/core/morphology/reverseIndexBuilder');
const { executeTool } = require('../../src/core/translation/translationTools');

// baseDir = racine du repo confluent (tests/unit -> ConfluentTranslator -> confluent)
const baseDir = path.join(__dirname, '..', '..', '..');
const { ancien } = loadAllLexiques(baseDir);
const reverseIndex = buildReverseIndex(ancien);
const morphReverseIndex = buildMorphIndex(ancien);
const ctx = { lexique: ancien, reverseIndex, morphReverseIndex };

let pass = 0, fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}${detail ? ' — ' + JSON.stringify(detail) : ''}`); }
}

console.log('\n[lookup_concept]');
const lkLumiere = executeTool('lookup_concept', { francais: 'lumière' }, ctx);
check('lumière trouve une forme canon (sora attendu)', lkLumiere.found && lkLumiere.formes.some(f => f.confluent === 'sora'), lkLumiere);
const lkMontagne = executeTool('lookup_concept', { francais: 'montagne' }, ctx);
check('montagne → tasa', lkMontagne.found && lkMontagne.formes.some(f => f.confluent === 'tasa'), lkMontagne);

console.log('\n[get_grammar]');
const grConj = executeTool('get_grammar', { sujet: 'conjugateurs' }, ctx);
check('conjugateurs.temps contient u (présent)', !!(grConj.conjugateurs && grConj.conjugateurs.temps && grConj.conjugateurs.temps.u), grConj);
const grLi = executeTool('get_grammar', { sujet: 'liaisons' }, ctx);
check('liaisons renvoie les 16', grLi.liaisons && Object.keys(grLi.liaisons.liaisons).length === 16, Object.keys(grLi.liaisons.liaisons || {}).length);

console.log('\n[validate_form]');
check('tbime rejeté', executeTool('validate_form', { confluent: 'tbime' }, ctx).valid === false);
check('siliaska accepté', executeTool('validate_form', { confluent: 'siliaska' }, ctx).valid === true);

console.log('\n[verify_word]');
const vwSili = executeTool('verify_word', { confluent: 'siliaska' }, ctx);
check('siliaska reconnu (direct ou composition)', vwSili.reconnu === true, vwSili);
const vwTbime = executeTool('verify_word', { confluent: 'tbime' }, ctx);
check('tbime non reconnu (phonotactique invalide)', vwTbime.reconnu === false && vwTbime.phonotactique_valide === false, vwTbime);
const vwConj = executeTool('verify_word', { confluent: 'mirak' }, ctx);
check('mirak reconnu', vwConj.reconnu === true, vwConj);

console.log('\n[check_composition]');
const ccOk = executeTool('check_composition', { forme: 'zakitori', racines: ['zaki', 'tori'], liaison: 'i' }, ctx);
check('zakitori (zaki-i-tori) phonotactiquement valide + liaison valide', ccOk.forme_valide === true && ccOk.liaison_valide === true, ccOk);
const ccBadLi = executeTool('check_composition', { forme: 'zakitori', racines: ['zaki', 'tori'], liaison: 'xx' }, ctx);
check('liaison inventée "xx" rejetée', ccBadLi.liaison_valide === false, ccBadLi);

console.log(`\n==== ${pass} pass, ${fail} fail ====`);
process.exit(fail > 0 ? 1 : 0);
