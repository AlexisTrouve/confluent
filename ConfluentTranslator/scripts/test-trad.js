/**
 * test-trad — harnais de traduction ciblée (dev/atelier), variant-flexible.
 *
 * QUOI : `node scripts/test-trad.js "<texte FR>" [ancien|mythologique|proto] [modèle]` → passe le texte
 *        par EXACTEMENT le pipeline de POST /translate (analyse → prompt contextuel → agent outillé →
 *        gate) et imprime la traduction + quels SENS NATIFS (32-sens-natifs) ont été employés.
 * POURQUOI : prouver le COMPORTEMENT de la diversification (l'IA choisit-elle le bon sens natif en
 *        contexte ?), pas seulement que le lookup les surface. Test behavioral, pas lecture de code.
 * COMMENT : modèle par défaut = claude-opus-4-8 (règle : requêtes de test = Opus explicite). Clé via
 *        ETHERYALE_API_KEY (env). Flag des formes natives présentes dans la sortie gatée.
 */
'use strict';
require('dotenv').config();
const path = require('path');
const { Anthropic } = require('@anthropic-ai/sdk');
const { loadAllLexiques } = require('../src/utils/lexiqueLoader');
const { buildReverseIndex: buildConfluentIndex } = require('../src/core/morphology/reverseIndexBuilder');
const { analyzeContext } = require('../src/core/translation/contextAnalyzer');
const { buildContextualPrompt } = require('../src/core/translation/promptBuilder');
const { translateWithAgent } = require('../src/core/translation/translationAgent');
const { getEra } = require('../src/core/eras/eras');

const TEXT = process.argv[2] || "Tant qu'on se souvient de l'ancêtre, il demeure.";
const VARIANT = process.argv[3] || 'ancien';
const MODEL = process.argv[4] || 'claude-opus-4-8';
// Formes natives forgées (champ 1) à repérer dans la sortie pour juger le CHOIX de l'IA.
const SENS_NATIFS = ['silituli', 'mirieva', 'silimori', 'morisili', 'sekakota', 'siliveli'];

(async () => {
  const baseDir = path.join(__dirname, '..', '..');
  const lexique = loadAllLexiques(baseDir)[VARIANT];
  const ctx = { lexique, morphReverseIndex: buildConfluentIndex(lexique), era: getEra(VARIANT) };
  const anthropic = new Anthropic({
    apiKey: process.env.ETHERYALE_API_KEY,
    baseURL: process.env.ETHERYALE_BASE_URL || 'https://ai.etheryale.com'
  });
  const systemPrompt = buildContextualPrompt(analyzeContext(TEXT, lexique), VARIANT, TEXT);

  console.log('FR      :', TEXT, '\nRegistre:', VARIANT, '| Modèle:', MODEL, '\n' + '─'.repeat(60));
  const r = await translateWithAgent({ text: TEXT, systemPrompt, anthropic, model: MODEL, ctx });
  console.log('TRAD (gatée) :', r.translation);
  const used = SENS_NATIFS.filter(f => (r.translation || '').includes(f) || (r.rawResponse || '').includes(f));
  console.log('SENS NATIFS employés :', used.length ? used.join(', ') : '(aucun — fallback générique ?)');
  console.log('\n── RAISONNEMENT (extrait) ──');
  console.log((r.rawResponse || '').slice(0, 900));
})().catch(e => { console.error('ERREUR:', e.message); process.exit(1); });
