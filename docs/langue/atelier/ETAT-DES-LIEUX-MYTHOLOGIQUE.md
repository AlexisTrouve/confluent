# État des lieux — la couche MYTHOLOGIQUE du Confluent

> **Snapshot complet au 2026-06-11.** Couvre tout : ce qu'est le registre sacré, le vocabulaire enrichi (forge),
> l'**arming** (comment l'IA emploie les sens natifs), le pipeline de traduction, les résultats du jour sur de
> vrais chants, et ce qui reste. Doctrine de fond : `../06-CONFLUENT-MYTHIQUE.md`. Méthode vocab :
> `METHODE-ENRICHISSEMENT.md`. — *Document de référence : à relire avant de reprendre le mythique.*

---

## 0. TL;DR (en une page)

- Le **mythologique** est le **registre sacré** du Confluent : il hérite intégralement de l'ancien et ajoute
  (a) les **voyelles réservées `è/é/y`** (activées seulement ici), (b) une **strate sacrée** de vocabulaire
  (cosmogonie, Vide, Père…), (c) un **ton** dédié (overlay de prompt).
- **Vocabulaire enrichi (forge) : FAIT.** ~114 **sens natifs** diversifiés, en **~20 familles** (mort, ancêtre,
  mémoire, nom, feu, éclat, veille, regard, sang…), via deux mouvements : **éclater les mots-tiroir** (A) et
  **décliner les concepts solo** (B). Tout gate-valide, audit 0/0/0/0.
