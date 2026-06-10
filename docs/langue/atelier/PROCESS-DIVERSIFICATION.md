# Process de diversification du vocab (playbook) — sortir les mots-tiroir vers des sens NATIFS

> **À lire avant toute session de FIX du vocab.** Ce doc fige la MÉTHODE (pour ne pas la réoublier).
> Le QUOI et le POURQUOI sont dans `../06-CONFLUENT-MYTHIQUE.md` §3-4 ; la CARTO des mots-tiroir dans
> `INVENTAIRE-MOTS-TIROIR.md`. Ici : COMMENT on travaille, concrètement, de façon répétable.

---

## 0. Le principe qui commande tout : GROUNDED-IN-CANON

Diversifier ≠ inventer au feeling, ≠ calquer le français. **Les distinctions natives se DÉRIVENT du
canon de la civilisation** — le `civjdr/livre_de_la_foi/` est la **vérité d'Alexi écrite**. Donc :

- **Le canon TRANCHE.** Pour un champ donné, ce qui décide « quelles distinctions sont natives » = ce que
  *la civilisation distingue/valorise* dans le canon, pas le français ni l'intuition de l'IA.
- **Le français (ancien / noble / sacré) = un GISEMENT**, pas un juge. Il sert à voir les nuances *possibles*
  (mirer/contempler/aviser…) ; le canon dit lesquelles **résonnent** avec le monde confluent.
- **L'IA tranche, grounded-in-canon. Alexi délègue et fait confiance** (cf. la doctrine de traduction : « on
  trust l'intel de l'IA, mais on l'arme »). Alexi reste **souverain sur la vision** (il peut vétoter/réorienter
  un arbitrage), mais il n'a PAS à micro-décider chaque sens. L'IA s'arme du canon AVANT de trancher.

### La carte du canon (où lire quoi, par type de décision)
`civjdr/livre_de_la_foi/` :
- **`canon/COSMOGONIE.md`** ⭐ — l'**axe central** (Regard = *distinguer l'indistinct / faire exister* ⚔️ Vide
  qui *défait*), la **corruption** (privation, jamais substance ; corruption ≠ extinction = rallumable ; le
  **masque ⚔ le voile** = mentir vs abriter), l'**éthique du Regard-mesure** (l'œil qui *cligne* ; ni trop peu
  = cécité/oubli, ni trop = éblouissement/orgueil), les **4 piliers** (VOIR · PORTER « nul ne veille à ta place »
  · CRÉER « rien ne se perd » · FÊTER), l'**au-delà** (Fleuve Pâle / Étoile-héros / Gouffre / Vide ; la mémoire
  des vivants te tient). → la **première lecture** pour presque tout champ.
- **`canon/figures/`** — les forces divines et leurs **paires** (`_paires.md` = la structure même des oppositions
  natives) : Donneuse↔Voilée (voir↔cacher), Rivière↔Lune, Feu↔Sang (don/mérite/universel ↔ lignée/clan/particulier),
  Montagne (Garder↔Avancer), le Père, le Noyau (les ancêtres-qui-veillent). → pour les champs cosmiques/valeurs.
- **`canon/culte/`** — les rites = les valeurs en actes : `la-veille`, `le-culte-du-feu`, `le-geste-du-seuil`,
  `le-nom`, `le-symbole`, `les-signes-de-l-ennemi`, `le-repas-du-foyer`, `l-entretien-du-foyer`, `le-rite-de-la-mort`,
  `le-grand-pelerinage`… → pour les champs d'action/société/rituel.
- **`canon/bestiaire/`** — les antagonistes = le Vide fait chair : `la-grise-faim`, `la-mere-grise`, `l-ebloui`,
  `le-dernier`, `le-grand-pale`, `le-sans-sommeil`. → pour les champs du mal / de la corruption / de la mort.
- **`chants/`** (`chant-01-creation`, `chant-02-eveil`) + **`atelier/GUIDE_ECRITURE.md`** — l'expression vivante
  du sens (le registre, ce qui est *montré*). → pour sentir le ton et confirmer les nuances.
- **Local au projet** : `INVENTAIRE-MOTS-TIROIR.md` (les candidats déjà cartographiés + ce qui est déjà couvert
  au lexique), et le lexique réel `ancien-confluent/lexique/*.json` (formes existantes, frontières actées).

---

## 1. La boucle par CHAMP (répétable)

On traite **un champ à la fois** (un mot-tiroir ou un cluster cohérent). Pour chacun :

**a. SE GROUNDER** — lire (ou faire lire par un agent) le canon pertinent du champ (cf. la carte ci-dessus)
+ l'entrée de l'inventaire. Objectif : savoir *ce que la civilisation distingue* dans ce champ.

