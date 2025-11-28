# Plan d'Implémentation : Prompt Contextuel Intelligent

## Situation Actuelle

**Problème** : Le système injecte tout le lexique (516 entrées ancien + 164 proto) dans le prompt système, ce qui :
- Consomme énormément de tokens
- Coûte cher
- Est inefficace (99% du lexique est inutile pour une phrase donnée)

**État actuel** :
- `buildEnhancedPrompt()` génère un résumé limité à 300 entrées
- Mais c'est toujours massif et non-pertinent

## Solution : Prompt Contextuel Dynamique

### Stratégie

Au lieu d'envoyer tout le lexique, on va :

1. **Analyser le texte français** → extraire les mots-clés
2. **Chercher dans le lexique** → trouver uniquement les entrées pertinentes
3. **Générer un prompt minimal** → inclure seulement le vocabulaire nécessaire
4. **Ajouter du contexte sémantique** → inclure des termes liés (synonymes, domaines connexes)

---

## Plan d'Implémentation Détaillé

### **Phase 1 : Extraction de Contexte**

**Fichier** : `ConfluentTranslator/contextAnalyzer.js` (nouveau)

**Fonctionnalités** :
```javascript
// 1. Tokenizer simple français
function tokenizeFrench(text)
  → Extraire les mots (lowercase, sans ponctuation)

// 2. Recherche dans le lexique
function findRelevantEntries(words, lexique)
  → Chercher correspondances exactes
  → Chercher correspondances partielles (racines, lemmes)
  → Score de pertinence

// 3. Expansion sémantique
function expandContext(foundEntries, lexique)
  → Ajouter synonymes
  → Ajouter mots du même domaine
  → Limiter à N entrées max (ex: 50)
```

**Exemple** :
```
Input: "L'enfant voit l'eau"
→ Mots: ["enfant", "voit", "eau"]
→ Trouve: naki, mira, ura
→ Expand: + voir/regarder/observer, + rivière/source
→ Résultat: 8-10 entrées au lieu de 516
```

---

### **Phase 2 : Générateur de Prompt Contextuel**

**Fichier** : `ConfluentTranslator/promptBuilder.js` (nouveau)

**Fonctionnalités** :
```javascript
// 1. Template de base (rules + syntaxe)
function getBasePrompt(variant)
  → Phonologie, syntaxe, liaisons sacrées
  → SANS le lexique massif

// 2. Injection de vocabulaire ciblé
function injectRelevantVocabulary(basePrompt, entries)
  → Format compact et organisé
  → Regroupé par domaine

// 3. Génération finale
function buildContextualPrompt(text, variant, lexique)
  → Analyse contexte
  → Génère prompt minimal
```

**Structure du prompt** :
```
[RÈGLES DE BASE - fixe, ~200 tokens]

# VOCABULAIRE PERTINENT POUR CETTE TRADUCTION

## Racines nécessaires
- naki (enfant) [racine standard]
- mira (voir) [verbe]
- ura (eau) [racine sacrée]

## Termes liés
- aska (libre) [souvent utilisé avec]
- sili (regard) [domaine: vision]

[EXEMPLES - fixe, ~100 tokens]
```

---

### **Phase 3 : Intégration dans l'API**

**Fichier** : `ConfluentTranslator/server.js` (modifier)

**Modifications** :

```javascript
// Importer nouveaux modules
const { analyzeContext } = require('./contextAnalyzer');
const { buildContextualPrompt } = require('./promptBuilder');

// Modifier /translate endpoint
app.post('/translate', async (req, res) => {
  const { text, target, provider, model, useLexique = true } = req.body;

  const variant = target === 'proto' ? 'proto' : 'ancien';

  // NOUVEAU : Génération contextuelle
  const systemPrompt = useLexique
    ? buildContextualPrompt(text, variant, lexiques[variant])
    : getBasePrompt(variant);

  // Le reste identique...
});
```

---

### **Phase 4 : Optimisations Avancées**

