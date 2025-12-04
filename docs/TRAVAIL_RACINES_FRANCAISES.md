# Travail : Système de Racines Françaises

## Objectif

Améliorer le matching des mots français conjugués/accordés en utilisant un système de **racines françaises** au lieu de se fier uniquement à la lemmatisation automatique.

## Problème actuel

- "manger" trouve "mukis" ✅
- "mangé" ne trouve RIEN ❌
- "vu" ne trouve pas "voir" ❌
- "pris" ne trouve pas "prendre" ❌

Le lemmatizer actuel est trop basique et rate beaucoup de formes conjuguées.

## Solution : Système hybride avec racines manuelles

### 1. Déclaration manuelle des racines françaises dans le lexique

**Principe** : Ajouter un champ `racine_fr` dans chaque entrée du lexique avec le **dénominateur commun le plus long** qui couvre toutes les conjugaisons/formes du mot.

**IMPORTANT** : Ce n'est PAS une extraction automatique des 4 premières lettres. C'est un **travail manuel intelligent** pour déterminer la meilleure racine pour chaque mot.

**Exemples** :
- "manger" → `racine_fr: "mang"` (4 lettres) → couvre mangé, mange, mangeait, mangerons...
- "donner" → `racine_fr: "donn"` (4 lettres) → couvre donné, donne, donnait, donnerons...
- "comparer" → `racine_fr: "compar"` (6 lettres) → couvre comparé, compare, comparaison...
- "comprendre" → `racine_fr: "compr"` (5 lettres) → couvre compris, comprend, comprenait...

**Structure dans le lexique** :
```json
"manger": {
  "racine_fr": "mang",
  "traductions": [...],
  "synonymes_fr": ["mange", "mangé", "mangeait"]
}

"comparer": {
  "racine_fr": "compar",
  "traductions": [...],
  "synonymes_fr": ["comparé", "compare", "comparaison"]
}

"comprendre": {
  "racine_fr": "compr",
  "traductions": [...],
  "synonymes_fr": ["compris", "comprend", "comprenait"]
}
```

**Comportement du matching** :

Quand l'utilisateur tape "comparé" :
1. Le système cherche les entrées dont `racine_fr` matche le début de "comparé"
2. Il trouve `"compar"` → match "comparer" ✅
3. Il ne trouve PAS `"compr"` (trop court) → ne propose pas "comprendre" ✅

Quand l'utilisateur tape "comprend" :
1. Le système trouve :
   - `"compr"` (5 lettres) → match "comprendre" ✅
   - `"comp"` pourrait aussi matcher si on avait un mot avec cette racine
2. En cas de **multiples matches**, le système retourne **TOUS les candidats** au LLM
3. Le **LLM choisit** selon le contexte de la phrase

**Avantages** :
- Contrôle total sur la longueur de chaque racine (4, 5, 6 lettres selon le besoin)
- Gère les ambiguïtés en laissant le LLM arbitrer
- Plus précis qu'une extraction automatique aveugle

### 2. Formes irrégulières dans `synonymes_fr`

**Principe** : Ajouter toutes les formes conjuguées dans le champ `synonymes_fr` du lexique

**Exemples de cas nécessitant `synonymes_fr`** :

#### Formes trop différentes de la racine
- **"voir"** → `racine_fr: "voi"` couvre "voit", "voyait", "voyons"
  - MAIS "vu", "vus", "vue", "vues" sont trop différents → à mettre dans `synonymes_fr`

- **"être"** → formes trop différentes (est, suis, sont, été, était, sera, fut...)
  - Impossible d'avoir une racine unique → tout dans `synonymes_fr`

- **"avoir"** → formes trop différentes (a, ai, ont, eu, avait, aura...)
  - Impossible d'avoir une racine unique → tout dans `synonymes_fr`

#### Verbes irréguliers avec changement de radical
- **"prendre"** → `racine_fr: "pren"` couvre "prend", "prenait", "prendra"
  - MAIS "pris", "prit", "prise" ont un radical différent → dans `synonymes_fr`

- **"faire"** → `racine_fr: "fai"` couvre "fais", "faisait", "faisons"
  - MAIS "fait", "faite", "faites" ont un radical différent → dans `synonymes_fr`

