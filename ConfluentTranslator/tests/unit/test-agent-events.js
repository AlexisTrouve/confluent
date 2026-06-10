/**
 * Test des ÉVÉNEMENTS de progression de l'agent (streaming « travail de l'agent » dans l'UI).
 *
 * QUOI : prouve que translateWithAgent émet via `onEvent`, DANS L'ORDRE, les étapes attendues
 *        (tool_call → tool_result → gate → final), et reste un NO-OP si onEvent n'est pas fourni
 *        (le chemin /translate classique est inchangé).
 * POURQUOI : c'est le contrat qui alimente le flux SSE ; un run live ne le prouve pas de façon
 *        déterministe. Faux client Anthropic scripté → vérifiable à 100%, sans réseau.
 * COMMENT : assertions natives, exit 1 si échec, pour `npm test`.
 */
'use strict';
const { translateWithAgent } = require('../../src/core/translation/translationAgent');
const { ANCIEN } = require('../../src/core/eras/eras');

let pass = 0, fail = 0;
const check = (l, c) => { if (c) { pass++; console.log('  ✓ ' + l); } else { fail++; console.log('  ✗ ' + l); } };
const fakeClient = (rs) => { let i = 0; return { messages: { create: async () => rs[i++] } }; };
const textResp = (cf) => ({ stop_reason: 'end_turn', usage: {}, content: [{ type: 'text', text: `Ancien Confluent:\n${cf}` }] });
const toolResp = (name, input) => ({ stop_reason: 'tool_use', usage: {}, content: [{ type: 'tool_use', id: 't', name, input }] });

(async () => {
  console.log('\n[1] onEvent reçoit la séquence tool_call → tool_result → gate → final (dans l\'ordre)');
  const events = [];
  const r = await translateWithAgent({
    text: 'x', systemPrompt: 'x', model: 'm', ctx: { era: ANCIEN },
    anthropic: fakeClient([toolResp('validate_form', { confluent: 'naki' }), textResp('va naki vo mori u')]),
    onEvent: (e) => events.push(e)
  });
  const types = events.map(e => e.type);
  check('tool_call émis (validate_form)', events.some(e => e.type === 'tool_call' && e.name === 'validate_form'));
  check('tool_result émis (validate_form)', events.some(e => e.type === 'tool_result' && e.name === 'validate_form'));
  check('gate émis (valide)', events.some(e => e.type === 'gate' && e.valid === true));
  check('final émis (la traduction)', events.some(e => e.type === 'final' && /naki/.test(e.translation || '')));
  check('ordre : tool_call < gate < final', types.indexOf('tool_call') < types.indexOf('gate') && types.indexOf('gate') < types.indexOf('final'));
  check('seq strictement croissant', events.every((e, i) => i === 0 || e.seq > events[i - 1].seq));
  check('la traduction est servie en parallèle', r.valid === true);

  console.log('\n[2] sans onEvent → no-op (aucun crash), traduction normale');
  const r2 = await translateWithAgent({ text: 'x', systemPrompt: 'x', model: 'm', ctx: { era: ANCIEN }, anthropic: fakeClient([textResp('va naki vo mori u')]) });
  check('translateWithAgent marche sans onEvent', r2.valid === true);

  console.log(`\n${fail === 0 ? '✓' : '✗'} agent-events : ${pass} ok, ${fail} ko`);
  process.exit(fail === 0 ? 0 : 1);
})();
