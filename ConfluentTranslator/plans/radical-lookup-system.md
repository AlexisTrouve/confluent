# Plan : Système de recherche par radicaux et décomposition morphologique

## Problème actuel

Le traducteur Confluent→Français ne trouve pas les mots conjugués ou composés non documentés explicitement dans le lexique.

### Exemple concret
- **Texte :** `vokan` (forme conjuguée de "voki" = voix)
- **Lexique contient :** `"confluent": "voki"`, `"forme_liee": "vok"`
- **Résultat actuel :** ❌ NOT FOUND
- **Résultat attendu :** ✓ Trouve "voki" via le radical "vok"

### Statistiques du dernier test
- **Coverage actuel :** 83% (101/122 mots)
- **Mots non trouvés :** 21
  - **11** ont des racines existantes mais formes conjuguées manquantes
  - **5** sont totalement absents du lexique
  - **5** pourraient être des particules grammaticales

## Objectif

Augmenter le coverage de 83% à ~95% en implémentant :
1. **Recherche par radicaux** pour les verbes conjugués
2. **Décomposition morphologique** pour les compositions non documentées
3. **Index par forme_liee** en plus de l'index par mot complet

---

## Phase 1 : Analyse et mapping des patterns

### 1.1 Patterns de conjugaison verbale

**Suffixes verbaux identifiés :**
```javascript
const VERBAL_SUFFIXES = [
  'ak',    // forme standard : mirak (voir), pasak (prendre), urak (être)
  'an',    // conjugaison : takan (porter), vokan (parler?)
  'un',    // conjugaison : kisun (transmettre), pasun (prendre?)
  'is',    // conjugaison : vokis (parler?)
  'am',    // conjugaison : sukam (forger)
  'im',    // conjugaison : verim (vérifier?)
  'ok',    // impératif : marqueur temporel
  'ul',    // passé? : marqueur temporel
  'iran',  // dérivé nominal : kisiran (enseignement/transmission?)
];
```

**Racines de test connues :**
- `vok` → `voki` (voix) : formes attendues `vokan`, `vokis`
- `kis` → `kisu` (transmettre) : formes attendues `kisun`, `kisiran`
- `pas` → `pasa` (prendre) : formes attendues `pasak`, `pasun`
- `tak` → `taka` (porter) : formes attendues `takan`, `taku`

### 1.2 Patterns de liaisons sacrées

**16 liaisons à gérer :**
```javascript
const SACRED_LIAISONS = {
  // Agentivité
  'i': 'agent',
  'ie': 'agent_processus',
  'ii': 'agent_répété',
  'iu': 'agent_possédant',

  // Appartenance
  'u': 'appartenance',
  'ui': 'possession_agentive',

  // Relation
  'a': 'relation',
  'aa': 'relation_forte',
  'ae': 'relation_dimensionnelle',
  'ao': 'relation_tendue',

  // Tension
  'o': 'tension',
  'oa': 'tension_relationnelle',

  // Dimension
  'e': 'dimension',
  'ei': 'dimension_agentive',
  'ea': 'dimension_relationnelle',
  'eo': 'dimension_tendue'
};
```

### 1.3 Structure morphologique du Confluent

**Règle générale :** Racine + Liaison + Racine
```
sekavoki = sek + a + voki
         = conseil + relation + voix
         = "conseil de la voix"
```

**Pattern de composition :**
```regex
^([a-z]{2,4})(i|ie|ii|iu|u|ui|a|aa|ae|ao|o|oa|e|ei|ea|eo)([a-z]{2,4})$
```

---

## Phase 2 : Implémentation

### 2.1 Nouveau fichier : `radicalMatcher.js`

**Fonction principale :**
```javascript
/**
 * Extrait tous les radicaux possibles d'un mot
 * @param {string} word - Mot en confluent
 * @returns {Array<{radical: string, suffix: string, confidence: number}>}
 */
function extractRadicals(word) {
  const candidates = [];

  // Essayer chaque suffixe verbal connu
  for (const suffix of VERBAL_SUFFIXES) {
    if (word.endsWith(suffix) && word.length > suffix.length + 1) {
      const radical = word.slice(0, -suffix.length);
      candidates.push({
        radical,
        suffix,
        type: 'verbal',
        confidence: 0.9
      });
    }
  }

  // Essayer sans suffixe (forme racine directe)
  if (word.length >= 3) {
    candidates.push({
      radical: word,
      suffix: '',
      type: 'root',
      confidence: 0.7
    });
  }

  // Essayer d'enlever dernière voyelle (forme liée -> forme pleine)
  // mako → mak, voki → vok
  if (word.length >= 4 && 'aeiou'.includes(word[word.length - 1])) {
    candidates.push({
      radical: word.slice(0, -1),
      suffix: word[word.length - 1],
      type: 'liaison',
      confidence: 0.8
    });
  }

  return candidates.sort((a, b) => b.confidence - a.confidence);
}
```