**Combinaison racine + synonymes** :
```json
"voir": {
  "racine_fr": "voi",
  "synonymes_fr": ["vu", "vus", "vue", "vues", "observer", "regarder"]
}

"prendre": {
  "racine_fr": "pren",
  "synonymes_fr": ["pris", "prit", "prise", "prises"]
}
```

Le système essaie d'abord la racine, puis les synonymes.

---

## TRAVAIL 1 : Modification du code (contextAnalyzer.js)

**Fichier** : `ConfluentTranslator/contextAnalyzer.js`

### Modifications à faire :

#### A. Modifier searchWord() pour utiliser le champ `racine_fr`

**Principe** : Chercher les entrées dont le champ `racine_fr` est **contenu au début** du mot recherché.

**Emplacement** : ligne ~124 dans la fonction `searchWord()`

**Modifier la logique de matching pour ajouter** :
```javascript
    // NOUVEAU: Correspondance sur racine française déclarée
    // Si l'entrée a un champ racine_fr et que le mot commence par cette racine
    else if (entry.racine_fr && word.startsWith(entry.racine_fr.toLowerCase())) {
      score = 0.75;
    }
```

**Insertion dans la cascade de matching** (après synonymes lemmatisés, avant le return) :
```javascript
    // Correspondance exacte sur le mot français
    if (key === word || entry.mot_francais?.toLowerCase() === word) {
      score = 1.0;
    }
    // Correspondance sur formes lemmatisées
    else if (lemmas.some(lemma => key === lemma || entry.mot_francais?.toLowerCase() === lemma)) {
      score = 0.95;
    }
    // Correspondance sur synonymes
    else if (entry.synonymes_fr?.some(syn => syn.toLowerCase() === word)) {
      score = 0.9;
    }
    // Correspondance sur synonymes lemmatisés
    else if (entry.synonymes_fr?.some(syn => lemmas.includes(syn.toLowerCase()))) {
      score = 0.85;
    }
    // NOUVEAU: Correspondance sur racine française déclarée
    else if (entry.racine_fr && word.startsWith(entry.racine_fr.toLowerCase())) {
      score = 0.75;
    }
```

**Code final de searchWord()** :
```javascript
function searchWord(word, dictionnaire) {
  const results = [];
  const lemmas = simpleLemmatize(word);

  for (const [key, entry] of Object.entries(dictionnaire)) {
    let score = 0;

    // Correspondance exacte sur le mot français
    if (key === word || entry.mot_francais?.toLowerCase() === word) {
      score = 1.0;
    }
    // Correspondance sur formes lemmatisées
    else if (lemmas.some(lemma => key === lemma || entry.mot_francais?.toLowerCase() === lemma)) {
      score = 0.95;
    }
    // Correspondance sur synonymes
    else if (entry.synonymes_fr?.some(syn => syn.toLowerCase() === word)) {
      score = 0.9;
    }
    // Correspondance sur synonymes lemmatisés
    else if (entry.synonymes_fr?.some(syn => lemmas.includes(syn.toLowerCase()))) {
      score = 0.85;
    }
    // NOUVEAU: Correspondance sur racine française déclarée dans le lexique
    else if (entry.racine_fr && word.startsWith(entry.racine_fr.toLowerCase())) {
      score = 0.75;
    }

    if (score > 0) {
      results.push({
        mot_francais: entry.mot_francais || key,
        traductions: entry.traductions || [],
        score,
        source: entry.source_files || []
      });
    }
  }

  return results;
}
```

**Note** : Pas besoin d'exporter de nouvelle fonction, on utilise simplement le champ `racine_fr` du lexique.

---

## TRAVAIL 2 : Compléter le lexique avec racines et synonymes

**Objectif** : Pour chaque verbe du lexique, ajouter :
1. Le champ `racine_fr` avec le dénominateur commun optimal
2. Les formes conjuguées irrégulières dans `synonymes_fr`

### Fichiers à modifier :

`ancien-confluent/lexique/06-actions.json`

### Structure à suivre pour chaque verbe

```json
"[verbe_infinitif]": {
  "racine_fr": "[racine_optimale]",
  "traductions": [...],
  "synonymes_fr": ["[formes_irrégulières]", "[autres_synonymes]"]
}
```

### Verbes à compléter (par priorité)

#### Priorité 1 : Verbes très courants