- **Arming : FAIT (et c'est la nouveauté du jour).** Pour que l'IA *emploie* ces déclinaisons (pas juste qu'elles
  existent), on injecte une **carte compacte des sens natifs** dans le system prompt (groupée par `famille`,
  ~600 tokens cachés). Le **LLM fait le matching sémantique** — pas de détection lexicale fragile.
- **Prouvé sur de vrais chants** (Chant de la Création, mythologique, Opus) : l'agent emploie `vèluk`, `mevak`,
  `tonak`, `èva`, `mori/konu`. **Sémantiquement juste.**
- **CAP OUVERT (demain) : la FORME.** Le rendu reste de la prose correcte ; le canon FR est écrit **à la Éluard**.
  Il faut une **poétique du Confluent** (souffle, image, répétition, musique). Cf. mémoire `confluent-transcreation-eluard`.

---

## 1. Ce qu'est la couche mythologique (le registre sacré)

Le Confluent a **3 ères** (`src/core/eras/eras.js`), source unique des paramètres par ère :
`proto` (primitif) → `ancien` (unifié) → **`mythologique`** (registre sacré, le plus haut).

Le **mythologique HÉRITE de l'ancien** (`...ANCIEN` côté eras.js) — ce n'est PAS une langue séparée, c'est un
**registre**. Il ajoute :
- **Voyelles réservées `è / é / y`** — activées UNIQUEMENT dans le sacré (le plus sacré : `èva`=le Vide,
  `ysili`=le Père). Rares par design. (Hors-norme tolérées héritées : `r` dans le sacré/ancien — ura, ora, kari… ;
  `d` seulement dans les nombres.)
- **Une strate sacrée de vocabulaire** : la cosmogonie des chants (Vide, Père, les sœurs, les mille feux…).
- **Un overlay de prompt** : `prompts/mythologique-system.txt`, posé APRÈS `ancien-system.txt` (cf. §4).

**Doctrine complète et direction : `../06-CONFLUENT-MYTHIQUE.md`** (à lire avant tout travail mytho).
**Le cap** : transcréer les **chants du Livre de la Foi** (`../../../../civjdr/livre_de_la_foi/chants/`).

### Infrastructure du registre (au-delà du vocab — bâtie le 2026-06-10)
- **Mythologique câblé dans TOUS les layers** du translator (gate, morpho, outils, prompt — tous paramétrés par
  l'ère via `eras.js`). Commit `764ae87`.
- **Forge de noms propres** (`forge_proper_name`) : sous-agent OUTILLÉ, modèle découplé **Sonnet 4.6**
  (`CONFLUENT_FORGE_MODEL`), lookup-first, garantie de racines déclarées + anti-collision, persistance (registre
  `data/noms-forges.json`, **gitignoré**, statut provisoire → **béni** via `admin.html` → canon vivant).
  `src/core/translation/{nameForge,forgedNamesRegistry}.js`.
- **Streaming SSE** (`/translate/stream`) : rend le « travail de l'agent » visible en direct (appels d'outils, gate,
  forge, final). EventSource, auth par query.

---

## 2. Le vocabulaire enrichi — la FORGE (mouvements A & B)

**Principe (jamais oublier)** : on enrichit **DEPUIS LE CANON** (la vision Regard ⚔ Vide), **jamais en calquant
le français**. Méthode complète : `METHODE-ENRICHISSEMENT.md`.

### Les deux mouvements
- **(A) Éclater les mots-tiroir** — une forme surchargée (`tuli`=rester/être/habiter) → N sens natifs découpés
  selon la vision du monde. Outil : `scripts/scan-tiroirs.js`. Cartos : `INVENTAIRE-MOTS-TIROIR.md` +
  `FIX-PROPOSITIONS.md`. **FAIT** (~37 sens, champs 1-5 + tail + 6 borderline).
- **(B) Décliner les concepts solo** — un mot plat que le canon rend riche → sous-sens. Modèle : `osi`=mort →
  **5 destins d'éclat**. Recherche : `RECHERCHE-DECLINAISONS.md` (5 agents Opus par domaine de canon).
  **FAIT le 2026-06-11** (61 sens, commit `8a83921`).

### Le résultat : ~114 sens natifs, ~20 familles
Les déclinaisons (commit `8a83921`), nœuds transversaux forgés comme **un** concept partagé :
- **mort** (`osi`) : osiimuli (cueillie) · osiiura (dérive-Fleuve) · osiieku (montée-étoile) · osiivuku (chute-Gouffre)
  · osieva (**Seconde Mort**) · osikari (mémorial) · kesakari (tertre) · tonak (tuer) · velaora (dernière-garde)
- **ancêtre** (`aita`) : aitaura/aitaeku/aitazoka/aitameva (l'oublié) /aitakota (le Chœur)
- **mémoire** (`mori`) : morisuva/morituva/morileku/morimuli/morivoki (+ morisili/morivosak)
- **nom** : nuli (nom gagné, le Feu) ⚔ kinakova (marque-de-sang) · nulim · nulituva
- **feu** (`suki`) : sukvasi/sukikanu/sukimil/sukimukis/sukamako/sukiva
- **éclat/corruption** (`isuki`) : isukesa/isukèva (éclat retourné) /isukilusak/**lusak** (rallumer, gap pur) /mutaeva
  (grise faim) /kisoèva (froid-Vide). *Nœud câblé : isukèva = mutaeva = la bête.*
- **veille** (`vela`) : velis (veiller-le-creusé) /nelak (clignement) /velaeka/velalozak/velaska/kanuvosak…
- **regard** : pôle-haut `solak` (éblouissement) /solasavu (tyrannie) /solakasi (présomption) /solatosa ;
  les 2 folies (`vesuna` privation ⚔ `solavela` excès) ; + tuvak/mevak/lozak/venat
- **sang** : kinatori (lignée) ⚔ sukiva (don-mérite) /kinazoka (vendetta) /kinasora (sang-d'aurore)
- **eau** : sevuna/luvak/urasili (reflet) /selura · **pierre** : karimori/karituli/karizoka · **fête** : desuli/oraveli

### Garanties (déterministes) + gabarit
- **Gate phonotactique** (`core/validation/phonotactics.js`) : aucune forme cassée servie.
- **Gabarit racines** (décision Alexi, commit `defc35d`) : **verbe = 5 char CVCVC** fin. consonne · **nom = 4 ou 6**
  fin. voyelle · **pas de 7** · **mix** racines opaques (primitifs) / compositions (analytique).
- **Anti-collision + racines déclarées** : `scripts/check-form.js`.
- **Audit** : `audit-coherence.py` → 0 phono / 0 forme / 0 racine fantôme / 0 homophone (907 traductions).

### Où ça vit
- Sens **ancien** : `ancien-confluent/lexique/32-sens-natifs.json` (54 déclinaisons + les FIX).
- Sens **sacrés** (è) : `mythologique-confluent/lexique/02-sens-natifs-sacres.json` (vèluk, samoèva, isukèva,
  kisoèva, mutaeva, lusak…).
- Chaque entrée porte : `definition` + `nuance` + `synonymes_fr` (sans article — **PIÈGE** : sinon pas de match) +
  `registre` + **`famille`** (cf. §3).
- **Racine `muli`** (voile/brume) déclarée dans `08-nature-elements.json` (était utilisée mais fantôme).

> ⚠️ **2 arbitrages de vision OUVERTS** (Alexi tranche) : `ena` vs `èva` comme origine ultime ; consolidation
> `zakis` → `konu`.

---

## 3. L'ARMING — faire que l'IA EMPLOIE les sens natifs (nouveauté du jour)

**Le problème.** Forger les déclinaisons ne suffit pas : encore faut-il que l'IA les *emploie*. Or le pipeline
interrogeait le lexique **mot par mot** (`analyze_text` → `searchWord`). Les déclinaisons clées par **phrase**
(`osiieku` = « montée en étoile ») n'étaient jamais atteintes : l'IA composait `osi`+`eku` ou calquait le français.

**Ce qui NE marche PAS (et pourquoi — testé, abandonné).** Une **détection lexicale** par mots-pivots (POC
`poc-concept-detect`/`-stress`, supprimés) : batterie adversariale = **50% de recall** sur paraphrase (le
stemmer ne gère pas devient≠devenir, astres≠étoile), **faux positifs** sur coïncidences (mort+étoile près d'une
rivière → osiieku à tort), ranking faussé. Le sac-de-mots est un plafond. Et le champ `domaine` du lexique est
**inutilisable** (153 cases incohérentes, 496 entrées sans).

**La solution retenue (commit `3c00e6e`).** Le **LLM est le matcher sémantique** — lui SAIT que « héros devient
étoile » = mort héroïque. Il manquait juste la **CONSCIENCE** que `osiieku` existe. Donc : on expose une **CARTE
COMPACTE de tous les sens natifs**, **une fois**, dans le system prompt (cachée par le proxy, ~600 tokens). Pas de
153 domaines, pas de détection fragile, pas de seuil.

### Architecture technique de l'arming
1. **`famille`** — métadonnée INERTE posée sur les 114 sens natifs (`scripts/_tag-familles.js`, re-runnable).
   ~20 familles propres. Le loader / le gate / l'audit **ignorent** le champ → 0 risque (vérifié : audit + tests verts).
2. **`src/core/translation/conceptMap.js`** :
   - `buildConceptMap(lexique)` → groupe par `famille`, label = la clé FR la plus courte (dédoublonnée — le loader
     crée une clé par synonyme), rend « famille : forme=glose ».
   - `getConceptMap(variant)` → **cache statique** (la carte ne bouge pas hors `/api/reload`). Vide pour proto.
3. **`src/core/translation/promptBuilder.js`** → `loadBaseTemplate` (chokepoint unique : contextuel + base +
   fallback) **injecte** `CARTE_HEADER` + la carte. En-tête = directive « **À BALAYER AVANT DE COMPOSER** ; si le
   sens d'un segment colle à une famille, EMPLOIE la forme dédiée ; sinon compose — **ne force pas** ».
4. **`analyze_text` note** (`translationTools.js`, commit `7e16aa7`) : étape explicite « avant de composer un mot
   de `a_composer`, balaie la CARTE ». (Le plan mot-à-mot ancrait sinon la composition.)

### Les preuves
- **Probe sans/avec carte** (Opus, raw) : SANS → `osi eku` / mots français ; AVEC → **`osiieku`**, **`aitameva`**,
  **`osieva`**, **`sukimil`**. La carte flippe le comportement.
- **Agent complet gaté** (Opus) : emploie aitameva, kinazoka, osiieku (même sur la paraphrase « astres/veilleur »
  que le lexical ratait), sukimil ; l'agent **cite explicitement « la carte des sens natifs »**.
- **Non déterministe** (~4/6 hits exacts) : quand le mot littéral est présent (« étoile »=`eku`), le plan mot-à-mot
  ancre encore parfois la composition. Contrôle : phrase banale → compose normalement, **zéro sur-forçage**.

> **Dette connue** : la liste `SENS_NATIFS` de `scripts/test-trad.js` est PÉRIMÉE (rapporte « aucun » à tort) —
> à régénérer depuis les formes taguées `famille`. Et certains **labels** de carte sont du jargon (`velis` =
> « veiller le creusé » ne fait pas le pont avec « esprit qui se vide ») → à polir.

---

## 4. Le pipeline de traduction mytho (rappel)

Tout passe par le **proxy Etheryale** (`ai.etheryale.com`, clé `eai_`, cache auto). Modèle trad par défaut Haiku 4.5 ;
**tests = `claude-opus-4-8` explicite**.

`/translate` (body `{text, target:'mythologique', model?}`) → **agent outillé** :
1. `analyzeContext` → plan mot-à-mot (trouvés / à composer / verbes) + **note qui pointe vers la CARTE**.
2. system prompt = `ancien-system.txt` + `\n\n` + `mythologique-system.txt` (overlay sacré) + `\n\n` + **CARTE** +
   vocabulaire ciblé + racines fallback (`promptBuilder`).
3. Boucle tool-use (10 outils : analyze_text, lookup_concept [surface def+nuance+registre COMPLETS], verify_word,
   check_composition, back_translate, grammar_check, forge_proper_name, confirme_choix…).
4. **Gate phonotactique final** paramétré par l'ère (è/é/y autorisés en mytho) → réparation ciblée → échec franc
   (422 `TRANSLATION_UNVALIDATED`) si pas réparable. **Aucune forme cassée servie.**
- Streaming SSE `/translate/stream` rend le travail de l'agent visible.

---

## 5. Résultats du jour sur un VRAI chant (Chant de la Création, mythologique, Opus)

| Fragment FR | Sortie Confluent | Formes natives employées |
|---|---|---|
| « Il ne tue pas, il défait… on s'y délave doucement, du jour qu'on se laisse oublier » | `va tani zo tonak u, lekan u. va tani ve èva zo osi u, telu vèluk u` | **`tonak`** (tue) · `èva` (Vide) · `osi` (meurt) · ⭐ **`vèluk`** (se délave = la forme sacrée forgée pour *exactement* ça) |
| « Voir, c'est arracher au Vide ; ce qu'on cesse de regarder, le Vide le reprend » | `va mirak u, lo kanuvoli ve èva. va sili zo mevak u, lo va èva pasak eom` | **`mevak`** (cesse de regarder) · `èva` · `sili` *(arracher composé en kanuvoli, pas `tuvak` — un manque)* |
| « Le Vide n'a pas de bête, il a l'attente. On ne le combat qu'en n'oubliant pas » | `no èva va besi zo ita u… va tani vo mori konu eom…` | `èva` · **`mori konu`** (n'oubliant pas = garder en mémoire — natif, pas calque) |

**Verdict.** L'édifice **forge + arming tient sur le vrai matériau** : ça se lit comme du Confluent (SOV, particules,
`è` sacré), pas du français calqué ; les bons concepts sacrés sortent (`vèluk` est le hit parfait). **MAIS** —
verdict Alexi — **« c'est ok mais lacking »** : c'est une traduction *juste*, pas une *transcréation belle*.

---

## 6. Ce qui reste OUVERT

1. **CAP — la POÉTIQUE Éluard** (travaillé le 2026-06-12). Le canon FR est écrit à la Éluard (limpidité, image,
   anaphore, souffle, musique). Notre sortie est de la prose correcte. Il faut une **couche poétique** du Confluent
   (jeux de sons sur les 10 consonnes + voyelles sacrées, parallélisme, rythme des particules, structure de vers).
   → mémoire `confluent-transcreation-eluard`. **À lire d'abord** : la doctrine de transcréation déjà existante
   `civjdr/livre_de_la_foi/chants/traductions/CN/DOCTRINE_TRADUCTION_CN.md` + `chant-01-zh-eluard-mvt1.md`.
2. **Arbitrages de vision** (Alexi tranche) : `ena` vs `èva` origine ultime ; `zakis` → `konu`.
3. **Dette technique** : régénérer la détection de `test-trad.js` (formes taguées `famille`) ; polir les labels
   de carte ambigus (`velis`…) ; renforcer encore le pull si on veut > 4/6 (dé-prioriser le mot littéral dans
   `analyze_text` — risqué, rendements décroissants).
4. **Noms forgés** : registre provisoire à bénir → canon (via `admin.html`).

---

## 7. Carte des fichiers (où vit quoi)

| Quoi | Où |
|---|---|
| Ères (params par registre) | `src/core/eras/eras.js` |
| Gate phonotactique | `src/core/validation/phonotactics.js` |
| Sens natifs ancien | `ancien-confluent/lexique/32-sens-natifs.json` |
| Sens natifs sacrés (è) | `mythologique-confluent/lexique/02-sens-natifs-sacres.json` |
| **Arming — carte** | `src/core/translation/conceptMap.js` (+ injection dans `promptBuilder.js`) |
| **Tag des familles** | `scripts/_tag-familles.js` (champ `famille`) |
| Outils dev | `scripts/check-form.js` · `scan-tiroirs.js` · `test-trad.js` · `audit-coherence.py` |
| Prompts | `prompts/ancien-system.txt` (+ `mythologique-system.txt` overlay) |
| Doctrine mytho | `docs/langue/06-CONFLUENT-MYTHIQUE.md` |
| Méthode vocab | `docs/langue/atelier/METHODE-ENRICHISSEMENT.md` |
| Cartos forge | `docs/langue/atelier/{RECHERCHE-DECLINAISONS,INVENTAIRE-MOTS-TIROIR,FIX-PROPOSITIONS,PROCESS-DIVERSIFICATION}.md` |

---

## 8. Journal des commits (par jour)

### 2026-06-11 — forge mvt B + ARMING
| Commit | Quoi |
|---|---|
| `e4cde4b` | FIX vocab : tail des mots-tiroir (lupak/ita/ota) |
| `7c467ff` | Outil `scan-tiroirs.js` (complétude programmatique des tiroirs) |
| `3979a24` | CLAUDE.md référence les scripts dev + vocab acté FAIT |
| `b10b34f` | FIX : 6 borderline tiroirs traités |
| `844e1ef` | Lune `luna` → `nelu` (de-latinisation, calque interdit) |
| `03c4ec8` | **Méthode** : capture la logique d'enrichissement (les 2 mouvements) + RECHERCHE-DECLINAISONS |
| `8a83921` | **FORGE** déclinaisons (mvt B) : 61 sens natifs intégrés |
| `3c00e6e` | **Arming** : carte des sens natifs (par famille) dans le system prompt |
| `7e16aa7` | **Arming** : renforce le pull (directives « balaie la carte avant de composer ») |

### 2026-06-10 — FONDATION mytho + forge mvt A (les mots-tiroir)
| Commit | Quoi |
|---|---|
| `e521079` | Sécurité : `npm audit` (8 CVE → 0, dont 4 high) + en-têtes défensifs (nosniff, SAMEORIGIN…) |
| `764ae87` | **Mythologique câblé dans TOUS les layers** du translator + 1ère strate sacrée + 2 transcréations |
| `2e7b6aa` | **Vocab des chants** : 24 mots (20 base ancien + 4 sacrés mytho), dérivés du Livre de la Foi |
| `8f4ed10` · `33958fd` | **`forge_proper_name`** : tool de forge de noms propres (sous-agent outillé, Sonnet, lookup-first, racines déclarées, persistance, E2E) |
| `a0fbd0a` | UI : « travail de l'agent » visible EN DIRECT (**streaming SSE**) |
| `ab5b358` | Noms forgés : boucle de **bénédiction** (admin : relire / renommer / bénir / rejeter) |
| `35edb6f` | Docs : nouveau **`06-CONFLUENT-MYTHIQUE.md`** + maj CLAUDE.md / READMEs |
| `ddf790e` · `e1b027d` | Atelier : **inventaire mots-tiroir** (mapping) + **playbook** de diversification |
| `5e0a73a` | **FIX phase 1/2** : ~33 sens natifs forgés (5 agents Opus, grounded-in-canon) + `check-form.js` |
| `3a7d883` | FIX champ 1 (Perception) intégré + **pipeline armé** (lookup surface def + nuance + registre) |
| `9de719c` | FIX champ 2 (Garde, Parole, Action) — 8 sens |
| `1e4d8a6` | FIX champs 4 & 5 (Mal/Antagonisme/Souillure + Corps/Image/Mouvement) — 18 sens |
| `1e7648d` | FIX champ 3 (Existence & Cosmos) — 11 sens (ancien + strate sacrée) |
| `513920d` | FIX clôture : docs de statut à jour + harnais behavioral complet |
| `e81786a` | **Rebalance** racine ↔ composition : 7 primitifs cardinaux en racines opaques (mix) |
| `defc35d` | **Gabarit** longueur racines (décision Alexi) : verbes 5-char CVCVC, plus de 7-char |

### 2026-06-09 — fondations du pipeline agent (le substrat)
Durcissement du traducteur **agentique** avant le mythique : outil `grammar_check` (la syntaxe que le gate phono ne
voit pas) + **vérification de CLÔTURE** (corrige-ou-confirme via `confirme_choix`, déterministe + testée) ; **log
d'apprentissage** (JSONL par trad succès ET échec + `analyze-translations.js` → gaps de lexique actionnables vs
idiomes-gérés) ; fix **idiomes** dans le prompt (vouloir/comme/ainsi/se-souvenir → briques natives, **zéro calque**)
+ 3 mots de contenu (samo/lupak/venak) ; renfort « discipline du conjugateur » ; monitoring Discord couche 1
(erreur app → webhook, throttlé, hors 422) ; E2E frontend « sans pitié » (22 tests, unhappy paths). → **tout le
mythique repose sur ce socle agent.**

---

*Substrat acquis : forge + arming. Cap neuf : la FORME (poétique Éluard). « Aujourd'hui = les bons concepts ;
demain = faire chanter la langue. »*
