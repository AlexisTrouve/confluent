# Travail : Système de Racines Françaises

## Objectif

Améliorer le matching des mots français conjugués/accordés en utilisant un système de **racines françaises** au lieu de se fier uniquement à la lemmatisation automatique.

## Problème actuel

- "manger" trouve "mukis" ✅
- "mangé" ne trouve RIEN ❌
- "vu" ne trouve pas "voir" ❌
- "pris" ne trouve pas "prendre" ❌

Le lemmatizer actuel est trop basique et rate beaucoup de formes conjuguées.

## Solution : Double approche

### 1. Système de racines automatique (pour verbes réguliers)

**Principe** : Extraire les 4 premières lettres d'un mot comme "racine"

**Exemples qui marchent** :
- "manger", "mangé", "mange", "mangeait" → racine **"mang"** → trouve "mukis" ✅
- "donner", "donné", "donne", "donnait" → racine **"donn"** → trouve "kitan" ✅
- "aller", "allé", "allait" → racine **"alle"** → trouve "tekis" ✅

**Code à ajouter** :
```javascript
/**
 * Extrait la racine française d'un mot (4 premières lettres)
 * Minimum 4 lettres pour éviter les faux positifs
 * @param {string} word - Mot français
 * @returns {string|null} - Racine ou null si mot trop court
 */
function extractFrenchRoot(word) {
  if (word.length < 4) return null;
  return word.slice(0, 4).toLowerCase();
}
```

### 2. Exceptions manuelles (verbes irréguliers + racines courtes)

**Principe** : Ajouter toutes les formes conjuguées dans le champ `synonymes_fr` du lexique

**Exemples qui NE marchent PAS avec racines automatiques** :

#### Racines trop courtes
- **"voir"** → racine "voir" (4 lettres OK) MAIS "vu", "vus" → racine "vu" (2 lettres ❌)
- **"être"** → racine impossible (formes trop différentes)
- **"avoir"** → racine impossible (formes trop différentes)

#### Verbes irréguliers
- **"prendre"** → racine "pren" mais "pris", "prit" ont racine "pris" ❌
- **"faire"** → racine "fair" mais "fait", "faite" ont racine "fait" ❌

**Solution** : Ajouter manuellement dans `synonymes_fr`

---

## TRAVAIL 1 : Modification du code (contextAnalyzer.js)

**Fichier** : `ConfluentTranslator/contextAnalyzer.js`

### Modifications à faire :

#### A. Ajouter la fonction extractFrenchRoot()

```javascript
/**
 * Extrait la racine française d'un mot (4 premières lettres minimum)
 * Pour matcher des conjugaisons : manger/mangé/mange → "mang"
 * @param {string} word - Mot français (déjà en lowercase)
 * @returns {string|null} - Racine de 4 lettres ou null si trop court
 */
function extractFrenchRoot(word) {
  if (word.length < 4) return null;
  return word.slice(0, 4);
}
```

#### B. Modifier searchWord() pour utiliser les racines

**Emplacement** : ligne ~124

**Ajouter après la ligne 126** :
```javascript
const results = [];
const lemmas = simpleLemmatize(word);
const root = extractFrenchRoot(word); // NOUVEAU
```

**Ajouter après la ligne 146 (après matching sur synonymes lemmatisés)** :
```javascript
    // NOUVEAU: Correspondance sur racine française (4 lettres)
    else if (root && key.toLowerCase().startsWith(root)) {
      score = 0.75;
    }
    // NOUVEAU: Correspondance sur racine dans synonymes
    else if (root && entry.synonymes_fr?.some(syn => syn.toLowerCase().startsWith(root))) {
      score = 0.70;
    }
```