**1. voir**
```json
"voir": {
  "racine_fr": "voi",
  "traductions": [...],
  "synonymes_fr": ["observer", "regarder", "vu", "vus", "vue", "vues"]
}
```
*Note : "voit", "voyait", "voyons", "verra" sont couverts par la racine "voi". Seules les formes avec radical différent (vu/vue) vont dans synonymes_fr.*

**2. prendre**
```json
"prendre": {
  "racine_fr": "pren",
  "traductions": [...],
  "synonymes_fr": ["pris", "prit", "prise", "prises"]
}
```
*Note : "prend", "prenait", "prendra" sont couverts par la racine "pren".*

**3. faire**
```json
"faire": {
  "racine_fr": "fai",
  "traductions": [...],
  "synonymes_fr": ["créer", "fait", "faits", "faite", "faites"]
}
```
*Note : "fais", "faisait", "faisons" sont couverts par la racine "fai".*

**4. manger** (nouveau verbe si pas déjà présent)
```json
"manger": {
  "racine_fr": "mang",
  "traductions": [...],
  "synonymes_fr": []
}
```
*Note : Toutes les formes (mange, mangé, mangeait, mangera) sont couvertes par la racine "mang". Pas besoin de synonymes.*

**5. aller**
```json
"aller": {
  "racine_fr": "all",
  "traductions": [...],
  "synonymes_fr": ["va", "vas", "vais", "ira", "iras", "iront"]
}
```
*Note : "allé", "allait" sont couverts par "all". Les formes irrégulières (va/vais, ira) vont dans synonymes_fr.*

**6. donner**
```json
"donner": {
  "racine_fr": "donn",
  "traductions": [...],
  "synonymes_fr": []
}
```
*Note : Toutes les formes sont couvertes par "donn".*

**7. dire**
```json
"dire": {
  "racine_fr": "di",
  "traductions": [...],
  "synonymes_fr": ["parler", "dit", "dits", "dite", "dites"]
}
```
*Note : "dis", "disait", "dira" sont couverts par "di". "dit/dite" ont un radical différent donc dans synonymes_fr.*

#### Priorité 2 : Verbes auxiliaires (très irréguliers)

**8. être**
```json
"être": {
  "racine_fr": null,
  "traductions": [...],
  "synonymes_fr": ["est", "es", "suis", "sont", "sommes", "êtes", "été", "était", "étais", "étant", "sera", "seras", "seront", "fut", "fus"]
}
```
*Note : Aucune racine commune possible. Toutes les formes dans synonymes_fr.*

**9. avoir**
```json
"avoir": {
  "racine_fr": "av",
  "traductions": [...],
  "synonymes_fr": ["a", "as", "ai", "ont", "eu", "eue", "eus", "eues", "aura", "auras", "auront"]
}
```
*Note : "avait", "avais", "avons", "avez" couverts par "av". Formes irrégulières (a/ai/ont, eu, aura) dans synonymes_fr.*

#### Priorité 3 : Autres verbes courants

**10. savoir**
```json
"savoir": {
  "racine_fr": "sav",
  "traductions": [...],
  "synonymes_fr": ["connaître", "sait", "sais", "su", "sue", "sus", "sues", "saura", "sauront"]
}
```
*Note : "savait", "savons", "sachant" couverts par "sav". Formes irrégulières (sait/sais, su, saura) dans synonymes_fr.*

**11. chasser**
```json
"chasser": {
  "racine_fr": "chass",
  "traductions": [...],
  "synonymes_fr": ["traquer"]
}
```
*Note : Toutes les conjugaisons couvertes par "chass".*

**12. transmettre**
```json
"transmettre": {
  "racine_fr": "transm",
  "traductions": [...],
  "synonymes_fr": ["enseigner", "transmis", "transmise", "transmises"]
}
```
*Note : "transmet", "transmettait", "transmettra" couverts par "transm". Participe passé (transmis) dans synonymes_fr.*

**13. garder**
```json
"garder": {
  "racine_fr": "gard",
  "traductions": [...],
  "synonymes_fr": ["protéger"]
}
```
*Note : Toutes les conjugaisons couvertes par "gard".*

**14. porter**
```json
"porter": {
  "racine_fr": "port",
  "traductions": [...],
  "synonymes_fr": ["transporter"]
}
```
*Note : Toutes les conjugaisons couvertes par "port".*

**15. apprendre**
```json
"apprendre": {
  "racine_fr": "appren",
  "traductions": [...],
  "synonymes_fr": ["appris", "apprise", "apprises"]
}
```
*Note : "apprend", "apprenait", "apprendra" couverts par "appren". Participe passé (appris) dans synonymes_fr.*