**b. TRANCHER les distinctions natives** — décider quels sens uniques on retient (depuis les candidats de
l'inventaire, réévalués à la lumière du canon). Pour chaque sens retenu : il doit se **justifier par le canon**
(une ligne « pourquoi natif »), pas par le français. **Garder les fusions légitimes** (vrais synonymes) et
**respecter les frontières déjà actées** (`ita`/`tuli`, `ena`/`aita`, `èva`/`osi`, `kumu`/`taku`, `voki`/`vosak`,
`seli`/`selu`…). Résoudre les redondances brutes (`konu`/`zakis`, `nutu`/`muki`) en répartissant les sens.

**c. FORGER les formes** — racines/compositions pour les sens retenus, avec les **garanties déterministes**
(§2). Style : finno-basque/japonisant, pas elfique/latin ; y/é/è réservés au sacré (mythologique).

**d. ÉCRIRE les définitions** — chaque sens reçoit une **définition** (QUOI + nuance + **ce qui le distingue
des voisins** + ancrage canon). ⚠️ **La définition n'est pas du décor : c'est ELLE qui arme l'IA pour choisir**
(cf. §3). Format = celui des entrées lexique (`definition`, `nuance`, `registre`, `note`).

**e. INTÉGRER au lexique** — split du mot-tiroir en entrées distinctes dans `ancien-confluent/lexique/*.json`
(ou `mythologique-confluent/` si sacré). Bien tagger `definition`/`nuance`/`synonymes_fr`.

**f. VÉRIFIER + COMMIT** — audit de cohérence VERT (`audit-coherence.py` : phono/forme/fantômes/homophones = 0)
+ **test de traduction** qui exerce le choix (l'IA prend-elle le bon sens natif en contexte ? via le harnais /
`/translate`). Puis commit + push (+ déploiement si pertinent).

---

## 2. Les garanties déterministes (non négociables — on ne fait jamais confiance à l'affirmation)

Toute forme forgée DOIT passer, AVANT d'entrer au lexique :
1. **Gate phonotactique** (`validateForm(forme, era)`) — alphabet de l'ère, pas d'attaque 2 consonnes, jamais 3,
   racine en …CV / verbe en …C.
2. **Anti-collision** — la forme n'est pas déjà attestée pour un AUTRE concept (`byWord`).
3. **Racines déclarées** — une composition se décompose en racines réellement déclarées (pas de racine fantôme),
   via `verify_word` / le décomposeur.
4. **Audit corpus vert** après intégration (on ne casse jamais la cohérence prouvée).
5. **Back-translation** de contrôle sur un test réel (le sens revient-il ?).

> Outillage existant : `ConfluentTranslator/src/core/validation/phonotactics.js`, `audit-coherence.py`, et les
> scripts de validation déjà utilisés pour la strate sacrée. Forge **à la main** (créatif) + validation
> déterministe scriptée. On n'outille un « forgeur de sens commun » que si le volume l'exige.

---

## 3. Armer la traduction (brique technique, une fois — au 1er champ)

Diversifier ne SERT que si l'IA **voit** le choix au moment de traduire. Aujourd'hui `lookup_concept` renvoie
une **glose courte (~80 car.)** → l'IA ne verrait pas les nuances. À faire **au passage du premier champ** (puis
ça profite à tous) :
- **`lookup_concept`** (et l'injection de contexte) : quand un mot FR a **plusieurs sens natifs**, renvoyer
  **TOUTES les options avec leurs définitions complètes** (pas la glose tronquée).
- **Prompt** : instruire l'agent — *« si un mot a plusieurs sens natifs, LIS les définitions et choisis selon le
  contexte ; ne te rabats pas sur le générique / le calque FR. »*
- **Tester de bout en bout sur le 1er champ** (l'IA choisit-elle le bon sens natif ?). Les champs suivants =
  contenu seul (la brique est déjà posée).

---

## 4. Rappels de doctrine (les pièges à ne pas refaire)
- ❌ **Calque français** : ne jamais « un mot Confluent par case française ». ✅ Découper selon le canon.
- ❌ **Sur-diversifier** : ne pas casser les vrais synonymes ni les frontières déjà actées. Trancher = trier.
- ❌ **Forme sans définition** : un sens natif sans définition claire est inutile (l'IA ne pourra pas choisir).
- ❌ **Faire confiance à l'agent sur parole** : toute forme passe les garanties §2 ; tout est vérifié.
- L'IA décide grounded-in-canon ; Alexi garde le veto sur la vision (souverain, pas micro-décideur).

---

## 5. Ordre & état
- **Ordre des champs** : commencer par les plus **cosmologiques/nets** (le Regard : `mirak`/`sili`), où le canon
  tranche le plus clairement et où le test est le plus parlant ; puis dérouler l'inventaire.
- **État** : phase MAPPING faite (inventaire). Phase FIX = ce playbook, champ par champ.

---

*Voir aussi : `06-CONFLUENT-MYTHIQUE.md` (doctrine), `INVENTAIRE-MOTS-TIROIR.md` (carto), `../../CLAUDE.md`
(architecture du traducteur), et le canon `civjdr/livre_de_la_foi/`.*
