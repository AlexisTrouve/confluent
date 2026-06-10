# Méthode — enrichir le lexique DEPUIS LE CANON (la logique de travail)

> **Capture de la méthode de travail sur le vocab — à lire avant tout enrichissement.** C'est *le genre de
> travail qu'on veut* (validé Alexi). Tout part d'un principe unique : **grounded-in-canon**.

---

## Le principe (le cœur de tout)

La langue doit **penser dans les catégories de la Confluence, pas dans celles du français.** Donc TOUTE
distinction lexicale se **DÉRIVE du canon** (le Livre de la Foi : l'axe Regard ⚔ Vide, les figures, les rites,
l'au-delà), **JAMAIS des cases du français.**

- Le français (moderne / ancien / noble / sacré) n'est qu'un **GISEMENT** de nuances *possibles* ; c'est le
  **canon qui décide** lesquelles sont natives.
- **Alexi porte la vision** (que distingue *vraiment* ce peuple ? quels concepts sont atomiques pour lui ?).
  **L'IA dérive du canon, propose, et garantit** (phonotactique, cohérence, anti-collision).

---

## Les DEUX mouvements (complémentaires)

On enrichit la langue de deux façons opposées et symétriques :

### ⬅️ Mouvement A — ÉCLATER les mots-tiroir  *(une forme surchargée → N sens natifs)*
Une forme Confluent unique couvre plusieurs concepts FR distincts (`tuli` = rester/être/habiter). On la **SPLIT**
en sens natifs **découpés selon la vision du monde** (surtout PAS « un mot par case française » = calque).
- **Repérer :** `scripts/scan-tiroirs.js` — union-find sur les synonymes/conjugaisons du lexique → ne montre que
  les formes à **≥2 concepts vraiment distincts** (filtre le bruit : synonymes, conjugaisons, grammaire).
- **Détail :** `INVENTAIRE-MOTS-TIROIR.md` (carto) → `FIX-PROPOSITIONS.md` (résultats).

### ➡️ Mouvement B — DÉCLINER les concepts solo  *(un mot plat → sous-sens que le canon rend riches)* ⭐
L'**INVERSE** : un concept est UN seul mot au lexique, **mais le canon lui donne une STRUCTURE INTERNE riche**
→ il mérite des déclinaisons natives que la langue n'a pas encore. Modèle-phare : `osi` = « mort » (1 mot) alors
que la cosmogonie a **5 destins d'éclat** radicalement distincts.

> **Les TELLS d'un concept-à-décliner — comment les flairer dans le canon :**
> 1. Le canon en fait une **PAIRE bien↔bien** → 2 sens. *(Feu↔Sang = don/mérite ↔ lignée ; voir↔cacher.)*
> 2. Le canon en fait un **AXE à deux pôles d'échec** → 2-3 sens. *(le Regard-mesure : trop-peu=cécité ⚔
>    trop=éblouissement — les deux tombent dans le même Vide.)*
> 3. Le canon lui donne une **structure multi-branches** → N sens. *(la mort → 4 chemins de l'éclat ;
>    l'eau → sourd / coule / se-mêle / reflète.)*
> 4. Le canon en fait une **chose-à-états** → N états. *(l'éclat : propre / assoupi / retourné-en-faim.)*
>
> **Règle simple : quand le LEXIQUE a UN mot mais le CANON a une STRUCTURE → c'est un candidat à décliner.**

- **Méthode de recherche :** agents (Opus) **par DOMAINE du canon** (mort & au-delà / feu & corruption / mémoire
  & nom & lignée / eau-montagne-sang / veille-vertu-folie…). Chaque agent lit les `figures/` + `culte/` +
  `COSMOGONIE.md` pertinents + le lexique actuel, et propose les déclinaisons grounded-in-canon (mapping only).
- **Détail :** `RECHERCHE-DECLINAISONS.md`.

---

## La règle des NŒUDS transversaux
Un même concept-axe surgit souvent dans plusieurs domaines (la **Seconde Mort** traverse mort + mémoire + oubli ;
la **corruption-faim** relie feu + faim + la grise-bête ; le **pôle-haut du Regard** relie orgueil + folie). →
**le forger comme UN concept partagé, jamais en N doublons** par domaine.

---

## Le workflow (commun aux deux mouvements)
1. **Se grounder** dans le canon pertinent (carte du canon : `PROCESS-DIVERSIFICATION.md` §0).
2. **Cartographier** — proposer sens/formes + **définitions** + **ancrage canon** ; **mapping only, PAS de forge.**
3. **Alexi trie** — la vision : quelles distinctions sont réelles pour SON monde (il garde le veto).
4. **Forger** les retenues — **garanties déterministes** (gate phonotactique + anti-collision + racines déclarées)
   + **gabarit racines** (verbe = 5 char CVCVC fin. consonne · nom/sujet = 4 ou 6 char · pas de 7 ; **mix**
   racines opaques pour les primitifs / compositions pour l'analytique). Cf. `PROCESS-DIVERSIFICATION.md` §1-2.
5. **Définir** chaque sens (QUOI + nuance + *ce qui le distingue des voisins* + ancrage canon). **La définition
   est ce qui ARME l'IA** pour choisir (≠ décor).
6. **Intégrer** au lexique (`ancien-confluent/lexique/32-sens-natifs.json`, ou strate sacrée
   `mythologique-confluent/lexique/` si voyelle `è/é/y`) + **armer** le lookup (def + nuance surfacées).
7. **Vérifier** : `audit-coherence.py` 0/0/0/0 · `npm test` · **test live** (`scripts/test-trad.js`, Opus :
   l'IA choisit-elle le bon sens natif en contexte ?). Commit + push à chaque champ.

---

## Outils & doc map
- `scripts/scan-tiroirs.js` — détecte les vrais mots-tiroir *(mouvement A)*.
- **agents Opus par domaine de canon** — découvrent les concepts solo riches *(mouvement B)*.
- `scripts/check-form.js` — valide une forme forgée (gate + collision + décompo).
- `scripts/test-trad.js` — preuve **behavioral** (l'IA emploie-t-elle vraiment le sens natif ?).
- Docs : `PROCESS-DIVERSIFICATION.md` (boucle + garanties + gabarit) · `INVENTAIRE-MOTS-TIROIR.md` +
  `FIX-PROPOSITIONS.md` (mvt A) · `RECHERCHE-DECLINAISONS.md` (mvt B) · doctrine `../06-CONFLUENT-MYTHIQUE.md` §3-4.

---

*L'idée-force : la richesse d'une langue construite ne vient pas du français traduit, mais de **sa propre vision
du monde rendue en distinctions** — qu'on lit dans le canon, qu'on dérive, qu'on garantit, et qu'on prouve en live.*
