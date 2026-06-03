# ConfluentTranslator

Traducteur **Français → Ancien Confluent** (et Proto-Confluent) propulsé par un **agent LLM outillé**.

La traduction n'est pas une simple requête : un agent consulte le lexique et la grammaire via des outils, puis **toute sortie passe un gate phonotactique déterministe**. Une forme cassée (cluster de consonnes illégal, p. ex. `tbime`) ne peut JAMAIS être servie — elle déclenche une réparation, et un échec franc si elle reste irréparable.

## Installation

```bash
cd ConfluentTranslator
npm install
```

## Configuration

Copier `.env.example` vers `.env` et renseigner :

```env
# Provider LLM UNIQUE : proxy Etheryale (OAuth Claude Max+, cache auto, pas de limite tokens)
ETHERYALE_API_KEY=eai_...
ETHERYALE_BASE_URL=https://ai.etheryale.com

# Modèle par défaut. Haiku 4.5 = coût minimal ; la qualité vient de l'agent + du gate.
CONFLUENT_MODEL=claude-haiku-4-5-20251001

PORT=3000
JWT_SECRET=...
```

> OpenAI/ChatGPT et les clés providers directes ont été retirés : **tout passe par le proxy Etheryale**.

## Lancement

```bash
npm start            # http://localhost:3000
```

## Architecture de l'agent

```
FR → contextAnalyzer (lexique pertinent) → promptBuilder (règles + contexte)
   → translationAgent (boucle tool-use)
        ├─ lookup_concept(fr)        → forme canonique du lexique
        ├─ get_grammar(sujet)        → règles officielles (conjugateurs, liaisons, SOV…)
        ├─ validate_form(cf)         → gate phonotactique
        ├─ verify_word(cf)           → décompo corpus (conjugaison + liaison)
        └─ check_composition(...)    → racines déclarées + liaison + forme valides
   → GATE final (phonotactics.js) → réparation ciblée si invalide → échec franc sinon
```

Modules (`src/`) :
- `core/validation/phonotactics.js` — le gate (port JS de `audit-coherence.py`)
- `core/translation/translationTools.js` — les 5 outils + exécuteurs
- `core/translation/translationAgent.js` — la boucle (tool-use, gate, réparation, échec franc)
- `core/translation/{contextAnalyzer,promptBuilder}.js` — sélection lexique + assemblage prompt
- `core/morphology/*` — décomposition racine-liaison-racine, conjugaison, index inversé
- `prompts/ancien-system.txt` — system prompt (phonotactique dure + auto-vérif + exemples vérifiés)

## Tests

```bash
npm test             # gate phonotactique + 5 outils + régression lexique
npm run test:agent   # intégration LIVE (traduit les phrases jadis cassées, vérifie le gate)
                     # requiert ETHERYALE_API_KEY ; ex: CONFLUENT_MODEL=claude-haiku-4-5-20251001
npm run test:e2e     # Playwright (UI)
```

## Endpoints principaux

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/translate` | FR → Confluent via l'agent (layers 1-3, gate garanti) |
| POST | `/api/translate/conf2fr` | Confluent → FR (mot-à-mot) |
| POST | `/api/translate/conf2fr/llm` | Confluent → FR raffiné (LLM) |
| POST | `/api/translate/batch` | Lot de mots (lookup lexique) |
| GET  | `/api/lexique/:variant` | Lexique `proto` / `ancien` |
| GET  | `/api/search` | Recherche lexique |

`/translate` body : `{ text, target: "ancien"|"proto", model? }`. Une réponse **422** signale un échec de validation (jamais de Confluent cassé servi).

## Langues

- **Ancien Confluent** — langue unifiée : 5 voyelles, 10 consonnes, 16 liaisons sacrées, système verbal complet, SOV.
- **Proto-Confluent** — langue primitive : phonologie réduite, mots isolés, pas de fusion.
