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

**Système MULTI-ÈRE** : `proto` (primitif) / `ancien` (unifié) / **`mythologique`** (registre sacré). Toutes les briques (gate, morpho, outils) sont paramétrées par l'ère (`src/core/eras/eras.js`). Le **Confluent mythologique** est câblé dans tous les layers : registre haut de l'ancien (hérite tout + active y/é/è) avec une strate sacrée (cosmogonie des chants), une **forge de noms propres** (`forge_proper_name`), et un **streaming SSE** qui rend le travail de l'agent visible en direct. **→ Doctrine et direction complètes : `docs/langue/06-CONFLUENT-MYTHIQUE.md`** (à lire avant tout travail sur le mythique).

> **⭐ Doctrine vocab (en cours)** : diversifier les « mots-tiroir » (formes surchargées : `tuli`=rester/être/habiter…) **SANS calquer le français** — créer des **sens natifs uniques** (découpés selon la vision du monde de la Confluence), pas des splits par cases françaises. La traduction reste **auto** (l'IA décide), mais on l'**arme** : formes candidates + propositions natives + **définitions**, pour qu'elle choisisse en connaissance de cause. Détail : `docs/langue/06-CONFLUENT-MYTHIQUE.md` §3-4.

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
6. `docs/langue/06-CONFLUENT-MYTHIQUE.md` - **Registre sacré + doctrine vocab (mots-tiroir → sens natifs) + traduction du mythique**

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
- **Voyelles réservées:** y, é, è — réservées dans proto/ancien, **ACTIVÉES dans le registre mythologique** (le plus sacré : `èva`=le Vide, `ysili`=le Père). Rares par design.
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
- **POST** `/translate` - FR → Confluent via **l'agent outillé** (gate phonotactique garanti, retourne layers 1-3). `body: { text, target, model? }` — `target` ∈ `proto` | `ancien` | **`mythologique`**.
- **GET** `/translate/stream?text=&target=&model=&apiKey=` - **streaming SSE** : émet le « travail de l'agent » en direct (appels d'outils + résultats, gate, forge, final). EventSource, auth par query.
- **POST** `/api/translate/raw` - Appel LLM brut sans agent ni gate (debug)
- **POST** `/api/translate/batch` - Traduction par lot de mots (lookup lexique pur)
- **POST** `/api/translate/conf2fr` - Confluent → FR (mot-à-mot) ; `/conf2fr/llm` pour raffinement

### Forge de noms propres + bénédiction
- **POST** `/api/forge-name` - forge (ou retrouve) un nom propre Confluent. `body: { nom_fr, sens, target? }`. Lookup-first → sous-agent outillé (Sonnet) → gate+anti-collision+racines déclarées → persiste (provisoire).
- **GET** `/api/admin/forged-names` *(admin)* - liste les noms forgés.
- **POST** `/api/admin/forged-names/bless` *(admin)* - **bénir** (+ renommage validé par le gate) → canon vivant.
- **POST** `/api/admin/forged-names/reject` *(admin)* - **rejeter** (suppression nette).

> Réponse 422 `TRANSLATION_UNVALIDATED` = l'agent n'a pas pu produire une forme valide après réparations (échec franc, jamais de Confluent cassé servi).

## Architecture du traducteur (agent)

Tout passe par le **proxy Etheryale** (`https://ai.etheryale.com`, OAuth Claude Max+, cache auto) — provider unique, **OpenAI/ChatGPT retiré**. Modèle de traduction par défaut **Haiku 4.5** (`CONFLUENT_MODEL`) : la qualité vient des outils + du gate. Modèle de **forge de noms** découplé : **Sonnet 4.6** (`CONFLUENT_FORGE_MODEL`) — rare mais enjeu canon, pas du Haiku.

