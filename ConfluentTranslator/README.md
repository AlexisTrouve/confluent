# ConfluentTranslator

Traducteur **Français → Confluent** (`proto` / `ancien` / **`mythologique`**) propulsé par un **agent LLM outillé**.

La traduction n'est pas une simple requête : un agent consulte le lexique et la grammaire via des outils, puis **toute sortie passe un gate phonotactique déterministe**. Une forme cassée (cluster de consonnes illégal, p. ex. `tbime`) ne peut JAMAIS être servie — elle déclenche une réparation, et un échec franc si elle reste irréparable.

Briques avancées : **système multi-ère** (`src/core/eras/eras.js`), **registre mythologique** (sacré, transcréation des chants — voir `../docs/langue/06-CONFLUENT-MYTHIQUE.md`), **forge de noms propres** (`forge_proper_name` + bénédiction admin), et **streaming SSE** qui montre le travail de l'agent en direct.

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

# Modèle de traduction par défaut. Haiku 4.5 = coût minimal ; la qualité vient de l'agent + du gate.
CONFLUENT_MODEL=claude-haiku-4-5-20251001
# Modèle de FORGE de noms propres (découplé : rare mais enjeu canon). Défaut Sonnet 4.6.
CONFLUENT_FORGE_MODEL=claude-sonnet-4-6
# (optionnel) chemin du registre des noms forgés (gitignoré). Défaut data/noms-forges.json.
# FORGED_NAMES_PATH=...

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
- `core/eras/eras.js` — registre des ères (proto/ancien/mythologique) : alphabet, liaisons, conjugateurs, prompt
- `core/validation/phonotactics.js` — le gate (port JS de `audit-coherence.py`), paramétré par ère
- `core/translation/translationTools.js` — les **10 outils** + exécuteurs (dont `back_translate`, `grammar_check`, `confirme_choix`, `forge_proper_name`)
- `core/translation/translationAgent.js` — la boucle (tool-use, gate, réparation, clôture, échec franc) + `onEvent` (streaming SSE)
- `core/translation/nameForge.js` + `forgedNamesRegistry.js` — forge de noms propres (sous-agent outillé, Sonnet) + registre (provisoire → béni → canon vivant)
- `core/translation/{contextAnalyzer,promptBuilder}.js` — sélection lexique + assemblage prompt
- `core/morphology/*` — décomposition racine-liaison-racine, conjugaison, index inversé
- `prompts/ancien-system.txt` (+ `mythologique-system.txt` en overlay sacré) — system prompts

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
| GET  | `/translate/stream` | **Streaming SSE** : travail de l'agent en direct (outils, gate, forge, final) |
| POST | `/api/forge-name` | Forge (ou retrouve) un nom propre Confluent |
| GET / POST | `/api/admin/forged-names[/bless\|/reject]` *(admin)* | Revue / **bénédiction** / rejet des noms forgés |
| POST | `/api/translate/conf2fr` | Confluent → FR (mot-à-mot) ; `/llm` pour raffiné |
| POST | `/api/translate/batch` | Lot de mots (lookup lexique) |
| GET  | `/api/lexique/:variant` | Lexique `proto` / `ancien` / `mythologique` |
| GET  | `/api/search` | Recherche lexique |

`/translate` body : `{ text, target: "ancien"|"proto"|"mythologique", model? }`. Une réponse **422** signale un échec de validation (jamais de Confluent cassé servi).

## Langues (ères)

- **Ancien Confluent** — langue unifiée : 5 voyelles, 10 consonnes, 16 liaisons sacrées, système verbal complet, SOV.
- **Proto-Confluent** — langue primitive : phonologie réduite (4V/8C), mots isolés, pas de fusion.
- **Confluent mythologique** — registre sacré : hérite l'ancien + active y/é/è + strate sacrée (cosmogonie des chants). Voir `../docs/langue/06-CONFLUENT-MYTHIQUE.md`.