**Cache intelligent** :
```javascript
// ConfluentTranslator/promptCache.js
class PromptCache {
  // Cache les prompts générés par hash du texte
  // Évite de régénérer pour phrases similaires
}
```

**Scoring sémantique** :
```javascript
// Utiliser word embeddings ou TF-IDF
// Pour trouver termes vraiment pertinents
function semanticScore(word, lexiqueEntry) {
  // Retourne 0-1
}
```

---

## Bénéfices Attendus

| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| Tokens prompt | ~5000 | ~800 | **84%** |
| Coût par requête | $0.005 | $0.001 | **80%** |
| Pertinence | Faible | Élevée | ++ |
| Latence | Moyenne | Basse | + |

---

## Ordre d'Implémentation VALIDÉ

### Phase 1 : Backend (Contexte & Prompt)
1. ✅ **Créer `contextAnalyzer.js`**
   - Tokenizer français
   - Recherche avec scoring
   - Calcul dynamique max entrées (selon longueur)
   - Expansion niveau 1 (modulaire pour futur)
   - Fallback racines

2. ✅ **Créer `promptBuilder.js`**
   - Templates de base (sans lexique massif)
   - Injection vocabulaire ciblé
   - Génération fallback racines
   - Formatage optimisé

3. ✅ **Modifier `server.js`**
   - Intégrer contextAnalyzer
   - Intégrer promptBuilder
   - Générer métadonnées Layer 2
   - Parser réponse LLM pour Layer 3
   - Retourner structure 3 layers

### Phase 2 : Frontend (UI 3 Layers)
4. ✅ **Refonte UI - Structure HTML**
   - Container Layer 1 (toujours visible)
   - Container Layer 2 (collapsible)
   - Container Layer 3 (collapsible)

5. ✅ **JavaScript - Logique d'affichage**
   - Toggle expand/collapse
   - Affichage formaté des métadonnées
   - Calcul tokens économisés

6. ✅ **CSS - Design responsive**
   - Style des 3 layers
   - Animations collapse/expand
   - Indicateurs visuels

### Phase 3 : Tests & Validation
7. ✅ **Tests unitaires**
   - Tokenizer
   - Scoring
   - Calcul dynamique limites

8. ✅ **Tests d'intégration**
   - Cas simples, complexes, longs
   - Fallback
   - Qualité traduction

### Phase 4 : Optimisations (Optionnel - V2)
9. ⚪ **Cache intelligent** (si besoin de perf)
10. ⚪ **Metrics & Analytics** (tracking usage)
11. ⚪ **Expansion niveau 2+** (pour Confluent classique)

---

## Configuration VALIDÉE

### Paramètres de base
- **Max entrées par requête** : **VARIABLE selon longueur du texte**
  - Phrases courtes (< 20 mots) : ~30 entrées
  - Phrases moyennes (20-50 mots) : ~50 entrées
  - Textes longs (> 50 mots) : jusqu'à 100 entrées

- **Expansion sémantique** : **Niveau 1 (strict) - MODULAIRE**
  - Pour Proto-Confluent et Ancien Confluent : synonymes directs uniquement
  - Architecture préparée pour expansion future (Confluent classique avec niveau 2-3)

- **Fallback** : **Envoyer TOUTES LES RACINES + instruction de composition**
  - Si aucun terme trouvé dans le lexique
  - Inclure toutes les racines sacrées + racines standards
  - Instruction au LLM : "Composer à partir des racines disponibles"

### Priorités de recherche
1. Correspondance exacte (score: 1.0)
2. Synonymes français directs (score: 0.9)
3. **[FUTUR - Niveau 2+]** Même domaine sémantique (score: 0.7)
4. **[FUTUR - Niveau 2+]** Racine partagée (score: 0.5)
5. **[FUTUR]** Termes fréquents génériques (score: 0.3)

---

## Architecture UI : 3 Layers VALIDÉE

L'interface affichera la traduction en **3 couches progressives** :

### **LAYER 1 : TRADUCTION (Toujours visible)**
Résultat principal, directement affiché.