---

## Tests à faire après modifications

### Test 1 : Vérifier les racines automatiques

```bash
curl -X POST http://localhost:3000/api/debug/prompt \
  -H "Content-Type: application/json" \
  -d '{"text": "Il mangeait le pain", "target": "ancien"}' | grep -A 5 "wordsFound"
```

**Résultat attendu** : "mangeait" → trouve "mukis" via racine "mang"

### Test 2 : Vérifier les exceptions manuelles

```bash
curl -X POST http://localhost:3000/api/debug/prompt \
  -H "Content-Type: application/json" \
  -d '{"text": "Il a vu et pris", "target": "ancien"}' | grep -A 10 "wordsFound"
```

**Résultat attendu** :
- "vu" → trouve "mirak" via synonymes_fr
- "pris" → trouve "pasak" via synonymes_fr

### Test 3 : Phrase complète

```bash
# Même test que le problématique
curl -X POST http://localhost:3000/api/debug/prompt \
  -H "Content-Type: application/json" \
  -d '{"text": "C est le collier du loup qui a mange mon frere", "target": "ancien"}' | python -c "import sys, json; data=json.load(sys.stdin); print('Found:', [w['input'] for w in data['metadata']['wordsFound']])"
```

**Résultat attendu** : ["collier", "loup", "mange", "frere"] tous trouvés

---

## Estimation de travail

- **Code (contextAnalyzer.js)** : ~5 lignes à ajouter (une seule condition else if), 5 minutes
- **Lexique (06-actions.json)** :
  - Ajouter champ `racine_fr` pour 15 verbes : ~15 minutes
  - Ajouter formes irrégulières dans `synonymes_fr` : ~30 formes uniques, ~20 minutes

**Total** : ~40 minutes de travail

**Révision par rapport à l'estimation initiale** : Beaucoup plus simple car on ne fait pas d'extraction automatique, juste du matching sur un champ déclaré.

---

## Notes importantes

1. **Lowercase** : Tout est déjà en lowercase dans tokenizeFrench(), pas besoin de le refaire dans le matching
2. **Normalisation des accents** : Déjà fait en amont (mangé → mange dans la tokenization)
3. **Ordre de priorité matching** :
   - 1.0 = Exacte
   - 0.95 = Lemma
   - 0.9 = Synonyme exact
   - 0.85 = Synonyme lemmatisé
   - **0.75 = Racine française déclarée** (NOUVEAU)
4. **Choix de la racine** :
   - Doit être le **dénominateur commun le plus long** qui couvre la majorité des conjugaisons
   - Exemples : "mang" (4 lettres), "compar" (6 lettres), "transm" (6 lettres)
   - Pas de règle fixe sur la longueur : décision au cas par cas
5. **Multiples matches** :
   - Si plusieurs entrées matchent (ex: "comp" et "compr"), TOUTES sont retournées au LLM
   - Le LLM choisit selon le contexte de la phrase
   - Pas de filtrage automatique

---

## Résumé du système final

### Workflow de matching pour un mot tapé par l'utilisateur

1. L'utilisateur tape "comparé"
2. Le système tokenize et met en lowercase → "compare" (accent normalisé)
3. Le système cherche dans le lexique avec cette cascade :
   - **Score 1.0** : Match exact sur clé ou `mot_francais` → ❌
   - **Score 0.95** : Match sur lemme → ❌
   - **Score 0.9** : Match exact dans `synonymes_fr` → ❌
   - **Score 0.85** : Match lemme dans `synonymes_fr` → ❌
   - **Score 0.75** : `"compare".startsWith(entry.racine_fr)` → ✅ trouve "compar" dans l'entrée "comparer"
4. Le système retourne l'entrée "comparer" avec score 0.75
5. Le LLM utilise la traduction confluente

### Avantages de cette approche

- ✅ **Contrôle total** : chaque racine est choisie manuellement pour être optimale
- ✅ **Ambiguïté gérée** : multiples matches possibles, le LLM arbitre
- ✅ **Performance** : pas de calcul complexe, juste du `startsWith()`
- ✅ **Maintenance** : facile d'ajuster une racine si elle ne convient pas
- ✅ **Hybride intelligent** : racines pour les formes régulières, synonymes pour les irrégulières
