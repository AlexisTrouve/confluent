# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

**Confluent** est un projet de création d'une langue construite (conlang) pour la Civilisation de la Confluence, une civilisation fictive du projet de jeu de rôle **civjdr**.

## État actuel

Le système linguistique de base est **validé et documenté** :
- 16 liaisons sacrées · système verbal complet (conjugateurs) · syntaxe SOV avec particules
- 6 castes et 6 lieux nommés
- Dictionnaire vivant : ~1833 entrées (`ancien-confluent/lexique/*.json`), **corpus prouvé 100% cohérent** (audit phonotactique/forme/racines/homophones vert)

Le **traducteur est désormais agentique** (et non plus une simple requête LLM) : un agent outillé qui consulte le lexique/la grammaire et dont **toute sortie passe un gate phonotactique déterministe** — aucune forme cassée ne peut être servie. Voir « Architecture du traducteur » ci-dessous.

## Structure du projet

```
confluent/
├── CLAUDE.md                    # Ce fichier
├── docs/
│   ├── SYSTEM_PROMPT_LLM.md     # Prompt pour contextualiser un LLM
│   ├── LEXIQUE_REFERENCE_CONFLUENCE.md  # Vocabulaire à traduire
│   ├── langue/                  # Documentation linguistique
│   │   ├── 01-PHONOLOGIE.md     # Sons, consonnes, voyelles
│   │   ├── 02-MORPHOLOGIE.md    # Racines, liaisons sacrées
│   │   ├── 03-GRAMMAIRE.md      # Verbes, conjugaisons, particules
│   │   ├── 04-SYNTAXE.md        # Structure de phrase, négation, questions
│   │   └── 05-VOCABULAIRE.md    # Lexique validé (castes, lieux)
│   ├── culture/
│   │   └── CONTEXTE_CIVILISATION.md  # Contexte culturel
│   └── archive/
│       └── PLAN_LANGUE_REGARD_LIBRE.md  # Document de travail original
└── data/
    └── lexique.json             # Données structurées (racines, liaisons)
```

## Documents de référence

### Pour comprendre la langue
1. `docs/langue/01-PHONOLOGIE.md` - Sons et règles phonétiques
2. `docs/langue/02-MORPHOLOGIE.md` - Structure des mots et liaisons
3. `docs/langue/03-GRAMMAIRE.md` - Verbes et conjugaisons
4. `docs/langue/04-SYNTAXE.md` - Construction des phrases
5. `docs/langue/05-VOCABULAIRE.md` - Lexique complet

### Pour le contexte
- `docs/culture/CONTEXTE_CIVILISATION.md` - Valeurs et culture
- `docs/LEXIQUE_REFERENCE_CONFLUENCE.md` - Vocabulaire à traduire

### Pour un LLM
- `docs/SYSTEM_PROMPT_LLM.md` - Prompt système complet

### Données structurées
- `data/lexique.json` - Racines, liaisons, particules en JSON

## Règles linguistiques (résumé)

### Phonétique et Orthographe
- **Consonnes (10):** b, k, l, m, n, p, s, t, v, z
- **Voyelles actives (5):** a, e, i, o, u
- **Voyelles réservées:** y, é, è (expansion future)
- **Exceptions hors-norme (ne PAS étendre):** `r` toléré dans le sacré/ancien (ura, ora, kari, kori, mori, sora, zeru…) ; `d` toléré uniquement dans les nombres (diku, deku…). La norme pour toute création reste les 10 consonnes.

**⚠️ IMPORTANT : Pas de majuscules en Confluent**
- Le Confluent n'a PAS de distinction majuscule/minuscule
- Tout le texte Confluent est écrit en MINUSCULES
- Les noms propres, castes, lieux sont TOUS en minuscules : "uraakota", "siliaska", "aliaska"
- Les lexiques JSON stockent tout en minuscules

### Structure des racines
- Toute racine **finit par CV** (consonne + voyelle)
- **~80% standard** : commence par consonne (ex: sili, toka)
- **~20% sacrée** : commence par voyelle (ex: aska, ura)

### Les 16 liaisons sacrées

| Base | Liaisons | Domaine |
|------|----------|---------|
| **I** | i, ie, ii, iu | Agentivité |
| **U** | u, ui | Appartenance |
| **A** | a, aa, ae, ao | Relation |
| **O** | o, oa | Tension |
| **E** | e, ei, ea, eo | Dimension |