```
┌─────────────────────────────────────────┐
│ TRADUCTION                              │
│ ─────────────────────────────────────── │
│ va naki vo ura miraku                   │
└─────────────────────────────────────────┘
```

### **LAYER 2 : CONTEXTE (Expandable - COT hors LLM)**
Contexte extrait AVANT l'appel au LLM.

```
┌─────────────────────────────────────────┐
│ 📚 CONTEXTE LEXICAL (Cliquer pour voir) │
│ ─────────────────────────────────────── │
│ Mots trouvés dans le lexique:           │
│   • enfant → naki (racine standard)     │
│   • voir → mira (verbe)                 │
│   • eau → ura (racine sacrée)           │
│                                         │
│ 📊 Optimisation:                        │
│   • Tokens économisés: 4200 (-84%)     │
│   • Entrées utilisées: 8/516           │
│   • Entrées envoyées au LLM: 8         │
└─────────────────────────────────────────┘
```

### **LAYER 3 : COMMENTAIRES LLM (Expandable)**
Explications générées par le LLM.

```
┌─────────────────────────────────────────┐
│ 💡 EXPLICATIONS (Cliquer pour voir)     │
│ ─────────────────────────────────────── │
│ 🔧 Décomposition:                       │
│   va naki = SUJET enfant                │
│   vo ura = OBJET eau                    │
│   miraku = voir (présent -u)            │
│                                         │
│ 🛠️ Mots créés/composés:                 │
│   (aucun pour cette phrase)             │
│                                         │
│ 📝 Notes linguistiques:                 │
│   Ordre SOV respecté, particules        │
│   correctes, conjugaison présent.       │
└─────────────────────────────────────────┘
```

### Logique d'affichage
- **Layer 1** : Toujours affiché, focus principal
- **Layer 2** : Collapsed par défaut, clic pour expand
- **Layer 3** : Collapsed par défaut, clic pour expand
- Les layers sont **indépendants** (on peut ouvrir 2, 3, les deux, ou aucun)

---

## Cas d'Usage Typiques

### Cas 1 : Phrase simple (< 20 mots)
**Input** : "L'enfant voit l'eau"
**Longueur** : 4 mots → Limite: 30 entrées
**Contexte extrait** : enfant (naki), voir (mira), eau (ura)
**Expansion** : voir/regarder (synonymes directs uniquement - niveau 1)
**Total** : ~8 entrées envoyées

### Cas 2 : Phrase complexe avec castes (20-50 mots)
**Input** : "Les Enfants des Échos transmettent la mémoire sacrée aux jeunes générations dans les halls des serments"
**Longueur** : 16 mots → Limite: 50 entrées
**Contexte extrait** : Nakukeko, transmettre (kisu), mémoire (mori), sacré (asa), jeune, génération, halls (Talusavu)
**Expansion** : écho (keko), enfant (naki), synonymes directs
**Total** : ~20 entrées envoyées

### Cas 3 : Texte narratif long (> 50 mots)
**Input** : Paragraphe de 100+ mots
**Longueur** : 100 mots → Limite: 100 entrées
**Stratégie** :
- Extraire tous les mots-clés uniques
- Chercher correspondances exactes + synonymes directs
- Limiter à top 100 termes par pertinence (score)
**Total** : 100 entrées max

### Cas 4 : Mot inconnu (Fallback)
**Input** : "Le scientifique utilise un microscope"
**Longueur** : 5 mots → Limite: 30 entrées
**Contexte trouvé** : (aucun - mots modernes non dans le lexique)
**Fallback activé** :
- Envoyer TOUTES les racines sacrées (15)
- Envoyer TOUTES les racines standards (52)
- Total: 67 racines de base
- Instruction LLM : "Compose à partir des racines disponibles"
**Total** : 67 entrées (racines uniquement)

---

## Architecture Technique (Mise à jour avec 3 Layers)

