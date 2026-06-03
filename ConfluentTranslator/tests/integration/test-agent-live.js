/**
 * Test d'intégration LIVE de l'agent de traduction (appelle le proxy Etheryale réel).
 *
 * QUOI : traduit les phrases qui produisaient des formes CASSÉES en mode "simple request",
 *        via l'agent outillé, et vérifie que chaque sortie passe le gate phonotactique.
 * POURQUOI : seule preuve réelle (doctrine : pas de "ça devrait marcher"). Le gate côté agent
 *        garantit qu'aucune forme invalide ne sort ; ce test confirme que l'agent PRODUIT bien
 *        une traduction valide (et pas seulement qu'il refuse l'invalide).
 * COMMENT : lexique + index chargés, prompt contextuel construit, client Anthropic pointé sur
 *        le proxy. Clé via ETHERYALE_API_KEY (clé de test). Lancement manuel (réseau, non-CI).
 *
 * Usage : ETHERYALE_API_KEY=eai_... ETHERYALE_BASE_URL=https://ai.etheryale.com \
 *         CONFLUENT_MODEL=claude-sonnet-4-6 node tests/integration/test-agent-live.js
 */

'use strict';

const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const { loadAllLexiques, buildReverseIndex } = require('../../src/utils/lexiqueLoader');
const { buildReverseIndex: buildMorphIndex } = require('../../src/core/morphology/reverseIndexBuilder');
const { analyzeContext } = require('../../src/core/translation/contextAnalyzer');
const { buildContextualPrompt } = require('../../src/core/translation/promptBuilder');
const { translateWithAgent } = require('../../src/core/translation/translationAgent');
const { validateTranslation } = require('../../src/core/validation/phonotactics');

const API_KEY = process.env.ETHERYALE_API_KEY;
const BASE_URL = process.env.ETHERYALE_BASE_URL || 'https://ai.etheryale.com';
const MODEL = process.env.CONFLUENT_MODEL || 'claude-sonnet-4-6';

if (!API_KEY) {
  console.error('FATAL: ETHERYALE_API_KEY manquante.');
  process.exit(1);
}

// Phrases jadis cassées (cf. example-phrases.json) — chacune doit ressortir VALIDE.
const PHRASES = [
  'Que la lumière guide ton chemin',   // ex: tbime
  'Je vais vers la montagne',           // ex: lnosu
  'La lune brille sur la forêt',        // ex: zbipo
  'Le soleil éclaire le ciel',          // ex: mkaso
  'La personne observe le regard'       // ex: spima
];

async function main() {
  const baseDir = path.join(__dirname, '..', '..', '..');
  const { ancien } = loadAllLexiques(baseDir);
  const reverseIndex = buildReverseIndex(ancien);
  const morphReverseIndex = buildMorphIndex(ancien);
  const ctx = { lexique: ancien, reverseIndex, morphReverseIndex };

  const anthropic = new Anthropic({ apiKey: API_KEY, baseURL: BASE_URL });

  let pass = 0, fail = 0;
  console.log(`\nModèle: ${MODEL} via ${BASE_URL}\n`);

  for (const fr of PHRASES) {
    const contextResult = analyzeContext(fr, ancien);
    const systemPrompt = buildContextualPrompt(contextResult, 'ancien', fr);

    try {
      const res = await translateWithAgent({ text: fr, systemPrompt, anthropic, model: MODEL, ctx });
      const gate = validateTranslation(res.translation);
      const ok = gate.valid && res.translation.length > 0;
      if (ok) {
        pass++;
        console.log(`  ✓ "${fr}"\n      → ${res.translation}   [outils:${res.toolRounds} réparations:${res.repairs}]`);
      } else {
        fail++;
        console.log(`  ✗ "${fr}" → SORTIE INVALIDE: ${res.translation} | ${JSON.stringify(gate.invalides)}`);
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