Modules clés (`ConfluentTranslator/src/`) :
- `core/eras/eras.js` — registre des **ères** (proto/ancien/mythologique) : alphabet, liaisons, conjugateurs, lexiqueDir, prompt — source unique des paramètres par ère.
- `core/validation/phonotactics.js` — **le gate** déterministe (port JS de `audit-coherence.py`), paramétré par ère. `validateForm`/`validateTranslation`.
- `core/translation/translationTools.js` — **10 outils** Anthropic : `analyze_text` (plan FR), `lookup_concept`, `get_grammar`, `validate_form`, `verify_word` (décompo corpus), `check_composition`, `back_translate` (contrôle de sens), `grammar_check`, `confirme_choix` (clôture), `forge_proper_name` (noms propres).
- `core/translation/translationAgent.js` — **la boucle** : tool-use → gate final → réparation ciblée → vérif de clôture → échec franc. Callback `onEvent` (streaming SSE « travail de l'agent »).
- `core/translation/nameForge.js` + `forgedNamesRegistry.js` — forge de noms propres (sous-agent outillé) + registre persistant (provisoire → béni → canon vivant). Bénédiction via `admin.html`.
- `prompts/ancien-system.txt` (+ `mythologique-system.txt` en overlay sacré) — system prompts.

Config : `ETHERYALE_API_KEY` (clé `eai_`), `ETHERYALE_BASE_URL`, `CONFLUENT_MODEL`, `CONFLUENT_FORGE_MODEL`, `FORGED_NAMES_PATH` (registre, gitignoré). Tests : `npm test` (gate + outils + ères + forge + mytho + régression), `npm run test:e2e` (Playwright), `npm run test:agent` (live, clé requise). **Scripts dev (atelier vocab)** : `scripts/check-form.js <forme> [ère]` (valide une forme forgée : gate + anti-collision + décompo) · `scripts/scan-tiroirs.js [ère] [--all]` (détecte les VRAIS mots-tiroir restants — union-find sur synonymes/conjugaisons, filtre le bruit) · `scripts/test-trad.js "<fr>" [ère] [modèle]` (test behavioral d'une trad, Opus par défaut). **Infra prod** : nginx `confluent.conf` à **300s** (les appels LLM lents).

## Prochaines étapes

Cap réel = **transcréer les chants du Livre de la Foi** dans le registre mythologique. En cours (cf. `docs/langue/06-CONFLUENT-MYTHIQUE.md`) :

1. ✅ **Diversifier le vocab** — **FAIT** : ~37 sens natifs (5 champs + tail), `ancien-confluent/lexique/32-sens-natifs.json` + strate sacrée `mythologique-confluent/lexique/02-sens-natifs-sacres.json`. Méthode/résultats : `docs/langue/atelier/{PROCESS-DIVERSIFICATION,INVENTAIRE-MOTS-TIROIR,FIX-PROPOSITIONS}.md`. Gabarit racines : verbe=5 char CVCVC, nom=4/6 char, mix racines/compositions. **Complétude vérifiée** par `scripts/scan-tiroirs.js` (plus aucun gros tiroir ; reste = synonymes/fusions légitimes).
2. ✅ **Armer la traduction** — **FAIT** : `lookup_concept` surface `definition` + `nuance` complètes → l'IA choisit le bon sens natif (prouvé live Opus).
3. **Grammaire** — devices natifs pour le benefactif (« à ta place ») et la copule définitionnelle (« X c'est Y »).
4. **Transcréer les chants** en volume + figer les noms forgés bénis en lexique versionné. *(2 arbitrages de vision ouverts : `ena` vs `èva` origine ultime ; consolidation `zakis`→`konu`.)*

## Conventions de travail

- **Ratio sacré/standard** : garder ~20-25% de racines sacrées (V initial)
- **Mix phonétique** : ~70% créations originales, ~20% finnois-like, ~10% basque-like
- **Éviter** : sons trop elfiques (L/R liquides), sons anglo/latins (th, ph)
- **Tester** : chaque nouvelle racine avec des compositions

## Lien avec civjdr

Ce projet est un sous-projet de `../civjdr`. La langue reflète les valeurs de la civilisation : observation, transmission, mémoire, confluence/union.
