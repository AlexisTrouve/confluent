/**
 * Test d'intégration LIVE — traduction FR → PROTO-Confluent via l'agent (ère=proto).
 *
 * QUOI : traduit des phrases simples vers le proto, avec ctx.era = PROTO (gate 8C/4V, pas de
 *        liaisons/conjugateurs, prompt proto-system.txt, lexique proto). Vérifie que la sortie
 *        passe le GATE PROTO (donc pas de u/v/z, pas de cluster).
 * POURQUOI : prouver que le multi-ère fonctionne de bout en bout — le proto se traduit avec SES
 *        règles, pas celles de l'ancien. (Doctrine : preuve réelle, pas « le code compile ».)
 *
 * Usage : ETHERYALE_API_KEY=eai_... CONFLUENT_MODEL=claude-haiku-4-5-20251001 \
 *         node tests/integration/test-agent-proto-live.js
 */
'use strict';

const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const { loadAllLexiques } = require('../../src/utils/lexiqueLoader');
const { buildReverseIndex: bmi } = require('../../src/core/morphology/reverseIndexBuilder');
const { analyzeContext } = require('../../src/core/translation/contextAnalyzer');
const { buildContextualPrompt } = require('../../src/core/translation/promptBuilder');
const { translateWithAgent } = require('../../src/core/translation/translationAgent');
const { validateTranslation } = require('../../src/core/validation/phonotactics');
const { PROTO } = require('../../src/core/eras/eras');

const API_KEY = process.env.ETHERYALE_API_KEY;
const MODEL = process.env.CONFLUENT_MODEL || 'claude-haiku-4-5-20251001';
if (!API_KEY) { console.error('FATAL: ETHERYALE_API_KEY manquante.'); process.exit(1); }

const PHRASES = ['l\'enfant voit l\'eau', 'la mère donne la pierre', 'l\'homme mange'];

async function main() {
  const baseDir = path.join(__dirname, '..', '..', '..');
  const { proto } = loadAllLexiques(baseDir);
  const ctx = { lexique: proto, morphReverseIndex: bmi(proto), era: PROTO };
  const anthropic = new Anthropic({ apiKey: API_KEY, baseURL: process.env.ETHERYALE_BASE_URL || 'https://ai.etheryale.com' });

  let pass = 0, fail = 0;
  console.log(`\nÈre: PROTO · Modèle: ${MODEL}\n`);
  for (const fr of PHRASES) {
    const cr = analyzeContext(fr, proto);
    const sp = buildContextualPrompt(cr, 'proto', fr);
    try {
      const res = await translateWithAgent({ text: fr, systemPrompt: sp, anthropic, model: MODEL, ctx });
      // Re-valider explicitement avec le gate PROTO (l'agent l'a déjà fait via ctx.era).
      const g = validateTranslation(res.translation, PROTO);
      if (g.valid && res.translation) {
        pass++;
        console.log(`  ✓ "${fr}"\n      → ${res.translation}   [gate proto OK, outils:${res.toolRounds} rép:${res.repairs}]`);
      } else {
        fail++;
        console.log(`  ✗ "${fr}" → ${res.translation} | ${JSON.stringify(g.invalides)}`);
      }
    } catch (e) {
      fail++;
      console.log(`  ✗ "${fr}" → ERREUR (${e.code || 'err'}): ${e.message}`);
    }
  }
  console.log(`\n==== ${pass} pass, ${fail} fail ====`);
  process.exit(fail > 0 ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
