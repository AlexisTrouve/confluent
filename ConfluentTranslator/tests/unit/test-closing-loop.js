/**
 * Test de la VÉRIFICATION DE CLÔTURE (corrige-ou-confirme) — DÉTERMINISTE, sans réseau.
 *
 * QUOI : pilote translateWithAgent avec un FAUX client Anthropic (réponses scriptées) pour prouver
 *        les 3 chemins : (1) trad sale → renvoi → l'agent CONFIRME (confirme_choix) → servie + override ;
 *        (2) sale → renvoi → l'agent CORRIGE → servie propre ; (3) propre d'emblée → aucun renvoi.
 * POURQUOI : un run live « propre » ne déclenche jamais la boucle ; on ne peut pas se reposer sur une
 *        sortie LLM sale au hasard. Un faux client rend le mécanisme vérifiable à 100%. Jamais bloquant.
 * COMMENT : assertions natives, exit 1 si échec, pour `npm test`.
 */
'use strict';
const { translateWithAgent } = require('../../src/core/translation/translationAgent');
const { ANCIEN } = require('../../src/core/eras/eras');

let pass = 0, fail = 0;
const check = (l, c) => { if (c) { pass++; console.log('  ✓ ' + l); } else { fail++; console.log('  ✗ ' + l); } };

// Faux client Anthropic : débite une file de réponses scriptées (aucun appel réseau).
const fakeClient = (responses) => { let i = 0; return { messages: { create: async () => responses[i++] } }; };
const textResp = (cf) => ({ stop_reason: 'end_turn', usage: {}, content: [{ type: 'text', text: `Ancien Confluent:\n${cf}` }] });
const toolResp = (name, input) => ({ stop_reason: 'tool_use', usage: {}, content: [{ type: 'tool_use', id: 't', name, input }] });
const run = (responses) => translateWithAgent({ text: 'x', systemPrompt: 'x', anthropic: fakeClient(responses), model: 'm', ctx: { era: ANCIEN } });

const DIRTY = 'va naki u nura vo mori u';   // 2 conjugateurs de temps dans 1 proposition → gravité haute
const CLEAN = 'va naki vo mori u';          // 1 seul temps → propre

(async () => {
  console.log('\n[1] sale → renvoi → CONFIRME → servie inchangée + override + note');
  const r = await run([textResp(DIRTY), toolResp('confirme_choix', { note: 'choix poétique assumé' }), textResp(DIRTY)]);
  check('servie (jamais bloquée), trad inchangée', r.valid === true && r.translation === DIRTY);
  check('1 override capturé avec la note', (r.overrides || []).length === 1 && /poétique/.test(r.overrides[0].note));
  check('warning de clôture remonté dans la réponse', (r.grammarWarnings || []).length >= 1);

  console.log('\n[2] sale → renvoi → CORRIGE → servie propre');
  const r2 = await run([textResp(DIRTY), textResp(CLEAN)]);
  check('trad corrigée servie', r2.valid === true && r2.translation === CLEAN);
  check('0 warning restant, 0 override', (r2.grammarWarnings || []).length === 0 && (r2.overrides || []).length === 0);

  console.log('\n[3] propre d\'emblée → aucun renvoi (1 seul check de clôture)');
  const r3 = await run([textResp(CLEAN)]);
  check('servie direct, exactement 1 closingCheck', r3.valid === true && (r3.trace.closingChecks || []).length === 1);

  console.log(`\n${fail === 0 ? '✓' : '✗'} closing-loop : ${pass} ok, ${fail} ko`);
  process.exit(fail === 0 ? 0 : 1);
})();