```
┌─────────────────┐
│  User Input     │
│  (français)     │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  contextAnalyzer.js                      │
│  - tokenizeFrench()                      │
│  - calculateMaxEntries(wordCount)        │  ← NOUVEAU: calcul dynamique
│  - findRelevantEntries(expansionLevel=1) │  ← Niveau modulaire
│  - expandContext() [LEVEL 1 only]       │
└────────┬─────────────────────────────────┘
         │
         │ [context metadata for Layer 2]
         │ - words found
         │ - entries used
         │ - tokens saved
         ▼
┌──────────────────────────────────────────┐
│  promptBuilder.js                        │
│  - getBasePrompt(variant)                │
│  - getRootsFallback() [if needed]        │  ← NOUVEAU: fallback racines
│  - injectVocabulary(entries)             │
│  - buildContextualPrompt()               │
└────────┬─────────────────────────────────┘
         │
         │ [optimized prompt + metadata]
         ▼
┌──────────────────────────────────────────┐
│  server.js - /translate endpoint         │
│  - Call contextAnalyzer                  │
│  - Build prompt                          │
│  - Store Layer 2 data (COT)              │  ← NOUVEAU: métadonnées
│  - Call LLM API                          │
└────────┬─────────────────────────────────┘
         │
         │ [prompt with minimal context]
         ▼
┌──────────────────────────────────────────┐
│  LLM API (Claude/GPT)                    │
│  - Receive optimized prompt              │
│  - Generate translation                  │
│  - Generate explanations                 │
└────────┬─────────────────────────────────┘
         │
         │ [LLM response]
         ▼
┌──────────────────────────────────────────┐
│  Response Parser                         │
│  - Extract translation (Layer 1)         │
│  - Extract explanations (Layer 3)        │
│  - Combine with context metadata (L2)    │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  JSON Response to Frontend               │
│  {                                       │
│    layer1: { translation: "..." },      │
│    layer2: {                             │
│      wordsFound: [...],                  │
│      entriesUsed: 8,                     │
│      tokensSaved: 4200                   │
│    },                                    │
│    layer3: {                             │
│      decomposition: "...",               │
│      wordsCreated: [...],                │
│      notes: "..."                        │
│    }                                     │
│  }                                       │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Frontend UI (3 Layers)                  │
│  ┌────────────────────────────────────┐  │
│  │ Layer 1: Translation (visible)     │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │ Layer 2: Context (collapsible)     │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │ Layer 3: Explanations (collapsible)│  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

---

## Tests de Validation

### Test 1 : Réduction de tokens
```javascript
// Mesurer avant/après
const before = countTokens(oldPrompt);
const after = countTokens(newPrompt);
assert(after < before * 0.2); // Réduction de 80%
```

### Test 2 : Qualité de traduction
```javascript
// Comparer qualité avec plusieurs phrases
const testCases = [
  "L'enfant voit l'eau",
  "Les Passes-bien portent les biens",
  "Le faucon chasse dans le ciel"
];
// Valider que traductions restent correctes
```

### Test 3 : Performance
```javascript
// Mesurer temps de génération de prompt
const start = Date.now();
const prompt = buildContextualPrompt(text, 'ancien', lexique);
const duration = Date.now() - start;
assert(duration < 100); // < 100ms
```

---

## Métriques de Succès

- ✅ **Réduction tokens** : > 70%
- ✅ **Qualité traduction** : identique ou meilleure
- ✅ **Temps génération prompt** : < 100ms
- ✅ **Taux de cache hit** : > 30% (si cache activé)
- ✅ **Satisfaction utilisateur** : retours positifs

---

## Prochaines Itérations (V2, V3...)

### V2 : Intelligence contextuelle
- Apprentissage des patterns fréquents
- Suggestions de vocabulaire manquant
- Détection automatique de nouveaux termes à ajouter au lexique

### V3 : Optimisations ML
- Embeddings sémantiques pour meilleure expansion
- Prédiction de termes nécessaires avant recherche
- Compression intelligente du prompt

### V4 : Multi-langue
- Support Proto-Confluent ↔ Ancien Confluent
- Traduction bidirectionnelle Confluent → Français
- Détection automatique de variante
