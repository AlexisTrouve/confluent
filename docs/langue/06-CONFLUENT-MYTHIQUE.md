# 06 — LE CONFLUENT MYTHIQUE (registre sacré)

> Le **Confluent mythologique** (ou « mythique ») est le **registre haut** de la langue, dédié à la
> transcréation des textes sacrés de la Confluence — les **chants du Livre de la Foi** (`../civjdr/livre_de_la_foi/chants/`).
> Il réalise le palier d'évolution que `01-PHONOLOGIE.md` annonçait sous le nom « Confluent Classique ».

---

## 1. Ce que c'est (et ce que ce n'est PAS)

Le mythique **n'est PAS une langue distincte**. C'est l'**ancien diversifié vers le haut** :

- Il **hérite TOUT l'ancien** (lexique quotidien, 16 liaisons, conjugateurs, particules, syntaxe SOV).
- Il **active les voyelles réservées `y` / `é` / `è`** — réservées au plus sacré/archaïque (le Vide, le Père). Rares par design : en mettre partout casserait le feel finno-basque/japonisant.
- Il **superpose une strate sacrée** (cosmogonie : le Vide, l'Éveilleur, la Veille, les deux sœurs…).
- Il **privilégie la parataxe** (juxtaposition d'images scandées) là où le français empile des subordonnées.

Techniquement, c'est une **ère** parmi `proto` / `ancien` / `mythologique` (`src/core/eras/eras.js`) :
toutes les briques (gate phonotactique, morpho, outils de l'agent) sont paramétrées par l'ère, donc le
mythique se branche « comme une ère de plus ».

---

## 2. La strate sacrée (cosmogonie)

Cœur conceptuel des chants. **Formes DRAFT** (l'onomastique divine est l'acte du créateur — révisable) ;
fichier : `mythologique-confluent/lexique/01-cosmogonie-sacree.json`.

| Concept | Confluent | Composition / note |
|---|---|---|
| **le Vide** (oubli/néant, « l'eau sous la glace ») | `èva` | racine sacrée, `è` activé — antériorité archaïque absolue. PAS `osi` (mort) : le Vide *défait*, il ne tue pas |
| **le Premier Veilleur / le Père** | `ysili` | `y` + sili (regard) = « le Regard premier », l'œil dont descendent tous les regards |
| **l'Éveilleur** | `sokitori` | sok-i-tori (éveil + agent + personne) |
| **la Donneuse-de-Jour** (sœur ardente) | `soranaku` | sor-a-naku (soleil + relation + fille) |
| **la Voilée** (sœur de brume) | `mulinaku` | mul-i-naku (voile + agent + fille) — parallèle de soranaku |
| **la braise** (éclat du Père en chaque vivant) | `isuki` | i- + suki (feu) = le feu premier/intérieur |
| **la Veille** (institution sacrée, née d'en bas) | `vela` | réemploi élevé du vigile (cf. sikuvela) |
| **le Sans-Sommeil** (bête de la Donneuse) | `sorapo` | sor-a-apo (oiseau-soleil) |
| **le Grand-Pâle** (bête de la Voilée, l'haleine douce) | `pulimuli` | puli (souffle) + muli (brume) |
| **mille feux** (l'essaimage du Père) | `isukimako` | isuki + mako (multitude des braises) |
| **paupière** (le battement veille/sommeil = vie/mort) | `silimuli` | sili (œil) + muli (voile) |

Le **vocab de base des chants** (neige `lumi`, glace `kima`, dégel `mela`, aval `luva`, attendre `vesan`,
montrer `silak`…) vit dans `ancien-confluent/lexique/31-vocab-chants.json` (l'ancien, hérité par le mythique).

---

## 3. ⭐ DOCTRINE — diversifier SANS calquer le français

C'est le principe directeur du travail de vocabulaire sur le mythique.

### Le problème : les mots-tiroir
Certaines formes Confluent sont **surchargées** — un seul mot fait le boulot de plusieurs concepts français
distincts. Ex : `tuli` = rester / demeurer / être / habiter ; `ota` = autre / étranger / inconnu ;
`konu` = garder / protéger. La langue **s'appuie sur quelques racines fourre-tout** au lieu d'avoir du relief.

### Le piège À ÉVITER : la relexification
**NE PAS** découper un mot-tiroir selon les **cases du français** (`tuli` → un mot pour « rester », un pour
« être », un pour « habiter »). Ce serait du **français déguisé en Confluent** — un calque. La langue n'aurait
toujours aucune pensée propre, elle copierait les distinctions du français.

### Ce qu'on FAIT : créer des sens natifs uniques
Forger des racines qui portent des **sens découpés selon la vision du monde de la Confluence** (le Regard,
le Vide, la mémoire, la veille, l'eau/confluence, la transmission) — **pas selon celle du français**. Ces sens
**n'ont pas forcément d'équivalent propre en un mot français**, parce que le peuple pense le monde autrement.

> **Exemple — `tuli` (demeurer).** Au lieu de copier rester/être/habiter, on crée les distinctions que *la
> civilisation* trouve cruciales :
> - **« demeurer en étant tenu par un regard »** (persister parce qu'on est vu/mémorisé = arraché au Vide)
> - vs **« demeurer en s'effaçant »** (durer tout en se délavant vers l'oubli)
>
> Deux racines distinctes là où le français n'en a aucune — parce que c'est *leur* obsession (Regard ⚔️ Vide).

**Garde-fou :** ne pas tout casser. Certaines fusions sont **légitimes** (synonymes, nuances) ou **assumées**
(`aska` = libre/liberté, voulu). Le travail = **trier** : concept distinct conflaté par paresse (→ diversifier)
vs synonyme/ombre légitime (→ garder). **Alexi porte la vision** (que distingue *vraiment* ce peuple ?),
l'IA propose des racines + garantit phonotactique et cohérence.

---

## 4. ⭐ La traduction du mythique : l'IA décide, on l'ARME

Conséquence directe de la doctrine §3.

- **C'est TOUJOURS l'IA qui traduit, en autonomie.** Pas de human-in-the-loop qui tranche chaque sens.
  On **fait confiance à l'intelligence de l'IA**.
- **MAIS** comme les sens natifs ne se devinent pas (laissée seule, l'IA retomberait sur le mot-tiroir ou
  **calquerait le français**, son réflexe le plus sûr), il faut lui **DONNER la matière pour choisir en
  connaissance de cause**. Pour chaque mot français à rendre :
  1. **les formes qui matchent** ce mot français (candidates),
  2. **les propositions** = les sens natifs diversifiés qu'on a créés,
  3. **les définitions** de chacun (la nuance précise, et ce qui le distingue des voisins).
- Avec ça **sous les yeux**, l'IA **tranche elle-même** quel concept natif colle au contexte — par **choix
  éclairé**, pas par défaut sur le mot-tiroir.

→ Le **mode reste l'auto-translate** (cf. `/translate`), on l'**enrichit** d'une palette de sens natifs +
leurs définitions. La **définition n'est pas du décor : c'est ce qui permet à l'IA de choisir.**

**Implication technique (à construire) :** quand un mot FR a **plusieurs sens natifs**, le pipeline doit
**toutes les surfacer avec leurs vraies définitions** à l'agent. Aujourd'hui `lookup_concept` renvoie une
glose **courte** (~80 car.) ; il faudra servir les options **complètes** pour que l'IA *voie* le choix.

---

## 5. Subordination → parataxe (transcréer, pas calquer)

Les chants français sont pleins de relatives/subordonnées. Le Confluent n'en a pas (cf. `04-SYNTAXE.md`).
On **ne les calque pas** : on rend l'effet par **juxtaposition d'images courtes scandées** (le style sacré
confluent EST paratactique, comme les Préceptes), + les connecteurs (`lo` = ainsi/donc), la répétition.
On garde **l'image et le rythme**, pas la structure grammaticale.

> « Voir, c'est arracher au Vide ; ce qu'on cesse de regarder, le Vide le reprend »
> → trois battements : (voir = tenir) · (on cesse de regarder) · (le Vide reprend).

Voix **oraculaire** : « nous / tu / on », jamais « je ». **Montrer, jamais expliquer** (pas de glose dans la
sortie). Temps hauts : `amat` (passé mythique), `eom` (éternel/immuable).

---

## 6. Forge des noms propres + bénédiction

Les noms (personnages, lieux, bêtes : Œil-Bas, le Sans-Sommeil…) se forgent via l'outil **`forge_proper_name`**
(`src/core/translation/nameForge.js`) : sous-agent **outillé** (Sonnet 4.6) qui compose des **vraies racines**,
**lookup-first** (un nom forgé une fois reste stable), **garantie déterministe** (gate + anti-collision +
racines déclarées), persistance dans un registre gitignoré (`status: provisoire`).

**Bénédiction** (admin) : `admin.html` → panneau « Noms forgés » → relire / renommer / **Bénir** (→ canon
vivant, fusionné au lexique) / **Rejeter**. Un nom béni devient utilisable en traduction (`source: lexique`).
Détail : voir l'architecture du traducteur dans `../../CLAUDE.md` et `../../ConfluentTranslator/README.md`.

---

## 7. État & prochaines étapes

**Fait :** l'ère mythologique est câblée dans tous les layers ; strate sacrée + vocab des chants seedés ;
forge de noms + bénédiction ; transcréations de préceptes prouvées (gate vert).

**En cours / à venir :**
1. **Diversifier le vocab** (§3) — créer les sens natifs uniques sur les mots-tiroir (le carburant). 🗺️ **Inventaire fait** (cartographie des mots-tiroir + champ FR ancien/noble/sacré + distinctions natives candidates) : `atelier/INVENTAIRE-MOTS-TIROIR.md`. Reste la phase FIX (trancher + forger).
2. **Enrichir la traduction mythique** (§4) — surfacer les options + définitions à l'agent.
3. **Grammaire** — devices natifs pour le benefactif (« à ta place »), la copule définitionnelle (« X c'est Y »).
4. **Transcréer les chants** en volume dans cette strate.

---

*Document linguistique — Civilisation de la Confluence. Voir aussi : `01-PHONOLOGIE.md` (voyelles réservées),
`05-VOCABULAIRE.md` (lexique de base), `../culture/CONTEXTE_CIVILISATION.md` (la vision du monde).*
