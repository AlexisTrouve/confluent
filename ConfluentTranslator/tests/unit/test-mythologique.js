/**
 * Test du REGISTRE MYTHOLOGIQUE — câblage de l'ère sacrée dans toutes les couches du translator.
 *
 * QUOI : verrouille que le mythologique est une ère de 1ʳᵉ classe : (1) config d'ère (y/é/è activés,
 *        plus de stub) ; (2) gate (formes sacrées y/é/è valides en mytho, REFUSÉES en ancien/proto,
 *        et l'ancien reste valide en mytho = héritage) ; (3) lexique overlay (strate sacrée présente,
 *        ancien hérité, ancien NON pollué) ; (4) prompt = ancien + overlay sacré ; (5) l'exemple du
 *        prompt reste phonotactiquement valide (régression : si on casse l'exemple, le test crie).
 * POURQUOI : « tous les layers du translator » doivent accueillir le mythologique sans régression de
 *        l'ancien/proto. Ce test est le filet anti-retour-au-stub.
 * COMMENT : assertions natives, exit 1 si échec, pour `npm test`.
 */
'use strict';
const path = require('path');
const { getEra, ERAS } = require('../../src/core/eras/eras');
const { validateForm, validateTranslation } = require('../../src/core/validation/phonotactics');
const { loadAllLexiques } = require('../../src/utils/lexiqueLoader');
const { loadBaseTemplate } = require('../../src/core/translation/promptBuilder');

let pass = 0, fail = 0;
function check(label, cond) { if (cond) { pass++; console.log(`  ✓ ${label}`); } else { fail++; console.log(`  ✗ ${label}`); } }

const myth = getEra('mythologique');
const anc = getEra('ancien');
const proto = getEra('proto');

console.log('\n[1] Config d\'ère — mythologique complété (plus un stub)');
check('id = mythologique', myth.id === 'mythologique');
check('voyelles sacrées y/é/è activées', ['y', 'é', 'è'].every(v => myth.voyelles.includes(v)));
check('aucune voyelle réservée restante', myth.reservees.length === 0);
check('hérite la grammaire ancien (liaisons + conjugateurs)', !!myth.liaisons && Object.keys(myth.liaisons).length > 0 && !!myth.conjugateurs);
check('pointe sur son prompt dédié', myth.systemPrompt === 'mythologique-system.txt');
check('pointe sur sa strate lexique dédiée', myth.lexiqueDir === 'mythologique-confluent/lexique');
check('n\'est plus marqué stub', myth.stub !== true);
check('registré dans ERAS', ERAS.mythologique === myth);

console.log('\n[2] Gate — formes sacrées y/é/è : valides en mytho, REFUSÉES ailleurs');
check('èva (le Vide) valide en mytho', validateForm('èva', myth).valid);
check('ysili (Premier Veilleur) valide en mytho', validateForm('ysili', myth).valid);
check('èva REFUSÉE en ancien', !validateForm('èva', anc).valid);
check('ysili REFUSÉE en ancien', !validateForm('ysili', anc).valid);
check('èva REFUSÉE en proto', !validateForm('èva', proto).valid);
check('forme ancien (naki) reste valide en mytho (héritage)', validateForm('naki', myth).valid);
check('forme cassée (attaque 2 cons.) reste refusée en mytho', !validateForm('tbima', myth).valid);

console.log('\n[3] Lexique overlay — ancien hérité + strate sacrée, sans polluer l\'ancien');
const baseDir = path.join(__dirname, '..', '..', '..');
const L = loadAllLexiques(baseDir);
const hasConf = (dict, frKey, conf) => dict[frKey] && dict[frKey].traductions.some(t => t.confluent === conf);
check('loadAllLexiques expose les 3 ères', ['proto', 'ancien', 'mythologique'].every(k => !!L[k]));
check('mytho contient la strate sacrée (vide → èva)', hasConf(L.mythologique.dictionnaire, 'vide', 'èva'));
check('mytho contient ysili (premier veilleur)', hasConf(L.mythologique.dictionnaire, 'premier veilleur', 'ysili'));
check('mytho HÉRITE l\'ancien (eau → ura)', hasConf(L.mythologique.dictionnaire, 'eau', 'ura'));
check('mytho HÉRITE l\'ancien (enfant → naki)', hasConf(L.mythologique.dictionnaire, 'enfant', 'naki'));
check('ancien NON pollué (pas de « vide » sacré)', !L.ancien.dictionnaire['vide']);
check('mytho a strictement plus d\'entrées que l\'ancien', L.mythologique.meta.total_entries > L.ancien.meta.total_entries);

console.log('\n[4] Prompt — mytho = base ancien + overlay sacré (héritage, pas duplication)');
const mythoPrompt = loadBaseTemplate('mythologique');
const ancienPrompt = loadBaseTemplate('ancien');
check('contient la base ancien (PHONOTACTIQUE — RÈGLES DURES)', mythoPrompt.includes('RÈGLES DURES'));
check('contient l\'overlay sacré (REGISTRE MYTHOLOGIQUE)', mythoPrompt.includes('REGISTRE MYTHOLOGIQUE'));
check('mytho ⊃ ancien (overlay réellement appendu)', mythoPrompt.length > ancienPrompt.length && mythoPrompt.startsWith(ancienPrompt.slice(0, 200)));
check('prompt ancien inchangé (pas d\'overlay dedans)', !ancienPrompt.includes('REGISTRE MYTHOLOGIQUE'));

console.log('\n[5] Régression — l\'exemple documenté du prompt reste valide au gate mytho');
// Si quelqu'un édite l'exemple du prompt avec une forme cassée, ce test le rattrape.
const exemple = 'va ysili vo eka mirak u. va tani zo mirak u, lo va èva pasak eom';
const v = validateTranslation(exemple, myth);
check('ligne exemple du prompt → phonotactiquement valide', v.valid);

console.log(`\n=== test-mythologique : ${pass} ok, ${fail} ko ===`);
process.exit(fail === 0 ? 0 : 1);