### Composition
```
sili (regard) + -i- (agent) + aska (libre)
→ sil- + i + aska = Siliaska
```

## Vocabulaire validé

### Castes
| Français | Confluent |
|----------|-----------|
| Enfants des Échos | Nakukeko |
| Enfants du Courant | Nakuura |
| Ailes-Grises | Aliaska |
| Faucons Chasseurs | Akoazana |
| Passes-bien | Takitosa |
| Voix de l'Aurore | Oraumi |

### Lieux
| Français | Confluent |
|----------|-----------|
| La Confluence | Uraakota |
| Gouffre Humide | Vukuura |
| Antres des Échos | Kekutoka |
| Cercles de Vigile | Sikuvela |
| Halls des Serments | Talusavu |
| Grande Fresque | Ekakova |

### Peuple
**Siliaska** = "Les porteurs du regard libre"

## API ConfluentTranslator

Le serveur de traduction (`ConfluentTranslator/server.js`) expose les endpoints suivants :

### Gestion des lexiques
- **GET** `/lexique` - Retourne le lexique ancien (legacy)
- **GET** `/api/lexique/:variant` - Retourne le lexique pour `proto` ou `ancien`
- **GET** `/api/stats` - Statistiques des lexiques chargés
- **POST** `/api/reload` - Recharge les lexiques (développement)

### Recherche et analyse
- **GET** `/api/search?q=<mot>&variant=<proto|ancien>&direction=<fr2conf|conf2fr>` - Recherche dans le lexique
- **POST** `/api/analyze/coverage` - Analyse la couverture d'un texte français avant traduction

### Traduction
- **POST** `/translate` - FR → Confluent via **l'agent outillé** (gate phonotactique garanti, retourne layers 1-3). `body: { text, target, model? }` — plus de `provider`/clés custom.
- **POST** `/api/translate/raw` - Appel LLM brut sans agent ni gate (debug)
- **POST** `/api/translate/batch` - Traduction par lot de mots (lookup lexique pur)
- **POST** `/api/translate/conf2fr` - Confluent → FR (mot-à-mot) ; `/conf2fr/llm` pour raffinement

> Réponse 422 `TRANSLATION_UNVALIDATED` = l'agent n'a pas pu produire une forme valide après réparations (échec franc, jamais de Confluent cassé servi).

## Architecture du traducteur (agent)

Tout passe par le **proxy Etheryale** (`https://ai.etheryale.com`, OAuth Claude Max+, cache auto) — provider unique, **OpenAI/ChatGPT retiré**. Modèle par défaut **Haiku 4.5** (`CONFLUENT_MODEL`) : la qualité vient des outils + du gate, pas de la puissance brute (prouvé : 5/5 valides sur Haiku).

Modules clés (`ConfluentTranslator/src/`) :
- `core/validation/phonotactics.js` — **le gate** déterministe (port JS de `audit-coherence.py`). `validateForm`/`validateTranslation`.
- `core/translation/translationTools.js` — **5 outils** Anthropic : `lookup_concept` (FR→forme canon), `get_grammar`, `validate_form`, `verify_word` (décompo corpus : conjugaison+liaison), `check_composition`.
- `core/translation/translationAgent.js` — **la boucle** : tool-use → gate final → réparation ciblée (cap) → échec franc.
- `prompts/ancien-system.txt` — system prompt (règles phonotactiques dures + auto-vérif + exemples vérifiés contre le lexique).

Config : `ETHERYALE_API_KEY` (clé `eai_`), `ETHERYALE_BASE_URL`, `CONFLUENT_MODEL`. Tests : `npm test` (gate + outils + régression), `npm run test:agent` (live, clé requise).

## Prochaines étapes

1. Étendre le lexique sur les gaps révélés par l'agent (mots qui forcent une composition)
2. Définir les formules rituelles
3. Résoudre les questions ouvertes (propositions relatives, subordination)
4. Étape 2 : Confluent mythologique (transcréation des chants)

## Conventions de travail

- **Ratio sacré/standard** : garder ~20-25% de racines sacrées (V initial)
- **Mix phonétique** : ~70% créations originales, ~20% finnois-like, ~10% basque-like
- **Éviter** : sons trop elfiques (L/R liquides), sons anglo/latins (th, ph)
- **Tester** : chaque nouvelle racine avec des compositions

## Lien avec civjdr

Ce projet est un sous-projet de `../civjdr`. La langue reflète les valeurs de la civilisation : observation, transmission, mémoire, confluence/union.
