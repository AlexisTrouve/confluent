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

// Translation endpoint
app.post('/translate', async (req, res) => {
  const { text, target, provider, model, useLexique = true } = req.body;

  if (!text || !target || !provider || !model) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const variant = target === 'proto' ? 'proto' : 'ancien';
  const basePrompt = target === 'proto' ? protoPrompt : ancienPrompt;

  // Enhance prompt with lexique data if requested
  const systemPrompt = useLexique
    ? buildEnhancedPrompt(basePrompt, variant)
    : basePrompt;

  try {
    let translation;

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

      translation = message.content[0].text;

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

      translation = completion.choices[0].message.content;
    } else {
      return res.status(400).json({ error: 'Unknown provider' });
    }

    res.json({ translation });

  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: error.message });
  }
});

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
