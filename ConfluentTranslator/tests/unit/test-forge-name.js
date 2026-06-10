/**
 * Test du FORGEUR de noms propres (forge_proper_name) + son registre persistant.
 *
 * QUOI : verrouille les GARANTIES DÉTERMINISTES du forgeur (indépendantes du LLM, via un sous-agent
 *        FAKE injecté) : (1) registre lookup/add/persistance/idempotence ; (2) lookup-first = même nom
 *        → MÊME forme, SANS re-forge (la garantie de cohérence) ; (3) validation gate + anti-collision ;
 *        (4) échec FRANC si rien de valide ; (5) source lexique (nom canonisé) ; (6) stub déterministe.
 * POURQUOI : le cœur du feature = un nom forgé UNE fois reste stable. C'est ce qui doit être prouvé,
 *        pas la créativité du LLM. Le sous-agent est donc mocké → tests rapides et déterministes.
 * COMMENT : assertions natives, exit 1 si échec, pour `npm test`. Registre isolé dans un fichier temp.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { ANCIEN } = require('../../src/core/eras/eras');
const { validateForm } = require('../../src/core/validation/phonotactics');
const { loadAllLexiques, overlayBlessedNames } = require('../../src/utils/lexiqueLoader');
const { buildReverseIndex: buildConfluentIndex } = require('../../src/core/morphology/reverseIndexBuilder');
const { makeRegistry } = require('../../src/core/translation/forgedNamesRegistry');
const { forgeProperName, stubForge, defaultLLMForge, rootsDeclared } = require('../../src/core/translation/nameForge');

let pass = 0, fail = 0;
function check(label, cond) { if (cond) { pass++; console.log(`  ✓ ${label}`); } else { fail++; console.log(`  ✗ ${label}`); } }

// Contexte réaliste : vrai lexique ancien (byWord pour l'anti-collision, dictionnaire pour les racines).
const baseDir = path.join(__dirname, '..', '..', '..');
const ancien = loadAllLexiques(baseDir).ancien;
const morphReverseIndex = buildConfluentIndex(ancien);
const TMP = path.join(os.tmpdir(), 'confluent-test-noms-forges.json');
function freshRegistry() { try { fs.unlinkSync(TMP); } catch (_) {} return makeRegistry(TMP); }
const ctxBase = () => ({ era: ANCIEN, lexique: ancien, morphReverseIndex, registry: freshRegistry() });

(async () => {
  console.log('\n[1] Registre — lookup / add / persistance / idempotence');
  const reg = freshRegistry();
  check('lookup d\'un nom absent → null', reg.lookup('Œil-Bas') === null);
  reg.add({ nom_fr: 'Œil-Bas', confluent: 'silibasa', racines: ['sili', 'basa'], provisoire: true });
  check('après add → lookup le retrouve', reg.lookup('Œil-Bas')?.confluent === 'silibasa');
  check('lookup insensible casse/accents (oeil-bas)', reg.lookup('oeil-bas')?.confluent === 'silibasa');
  reg.add({ nom_fr: 'Œil-Bas', confluent: 'AUTRE', provisoire: true });   // doit être ignoré (idempotent)
  check('add idempotent (même nom → pas d\'écrasement)', reg.lookup('Œil-Bas')?.confluent === 'silibasa');
  check('persistance disque : un nouveau registre relit le fichier', makeRegistry(TMP).lookup('Œil-Bas')?.confluent === 'silibasa');

  console.log('\n[2] Forge — lookup-first = MÊME forme sans re-forge (cohérence)');
  let calls = 0;
  // Forme à racines RÉELLES (sili+bami) → passe la garantie « racines déclarées ».
  const fakeForge = async () => { calls++; return { confluent: 'silibami', racines: ['sili', 'bami'], liaison: 'i', decompo: 'sil-i-bami' }; };
  const ctx = { ...ctxBase(), forgeFn: fakeForge };
  const r1 = await forgeProperName({ nom_fr: 'Cours-Devant', sens: 'celui qui court devant' }, ctx);
  check('1er appel → forge (forged:true, provisoire:true)', r1.forged === true && r1.provisoire === true);
  check('forme retournée = celle du sous-agent', r1.confluent === 'silibami');
  check('sous-agent appelé 1 fois', calls === 1);
  check('persisté au registre', ctx.registry.lookup('Cours-Devant')?.confluent === 'silibami');
  const r2 = await forgeProperName({ nom_fr: 'Cours-Devant', sens: 'celui qui court devant' }, ctx);
  check('2e appel → source registre (lookup-first)', r2.source === 'registre');
  check('2e appel → MÊME forme', r2.confluent === 'silibami');
  check('2e appel → sous-agent PAS rappelé (toujours 1)', calls === 1);

  console.log('\n[2bis] GARANTIE racines DÉCLARÉES — racine fantôme rejetée (échec franc)');
  // silibuna : sili✓ + buna✗ (buna n'existe pas). Doit être REJETÉ même si phonotactiquement valide.
  check('rootsDeclared(silibami) ok (racines réelles)', rootsDeclared('silibami', ctxBase()).ok === true);
  const dPhantom = rootsDeclared('silibuna', ctxBase());
  check('rootsDeclared(silibuna) KO (buna fantôme)', dPhantom.ok === false && /buna/.test(dPhantom.reason || ''));
  const ctxPhantom = { ...ctxBase(), forgeFn: async () => ({ confluent: 'silibuna', racines: ['sili', 'buna'] }) };
  const rph = await forgeProperName({ nom_fr: 'Test-Fantome', sens: 'x' }, ctxPhantom);
  check('forge d\'une forme à racine fantôme → échec franc', rph.found === false && /fantôme|déclarée|buna/i.test(rph.error || ''));
  check('racine fantôme → rien persisté', ctxPhantom.registry.lookup('Test-Fantome') === null);

  console.log('\n[3] Validation — collision et phonotactique rejetées (échec franc)');
  const ctxCol = { ...ctxBase(), forgeFn: async () => ({ confluent: 'ura' }) };   // ura = eau (attesté)
  const rc = await forgeProperName({ nom_fr: 'Test-Collision', sens: 'x' }, ctxCol);
  check('forme déjà attestée (ura) → rejet + échec franc', rc.found === false && /collision/i.test(rc.error || ''));
  const ctxPho = { ...ctxBase(), forgeFn: async () => ({ confluent: 'tbima' }) };  // attaque 2 consonnes
  const rp = await forgeProperName({ nom_fr: 'Test-Phono', sens: 'x' }, ctxPho);
  check('forme cassée (tbima) → rejet + échec franc', rp.found === false && /cass|phono|consonne/i.test(rp.error || ''));
  check('échec franc → rien persisté', ctxPho.registry.lookup('Test-Phono') === null);

  console.log('\n[3bis] Réparation — 1 essai cassé puis 1 valide → forge réussie');
  let n = 0;
  const ctxFix = { ...ctxBase(), forgeFn: async () => (++n === 1 ? { confluent: 'tbima' } : { confluent: 'silibami', racines: ['sili', 'bami'] }) };
  const rf = await forgeProperName({ nom_fr: 'Test-Repar', sens: 'x' }, ctxFix);
  check('1 reprise après rejet → forge réussie', rf.forged === true && rf.confluent === 'silibami' && n === 2);

  console.log('\n[4] Lookup lexique — nom déjà canonisé (pas de forge)');
  let c2 = 0;
  const ctxLex = { ...ctxBase(), forgeFn: async () => { c2++; return { confluent: 'zzz' }; } };
  const rl = await forgeProperName({ nom_fr: 'la Confluence', sens: 'le lieu où les eaux se mêlent' }, ctxLex);
  check('nom au lexique → source lexique', rl.source === 'lexique');
  check('nom au lexique → forme canonique (uraakota)', rl.confluent === 'uraakota');
  check('nom au lexique → sous-agent PAS appelé', c2 === 0);

  console.log('\n[5] Stub déterministe — même entrée → même sortie, et forme valide');
  const s1 = stubForge({ nomFr: 'Bras-Pleins', sens: 'celui qui porte le regard libre', ctx: ctxBase() });
  const s2 = stubForge({ nomFr: 'Bras-Pleins', sens: 'celui qui porte le regard libre', ctx: ctxBase() });
  check('stub déterministe (2 appels identiques)', s1.confluent === s2.confluent);
  check('stub → forme phonotactiquement valide', validateForm(s1.confluent, ANCIEN).valid);

  console.log('\n[6] Garde — nom_fr manquant → erreur claire, pas de crash');
  const rm = await forgeProperName({ sens: 'x' }, ctxBase());
  check('nom_fr absent → found:false + message', rm.found === false && /nom_fr/i.test(rm.error || ''));

  console.log('\n[7] Sous-agent OUTILLÉ — pilote la boucle tool-use puis rend le JSON (anthropic mocké)');
  let mcalls = 0;
  const mockAnthropic = { messages: { create: async () => {
    mcalls++;
    if (mcalls === 1) return { stop_reason: 'tool_use', usage: { input_tokens: 10, output_tokens: 5 },
      content: [{ type: 'tool_use', id: 't1', name: 'lookup_concept', input: { francais: 'regard' } }] };
    return { stop_reason: 'end_turn', usage: { input_tokens: 8, output_tokens: 6 },
      content: [{ type: 'text', text: 'Forme : {"confluent":"silibami","racines":["sili","bami"],"liaison":"i","decompo":"sil-i-bami"}' }] };
  } } };
  const fTool = await defaultLLMForge({ nomFr: 'Test-Outil', sens: 'le regard de la nuit', ctx: { ...ctxBase(), anthropic: mockAnthropic, forgeModel: 'fake' } });
  check('forge outillée → rend le JSON final parsé', fTool && fTool.confluent === 'silibami');
  check('forge outillée → 1 tour d\'outil puis le final (2 appels)', mcalls === 2);
  check('forge outillée → usage agrégé sur les tours', fTool && fTool._usage && fTool._usage.output_tokens === 11);

  console.log('\n[8] Bénédiction — status beni + renommage + overlay lexique + rejet (remove)');
  const TMP8 = path.join(os.tmpdir(), 'confluent-test-bless.json');
  try { fs.unlinkSync(TMP8); } catch (_) {}
  const reg8 = makeRegistry(TMP8);
  reg8.add({ nom_fr: 'Dos-Large', confluent: 'lobamako', registre: 'mythologique', status: 'provisoire' });
  reg8.add({ nom_fr: 'Œil-Bas', confluent: 'silitoka', registre: 'mythologique', status: 'provisoire' });
  const bl = reg8.setStatus('Dos-Large', 'beni', { confluent: 'dosalaka' });
  check('setStatus beni + renomme la forme', bl.status === 'beni' && bl.confluent === 'dosalaka');
  check('blessed() = seulement les bénis', reg8.blessed().length === 1 && reg8.blessed()[0].nom_fr === 'Dos-Large');
  check('rejet = remove retire l\'entrée', reg8.remove('Œil-Bas') === 1 && reg8.lookup('Œil-Bas') === null);
  const lex8 = { mythologique: { dictionnaire: {} }, ancien: { dictionnaire: {} }, proto: { dictionnaire: {} } };
  overlayBlessedNames(lex8, reg8);
  check('nom béni fusionné au dict mytho (forme renommée)', lex8.mythologique.dictionnaire['dos-large'] && lex8.mythologique.dictionnaire['dos-large'].traductions[0].confluent === 'dosalaka');
  check('entrée fusionnée = type nom_propre', lex8.mythologique.dictionnaire['dos-large'].traductions[0].type === 'nom_propre');
  const rbe = await forgeProperName({ nom_fr: 'Dos-Large', sens: 'x' }, { ...ctxBase(), registry: reg8 });
  check('forge d\'un béni → source lexique + non provisoire', rbe.source === 'lexique' && rbe.provisoire === false && rbe.confluent === 'dosalaka');
  try { fs.unlinkSync(TMP8); } catch (_) {}

  console.log(`\n=== test-forge-name : ${pass} ok, ${fail} ko ===`);
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('ERREUR test:', e); process.exit(1); });
