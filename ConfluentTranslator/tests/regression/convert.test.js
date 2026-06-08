/**
 * Test de régression du CONVERTISSEUR Confluent → glyphes (scripts/confluent2glyphes).
 *
 * QUOI : verrouille le comportement de convert()/resolveWord sur : mot direct, composition
 *        (assemblée, jamais glyphe unique), verbe conjugué, ÉCHEC FRANC précis sur pièce sans
 *        glyphe, et — bug trouvé sur matière réelle — la PONCTUATION de phrases réelles.
 * POURQUOI : le convertisseur est le 2ᵉ maillon « français → glyphes » ; un vrai paragraphe
 *        ponctué (« savu. », « kari. ») cassait le rendu. Chaque bug = un test qui le verrouille.
 * COMMENT : assertions natives (pas de framework), exit 1 si échec, pour `npm test`.
 */
'use strict';

const { convert, resolveWord } = require('../../scripts/confluent2glyphes');

let pass = 0, fail = 0;
function check(label, cond) { if (cond) { pass++; console.log(`  ✓ ${label}`); } else { fail++; console.log(`  ✗ ${label}`); } }

// 1. Mot direct au registre → un glyphe.
console.log('\n[1] Mot direct');
check('va → [va]', JSON.stringify(resolveWord('va')) === '["va"]');

// 2. Composition → assemblée en plusieurs pièces (jamais un glyphe unique).
console.log('\n[2] Composition assemblée');
check('siliaska → 3 pièces (sili+i+aska)', resolveWord('siliaska').length === 3);

// 3. Verbe conjugué → racine + conjugateur, deux pièces glyphées.
console.log('\n[3] Verbe conjugué');
check('miraku → [mirak, u]', JSON.stringify(resolveWord('miraku')) === '["mirak","u"]');

// 4. Échec franc : mot bidon → convert renvoie une erreur ciblée (ligne/col/mot).
console.log('\n[4] Échec franc');
const ko = convert('va xyzzy vo');
check('xyzzy → erreur pointant le mot', ko.erreur && ko.erreur.mot === 'xyzzy' && ko.erreur.col > 0);

// 5. PONCTUATION (bug matière réelle) : la ponctuation en bordure est retirée, pas un échec.
console.log('\n[5] Ponctuation des phrases réelles');
const p1 = convert('savu.');
check('« savu. » rend comme « savu »', p1.ok && p1.glyphes.length === 1 && p1.glyphes[0].word === 'savu');
const p2 = convert('va siliaska tikam u mori u kisun u.');
check('phrase ponctuée → rendue sans erreur', p2.ok && p2.glyphes.length === 8);

// 6. Vrai paragraphe (audit prod) → rendu intégral, zéro échec franc.
console.log('\n[6] Vrai paragraphe multi-phrases ponctué');
const para = 'no kori na kota va naki u nura vo mori u aita konu u. no oubo ora va voki sumus u onuvoki u vo savu. '
  + 'va siliaska tikam u mori u kisun u. va sili aska ieso u ve noviuaita vi ota noviuaita ura kari.';
const r = convert(para);
check('paragraphe entier rendu (45 mots)', r.ok && r.glyphes.length === 45);

console.log(`\n${fail === 0 ? '✓' : '✗'} convert : ${pass} ok, ${fail} ko`);
process.exit(fail === 0 ? 0 : 1);
