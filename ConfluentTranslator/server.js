require('dotenv').config({ path: '../.env' });
const express = require('express');
const path = require('path');
const fs = require('fs');
const { Anthropic } = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const {
  loadAllLexiques,
  searchLexique,
  generateLexiqueSummary,
  buildReverseIndex
} = require('./lexiqueLoader');
const { analyzeContext } = require('./contextAnalyzer');
const { buildContextualPrompt, getBasePrompt, getPromptStats } = require('./promptBuilder');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Load prompts
const protoPrompt = fs.readFileSync(path.join(__dirname, 'prompts', 'proto-system.txt'), 'utf-8');
const ancienPrompt = fs.readFileSync(path.join(__dirname, 'prompts', 'ancien-system.txt'), 'utf-8');

// Load lexiques dynamically from JSON files
const baseDir = path.join(__dirname, '..');
let lexiques = { proto: null, ancien: null };
let reverseIndexes = { proto: null, ancien: null };

function reloadLexiques() {
  console.log('Loading lexiques...');
  lexiques = loadAllLexiques(baseDir);
  reverseIndexes = {
    proto: buildReverseIndex(lexiques.proto),
    ancien: buildReverseIndex(lexiques.ancien)
  };
  console.log('Lexiques loaded successfully');
}

// Initial load
reloadLexiques();

// Legacy lexique endpoint (for backward compatibility)
app.get('/lexique', (req, res) => {
  // Return ancien-confluent by default (legacy behavior)
  if (!lexiques.ancien) {
    return res.status(500).json({ error: 'Lexique not loaded' });
  }
  res.json(lexiques.ancien);
});

// New lexique endpoints
app.get('/api/lexique/:variant', (req, res) => {
  const { variant } = req.params;

  if (variant !== 'proto' && variant !== 'ancien') {
    return res.status(400).json({ error: 'Invalid variant. Use "proto" or "ancien"' });
  }

  if (!lexiques[variant]) {
    return res.status(500).json({ error: `Lexique ${variant} not loaded` });
  }

  res.json(lexiques[variant]);
});

// Search endpoint
app.get('/api/search', (req, res) => {
  const { q, variant = 'ancien', direction = 'fr2conf' } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter "q"' });
  }

  if (variant !== 'proto' && variant !== 'ancien') {
    return res.status(400).json({ error: 'Invalid variant. Use "proto" or "ancien"' });
  }

  const results = searchLexique(lexiques[variant], q, direction);
  res.json({ query: q, variant, direction, results });
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
  res.json({
    proto: {
      total_entries: lexiques.proto?.meta?.total_entries || 0,
      files_loaded: lexiques.proto?.meta?.files_loaded?.length || 0,
      loaded_at: lexiques.proto?.meta?.loaded_at
    },
    ancien: {
      total_entries: lexiques.ancien?.meta?.total_entries || 0,
      files_loaded: lexiques.ancien?.meta?.files_loaded?.length || 0,
      loaded_at: lexiques.ancien?.meta?.loaded_at
    }
  });
});

