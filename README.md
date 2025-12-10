# Confluent - Constructed Language Project

**Confluent** is a complete constructed language (conlang) created for the Civilization of the Confluence, a fictional civilization from the **civjdr** tabletop RPG project.

This repository contains:
- **Complete linguistic system**: phonology, morphology, grammar, syntax
- **Dual language variants**: Proto-Confluent (primitive) and Ancient Confluent (unified)
- **Translation API**: French to Confluent using LLMs (Claude/GPT)
- **Web interface**: Real-time translation with multiple models
- **Comprehensive documentation**: Full language reference

## Features

### Linguistic System

- **67 roots** (15 sacred, 52 standard) with consistent phonology
- **16 sacred liaisons** for word composition
- **Complete verbal system** (12 verbs + conjugators)
- **SOV syntax** with particles
- **Base-12 number system** (culturally anchored)
- **Metaphorical emotion system** (body-based expressions)

### Translation Tools

- **Multi-provider support**: Anthropic Claude, OpenAI GPT
- **Real-time translation**: French → Confluent with layer-by-layer breakdown
- **Bidirectional support**: Confluent → French translation
- **Batch processing**: Translate multiple words/phrases at once
- **Coverage analysis**: Pre-translation text analysis

## Quick Start

### Prerequisites

- Node.js 16+
- API key from Anthropic or OpenAI

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/confluent.git
cd confluent

# Configure environment
cp .env.example .env
# Edit .env and add your API keys

# Install dependencies
cd ConfluentTranslator
npm install

# Start the server
npm start
```

Visit http://localhost:3000 to access the translation interface.

## Examples

### Word Formation

```
sili (sight/observation) + -i- (agent) + aska (free)
→ siliaska = "The ones who carry free sight"
→ Name of the civilization's people
```

### Translation

| French | Ancient Confluent | Meaning |
|--------|-------------------|---------|
| Les enfants des échos | nakukeko | Children of echoes (caste) |
| La Confluence | uraakota | The Confluence (sacred place) |
| Joie | koriasora | Heart-sun (emotion) |
| Observer | silitoki | To observe |

## Project Structure

```
confluent/
├── docs/                           # Complete documentation
│   ├── langue/                     # Linguistic reference
│   │   ├── 01-PHONOLOGIE.md        # Phonology & sounds
│   │   ├── 02-MORPHOLOGIE.md       # Roots & sacred liaisons
│   │   ├── 03-GRAMMAIRE.md         # Verbs & conjugations
│   │   ├── 04-SYNTAXE.md           # Syntax & sentence structure
│   │   └── 05-VOCABULAIRE.md       # Complete lexicon
│   ├── culture/                    # Cultural context
│   └── SYSTEM_PROMPT_LLM.md        # LLM system prompt
├── data/
│   └── lexique.json                # Structured language data
├── ConfluentTranslator/            # Translation API & web interface
│   ├── src/api/server.js           # Express API
│   ├── public/index.html           # Web UI
│   └── prompts/                    # LLM prompts
├── ancien-confluent/               # Ancient Confluent variant data
└── proto-confluent/                # Proto-Confluent variant data
```

## Documentation

### Language Reference

1. [Phonology](docs/langue/01-PHONOLOGIE.md) - Sounds and phonetic rules
2. [Morphology](docs/langue/02-MORPHOLOGIE.md) - Word structure and liaisons
3. [Grammar](docs/langue/03-GRAMMAIRE.md) - Verbs and conjugations
4. [Syntax](docs/langue/04-SYNTAXE.md) - Sentence construction
5. [Vocabulary](docs/langue/05-VOCABULAIRE.md) - Complete lexicon

### Cultural Context

- [Civilization Context](docs/culture/CONTEXTE_CIVILISATION.md) - Values and culture
- [Reference Lexicon](docs/LEXIQUE_REFERENCE_CONFLUENCE.md) - Vocabulary to translate

### For Developers

- [LLM System Prompt](docs/SYSTEM_PROMPT_LLM.md) - Complete prompt for translation
- [API Documentation](ConfluentTranslator/README.md) - Translation API reference

## API Endpoints

The ConfluentTranslator API provides:

- `POST /translate` - French → Confluent translation
- `POST /api/translate/conf2fr` - Confluent → French translation
- `GET /api/search` - Search in lexicon
- `POST /api/analyze/coverage` - Text coverage analysis
- `POST /api/translate/batch` - Batch translation

See [API Documentation](ConfluentTranslator/README.md) for details.

## Language Variants

### Proto-Confluent
- Primitive language of early clans
- Reduced phonology: 4 vowels, 8 consonants
- Simple SOV syntax
- Isolated words, no fusion

### Ancient Confluent (Main)
- Unified civilization language
- Complete phonology: 5 vowels, 10 consonants
- 16 sacred liaisons for composition
- Full verbal and temporal system

## Contributing

This is a creative worldbuilding project for the **civjdr** RPG. Contributions are welcome for:
- New vocabulary proposals (respecting linguistic rules)
- Documentation improvements
- Translation tool enhancements
- Bug fixes

Please ensure:
- ~20-25% sacred roots (vowel-initial)
- Phonetic consistency (see phonology rules)
- Cultural anchoring (observation, transmission, memory)

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Credits

Created as part of the **civjdr** worldbuilding project.

Linguistic design inspired by:
- Finnish phonology (~70% original creations)
- Basque-like structures (~20%)
- SOV syntax patterns (~10%)

Translation powered by:
- Anthropic Claude
- OpenAI GPT

## Links

- Main project: [civjdr](../civjdr)
- Related projects: [ChineseClass](../ChineseClass), [SEOGenerator](../seogeneratorserver)

---

**Note**: This is a fictional constructed language for creative purposes. All content is original worldbuilding material.