### 2.2 Nouveau fichier : `morphologicalDecomposer.js`

**Fonction de décomposition :**
```javascript
/**
 * Décompose un mot composé non trouvé
 * @param {string} word - Mot composé
 * @returns {Array<{part1: string, liaison: string, part2: string}>}
 */
function decomposeWord(word) {
  const decompositions = [];

  for (const [liaison, meaning] of Object.entries(SACRED_LIAISONS)) {
    const index = word.indexOf(liaison);

    if (index > 0 && index < word.length - liaison.length) {
      const part1 = word.substring(0, index);
      const part2 = word.substring(index + liaison.length);

      // Valider que les deux parties ressemblent à des racines
      if (part1.length >= 2 && part2.length >= 2) {
        decompositions.push({
          part1,
          liaison,
          liaisonMeaning: meaning,
          part2,
          pattern: `${part1}-${liaison}-${part2}`,
          confidence: calculateConfidence(part1, liaison, part2)
        });
      }
    }
  }

  return decompositions.sort((a, b) => b.confidence - a.confidence);
}

function calculateConfidence(part1, liaison, part2) {
  let score = 0.5; // base

  // Bonus si les parties finissent/commencent par des consonnes
  if (!'aeiou'.includes(part1[part1.length - 1])) score += 0.1;
  if (!'aeiou'.includes(part2[0])) score += 0.1;

  // Bonus si liaison courante (i, u, a sont plus fréquentes)
  if (['i', 'u', 'a'].includes(liaison)) score += 0.2;

  // Bonus si longueurs de parties équilibrées
  const ratio = Math.min(part1.length, part2.length) / Math.max(part1.length, part2.length);
  score += ratio * 0.2;

  return Math.min(score, 1.0);
}
```

### 2.3 Modification : `reverseIndexBuilder.js`

**Ajouter index par forme_liee :**
```javascript
function buildConfluentIndex(lexique) {
  const index = {
    byWord: {},      // Index existant
    byRoot: {},      // NOUVEAU : index par radical
    byFormeLiee: {}  // NOUVEAU : index par forme_liee
  };

  // ... code existant pour byWord ...

  // NOUVEAU : Indexer par forme_liee
  for (const entry of allEntries) {
    const formeLiee = entry.forme_liee || entry.racine;
    if (formeLiee) {
      if (!index.byFormeLiee[formeLiee]) {
        index.byFormeLiee[formeLiee] = [];
      }
      index.byFormeLiee[formeLiee].push({
        ...entry,
        matchType: 'forme_liee'
      });
    }
  }

  return index;
}
```

### 2.4 Modification : `confluentToFrench.js`

**Nouvelle logique de recherche en cascade :**
```javascript
function findWordWithRadicals(word, confluentIndex) {
  // 1. Recherche exacte (existant)
  if (confluentIndex.byWord[word]) {
    return {
      ...confluentIndex.byWord[word][0],
      matchType: 'exact',
      confidence: 1.0
    };
  }

  // 2. NOUVEAU : Recherche par radicaux verbaux
  const radicals = extractRadicals(word);
  for (const {radical, suffix, type, confidence} of radicals) {
    // Chercher dans l'index par forme_liee
    if (confluentIndex.byFormeLiee[radical]) {
      return {
        ...confluentIndex.byFormeLiee[radical][0],
        matchType: 'radical',
        originalWord: word,
        radical,
        suffix,
        suffixType: type,
        confidence
      };
    }
  }

  // 3. NOUVEAU : Décomposition morphologique
  const decompositions = decomposeWord(word);
  for (const decomp of decompositions) {
    const part1Match = findWordWithRadicals(decomp.part1, confluentIndex);
    const part2Match = findWordWithRadicals(decomp.part2, confluentIndex);

    if (part1Match && part2Match) {
      return {
        matchType: 'composition_inferred',
        originalWord: word,
        composition: `${decomp.part1}-${decomp.liaison}-${decomp.part2}`,
        parts: {
          part1: part1Match,
          liaison: decomp.liaison,
          liaisonMeaning: decomp.liaisonMeaning,
          part2: part2Match
        },
        confidence: decomp.confidence * 0.7 // Pénalité pour inférence
      };
    }
  }

  // 4. Vraiment inconnu
  return null;
}
```

