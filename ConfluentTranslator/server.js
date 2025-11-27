require('dotenv').config({ path: '../.env' });
const express = require('express');
const path = require('path');
const fs = require('fs');
const { Anthropic } = require('@anthropic-ai/sdk');
const OpenAI = require('openai');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

// Load prompts
const protoPrompt = fs.readFileSync(path.join(__dirname, 'prompts', 'proto-system.txt'), 'utf-8');
const ancienPrompt = fs.readFileSync(path.join(__dirname, 'prompts', 'ancien-system.txt'), 'utf-8');

// Translation endpoint
app.post('/translate', async (req, res) => {
  const { text, target, provider, model } = req.body;

  if (!text || !target || !provider || !model) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const systemPrompt = target === 'proto' ? protoPrompt : ancienPrompt;

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

app.listen(PORT, () => {
  console.log(`ConfluentTranslator running on http://localhost:${PORT}`);
});