**Code final de searchWord()** :
```javascript
function searchWord(word, dictionnaire) {
  const results = [];
  const lemmas = simpleLemmatize(word);
  const root = extractFrenchRoot(word); // NOUVEAU

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
    // NOUVEAU: Correspondance sur racine française (4 lettres)
    else if (root && key.toLowerCase().startsWith(root)) {
      score = 0.75;
    }
    // NOUVEAU: Correspondance sur racine dans synonymes
    else if (root && entry.synonymes_fr?.some(syn => syn.toLowerCase().startsWith(root))) {
      score = 0.70;
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

#### C. Exporter la nouvelle fonction

**Emplacement** : ligne ~387 (module.exports)

```javascript
module.exports = {
  tokenizeFrench,
  calculateMaxEntries,
  simpleLemmatize,
  extractFrenchRoot, // NOUVEAU
  searchWord,
  findRelevantEntries,
  expandContext,
  extractRoots,
  analyzeContext
};
```

---

## TRAVAIL 2 : Compléter les exceptions dans le lexique

**Objectif** : Ajouter manuellement les formes conjuguées des verbes irréguliers dans `synonymes_fr`

### Fichiers à modifier :

`ancien-confluent/lexique/06-actions.json`

### Verbes à compléter (par priorité)

#### Priorité 1 : Verbes très courants

**1. voir** (déjà présent)
```json
"voir": {
  "traductions": [...],
  "synonymes_fr": ["observer", "regarder", "voit", "vois", "vu", "vus", "vue", "vues", "voyait", "voyais", "voyant", "verra", "verras", "verront"]
}
```

**2. prendre**
```json
"prendre": {
  "traductions": [...],
  "synonymes_fr": ["pris", "prit", "prise", "prises", "prend", "prends", "prenait", "prenais", "prenant", "prendra", "prendras", "prendront"]
}
```

**3. faire**
```json
"faire": {
  "traductions": [...],
  "synonymes_fr": ["créer", "fait", "faits", "faite", "faites", "fais", "faisait", "faisais", "faisant", "fera", "feras", "feront"]
}
```

**4. manger** (nouveau verbe, déjà ajouté)
```json
"manger": {
  "traductions": [...],
  "synonymes_fr": ["mange", "manges", "mangé", "mangée", "mangés", "mangées", "mangeait", "mangeais", "mangeant", "mangera", "mangeras", "mangeront"]
}
```

**5. aller**
```json
"aller": {
  "traductions": [...],
  "synonymes_fr": ["va", "vas", "vais", "allé", "allée", "allés", "allées", "allait", "allais", "allant", "ira", "iras", "iront"]
}
```

**6. donner**
```json
"donner": {
  "traductions": [...],
  "synonymes_fr": ["donne", "donnes", "donné", "donnée", "donnés", "données", "donnait", "donnais", "donnant", "donnera", "donneras", "donneront"]
}
```

**7. dire**
```json
"dire": {
  "traductions": [...],
  "synonymes_fr": ["parler", "dit", "dits", "dite", "dites", "dis", "disait", "disais", "disant", "dira", "diras", "diront"]
}
```

#### Priorité 2 : Verbes auxiliaires (très irréguliers)

**8. être**
```json
"être": {
  "traductions": [...],
  "synonymes_fr": ["est", "es", "suis", "sont", "été", "était", "étais", "étant", "sera", "seras", "seront", "fut", "fus"]
}
```

**9. avoir**
```json
"avoir": {
  "traductions": [...],
  "synonymes_fr": ["a", "as", "ai", "ont", "eu", "eue", "eus", "eues", "avait", "avais", "ayant", "aura", "auras", "auront"]
}
```

#### Priorité 3 : Autres verbes courants

**10. savoir**
```json
"savoir": {
  "traductions": [...],
  "synonymes_fr": ["connaître", "sait", "sais", "su", "sue", "sus", "sues", "savait", "savais", "sachant", "saura", "sauras", "sauront"]
}
```

**11. chasser**
```json
"chasser": {
  "traductions": [...],
  "synonymes_fr": ["traquer", "chasse", "chasses", "chassé", "chassée", "chassés", "chassées", "chassait", "chassais", "chassant", "chassera", "chasseras", "chasseront"]
}
```

**12. transmettre**
```json
"transmettre": {
  "traductions": [...],
  "synonymes_fr": ["enseigner", "transmet", "transmets", "transmis", "transmise", "transmises", "transmettait", "transmettais", "transmettant", "transmettra", "transmettras", "transmettront"]
}
```

**13. garder**
```json
"garder": {
  "traductions": [...],
  "synonymes_fr": ["protéger", "garde", "gardes", "gardé", "gardée", "gardés", "gardées", "gardait", "gardais", "gardant", "gardera", "garderas", "garderont"]
}
```

**14. porter**
```json
"porter": {
  "traductions": [...],
  "synonymes_fr": ["transporter", "porte", "portes", "porté", "portée", "portés", "portées", "portait", "portais", "portant", "portera", "porteras", "porteront"]
}
```

**15. apprendre**
```json
"apprendre": {
  "traductions": [...],
  "synonymes_fr": ["apprend", "apprends", "appris", "apprise", "apprises", "apprenait", "apprenais", "apprenant", "apprendra", "apprendras", "apprendront"]
}
```

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

- **Code (contextAnalyzer.js)** : ~30 lignes, 15 minutes
- **Lexique (06-actions.json)** : 15 verbes × ~12 formes = ~180 formes à ajouter, 45-60 minutes

**Total** : ~1h15 de travail

---

## Notes importantes

1. **Lowercase** : Tout est déjà en lowercase dans tokenizeFrench(), pas besoin de le refaire
2. **Normalisation des accents** : Déjà fait (mangé → mange dans la tokenization)
3. **Ordre de priorité matching** :
   - 1.0 = Exacte
   - 0.95 = Lemma
   - 0.9 = Synonyme exact
   - 0.85 = Synonyme lemmatisé
   - **0.75 = Racine sur clé** (NOUVEAU)
   - **0.70 = Racine sur synonyme** (NOUVEAU)
4. **Longueur minimum racine** : 4 lettres pour éviter faux positifs ("il", "du", "un", etc.)

---

## Commandes pour lancer un agent

Si tu veux déléguer le travail lexique à un agent :

```
Lance un agent general-purpose avec cette tâche :

Complète le fichier ancien-confluent/lexique/06-actions.json en ajoutant les formes conjuguées dans synonymes_fr pour tous les verbes selon le document docs/TRAVAIL_RACINES_FRANCAISES.md section "TRAVAIL 2".

Pour chaque verbe, ajoute dans synonymes_fr :
- Présent : 3ème personne singulier/pluriel
- Passé composé : participe passé (masculin/féminin/pluriel)
- Imparfait : 3ème personne
- Participe présent
- Futur : 3ème personne

Priorité 1 (très courants) en premier, puis Priorité 2, puis Priorité 3.

Vérifie que le JSON reste valide après chaque modification.
```