// Reload endpoint (for development)
app.post('/api/reload', (req, res) => {
  try {
    reloadLexiques();
    res.json({
      success: true,
      message: 'Lexiques reloaded',
      stats: {
        proto: lexiques.proto?.meta?.total_entries || 0,
        ancien: lexiques.ancien?.meta?.total_entries || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Build enhanced prompt with lexique data
function buildEnhancedPrompt(basePrompt, variant) {
  const lexique = lexiques[variant];
  if (!lexique) return basePrompt;

  const summary = generateLexiqueSummary(lexique, 300);

  return `${basePrompt}

# LEXIQUE COMPLET (${lexique.meta.total_entries} entrées)
${summary}
`;
}

// Translation endpoint (NOUVEAU SYSTÈME CONTEXTUEL)
app.post('/translate', async (req, res) => {
  const { text, target, provider, model, useLexique = true } = req.body;

  if (!text || !target || !provider || !model) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const variant = target === 'proto' ? 'proto' : 'ancien';

  try {
    let systemPrompt;
    let contextMetadata = null;

    // NOUVEAU: Analyse contextuelle et génération de prompt optimisé
    if (useLexique) {
      const contextResult = analyzeContext(text, lexiques[variant]);
      systemPrompt = buildContextualPrompt(contextResult, variant);

      // Générer métadonnées pour Layer 2
      const promptStats = getPromptStats(systemPrompt, contextResult);
      contextMetadata = {
        wordsFound: contextResult.metadata.wordsFound,
        wordsNotFound: contextResult.metadata.wordsNotFound,
        entriesUsed: contextResult.metadata.entriesUsed,
        totalLexiqueSize: contextResult.metadata.totalLexiqueSize,
        tokensFullLexique: promptStats.fullLexiqueTokens,
        tokensUsed: promptStats.promptTokens,
        tokensSaved: promptStats.tokensSaved,
        savingsPercent: promptStats.savingsPercent,
        useFallback: contextResult.useFallback,
        expansionLevel: contextResult.metadata.expansionLevel
      };
    } else {
      systemPrompt = getBasePrompt(variant);
    }

    let translation;
    let rawResponse;

    if (provider === 'anthropic') {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const message = await anthropic.messages.create({
        model: model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          { role: 'user', content: text }
        ]
      });

      rawResponse = message.content[0].text;
      translation = rawResponse;

    } else if (provider === 'openai') {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ]
      });

      rawResponse = completion.choices[0].message.content;
      translation = rawResponse;
    } else {
      return res.status(400).json({ error: 'Unknown provider' });
    }

    // Parser la réponse pour extraire Layer 1 et Layer 3
    const parsed = parseTranslationResponse(rawResponse);

    // Construire la réponse avec les 3 layers
    const response = {
      // Layer 1: Traduction
      layer1: {
        translation: parsed.translation
      },

      // Layer 2: Contexte (COT hors LLM)
      layer2: contextMetadata,

      // Layer 3: Explications LLM
      layer3: {
        decomposition: parsed.decomposition,
        notes: parsed.notes,
        wordsCreated: parsed.wordsCreated || []
      },

      // Compatibilité avec ancien format
      translation: parsed.translation
    };

    res.json(response);

  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Parse la réponse du LLM pour extraire les différentes sections
 * @param {string} response - Réponse brute du LLM
 * @returns {Object} - Sections parsées
 */
function parseTranslationResponse(response) {
  const lines = response.split('\n');

  let translation = '';
  let decomposition = '';
  let notes = '';
  let currentSection = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Détecter les sections
    if (trimmed.match(/^(Ancien )?Confluent:/i)) {
      currentSection = 'translation';
      continue;
    }
    if (trimmed.match(/^D[ée]composition:/i)) {
      currentSection = 'decomposition';
      continue;
    }
    if (trimmed.match(/^Notes?:/i) || trimmed.match(/^Explication:/i)) {
      currentSection = 'notes';
      continue;
    }

    // Ajouter le contenu à la section appropriée
    if (currentSection === 'translation' && trimmed && !trimmed.match(/^---/)) {
      translation += line + '\n';
    } else if (currentSection === 'decomposition' && trimmed) {
      decomposition += line + '\n';
    } else if (currentSection === 'notes' && trimmed) {
      notes += line + '\n';
    } else if (!currentSection && trimmed && !trimmed.match(/^---/)) {
      // Si pas de section détectée, c'est probablement la traduction
      translation += line + '\n';
    }
  }

  return {
    translation: translation.trim() || response.trim(),
    decomposition: decomposition.trim(),
    notes: notes.trim()
  };
}

// Batch translation endpoint
app.post('/api/translate/batch', async (req, res) => {
  const { words, target = 'ancien' } = req.body;

  if (!words || !Array.isArray(words)) {
    return res.status(400).json({ error: 'Missing or invalid "words" array' });
  }

  const variant = target === 'proto' ? 'proto' : 'ancien';
  const results = {};

  for (const word of words) {
    const found = searchLexique(lexiques[variant], word, 'fr2conf');
    if (found.length > 0 && found[0].traductions?.length > 0) {
      results[word] = {
        found: true,
        traduction: found[0].traductions[0].confluent,
        all_traductions: found[0].traductions
      };
    } else {
      results[word] = { found: false };
    }
  }

  res.json({ target, results });
});

app.listen(PORT, () => {
  console.log(`ConfluentTranslator running on http://localhost:${PORT}`);
  console.log(`Loaded: ${lexiques.ancien?.meta?.total_entries || 0} ancien entries, ${lexiques.proto?.meta?.total_entries || 0} proto entries`);
});