---

## Phase 3 : Tests et validation

### 3.1 Cas de test prioritaires

**Verbes conjugués :**
```javascript
const testCases = [
  { word: 'vokan', expectedRoot: 'vok', expectedMeaning: 'voix' },
  { word: 'vokis', expectedRoot: 'vok', expectedMeaning: 'voix' },
  { word: 'kisiran', expectedRoot: 'kis', expectedMeaning: 'transmettre' },
  { word: 'pasun', expectedRoot: 'pas', expectedMeaning: 'prendre' },
  { word: 'taku', expectedRoot: 'tak', expectedMeaning: 'porter' },
];
```

**Compositions inférées :**
```javascript
const compositionTests = [
  {
    word: 'sukamori',
    expected: { part1: 'suk', liaison: 'a', part2: 'mori' },
    // Si 'mori' existe dans le lexique
  },
  {
    word: 'uraal',
    expected: { part1: 'ur', liaison: 'aa', part2: 'al' }
  }
];
```

### 3.2 Métriques de succès

**Objectif :** Passer de 83% à 95% de coverage

**Métriques à suivre :**
- Coverage total (% de mots trouvés)
- Précision (% de correspondances correctes)
- Type de match (exact / radical / composition)
- Niveau de confiance moyen

---

## Phase 4 : Fichiers à créer/modifier

### Fichiers à CRÉER :
1. `ConfluentTranslator/radicalMatcher.js`
2. `ConfluentTranslator/morphologicalDecomposer.js`
3. `ConfluentTranslator/tests/radicalMatching.test.js`

### Fichiers à MODIFIER :
1. `ConfluentTranslator/reverseIndexBuilder.js`
   - Ajouter index `byFormeLiee`
   - Ajouter index `byRoot`

2. `ConfluentTranslator/confluentToFrench.js`
   - Importer `radicalMatcher` et `morphologicalDecomposer`
   - Modifier `translateToken()` pour utiliser recherche en cascade
   - Ajouter champs de métadonnées (matchType, confidence, etc.)

3. `ConfluentTranslator/server.js`
   - Aucune modification nécessaire (compatibilité backwards)

---

## Phase 5 : Améliorations futures

### 5.1 Machine Learning léger
- Apprendre les patterns de suffixes depuis le corpus
- Scorer automatiquement la confiance des décompositions

### 5.2 Support des nombres
- Charger `22-nombres.json` dans le lexique
- Gérer les nombres composés (ex: "diku tolu iko" = 25)

### 5.3 Particules grammaticales
- Documenter `ve`, `eol`, et autres particules manquantes
- Créer un fichier `particules.json`

### 5.4 Interface de validation
- UI pour valider/corriger les correspondances inférées
- Export des nouvelles correspondances pour enrichir le lexique

---

## Ordre d'implémentation recommandé

1. ✅ Créer `radicalMatcher.js` avec fonction `extractRadicals()`
2. ✅ Modifier `reverseIndexBuilder.js` pour ajouter `byFormeLiee`
3. ✅ Modifier `confluentToFrench.js` pour recherche par radical
4. ✅ Tester avec les 11 cas de verbes conjugués
5. ✅ Créer `morphologicalDecomposer.js` avec fonction `decomposeWord()`
6. ✅ Intégrer décomposition dans `confluentToFrench.js`
7. ✅ Tester avec les compositions inférées
8. ✅ Ajouter support des nombres (`22-nombres.json`)
9. 🔄 Valider sur le texte complet (objectif: 95% coverage)

---

## Impact attendu

### Sur le texte de test (122 tokens)
**Avant :**
- Coverage: 83% (101/122)
- Inconnus: 21

**Après (estimation) :**
- Coverage: ~95% (116/122)
- Inconnus: ~6
- Avec confiance: ~110/122
- Inférés: ~6/122

### Bénéfices
- ✅ Meilleure compréhension des textes réels
- ✅ Découverte automatique de nouvelles formes
- ✅ Base pour enrichissement du lexique
- ✅ System plus robuste et adaptatif
