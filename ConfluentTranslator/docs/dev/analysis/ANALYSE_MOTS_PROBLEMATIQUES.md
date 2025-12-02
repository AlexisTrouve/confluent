# Analyse des mots problématiques du texte de test

Date: 2025-11-29

## Contexte

Le texte de test (122 tokens) contient 10 mots non trouvés. Analyse approfondie de chaque mot pour déterminer s'ils sont légitimes ou erronés.

---

## Mots analysés

### 1. `tiru` ✅ RÉSOLU
**Statut**: Légitime - Nombre existant
**Source**: `ancien-confluent/lexique/22-nombres.json` ligne 32
**Valeur**: 3 (trois)
**Contexte dans le texte**: `No kekutoka tiru okitori...` = "Dans antres-des-échos trois guerrier..."
**Action**: ✅ Ajouter au dictionnaire principal si absent

---

### 2. `kisiran` vs `kisaran` ⚠️ INCOHÉRENCE DÉTECTÉE

**Analyse comparative**:

| Forme | Statut | Source | Décomposition |
|-------|--------|--------|---------------|
| `kisiran` | ✅ Trouvé dans le texte (ligne 8) | Texte de test | `kis-iran` (transmettre + ?) |
| `kisaran` | ❌ Non trouvé (ligne 10) | Texte de test | `kis-aran` (transmettre + ?) |

**Verbe de base**:
- `kisun` = transmettre, enseigner (verbe CVCVC)
- Racine: `kisu`
- Forme liée: `kis`
- Source: `ancien-confluent/lexique/06-actions.json` ligne 123

**Problème**:
- Le texte contient **deux formes différentes**: `kisiran` ET `kisaran`
- Aucun des deux suffixes (`iran`, `aran`) n'est documenté dans la grammaire
- Seul `iran` apparaît dans `radicalMatcher.js` comme "dérivé nominal"

**Hypothèses**:
1. **Typo**: `kisaran` est une erreur de frappe pour `kisiran`
2. **Variantes**: Deux formes différentes intentionnelles (non documentées)
3. **Erreur de conception**: Suffixes inventés sans base linguistique

**Recommandation**: ⚠️ Vérifier avec le créateur du texte - probablement une typo

---

### 3. `uravis` ❌ NON DOCUMENTÉ

**Décomposition supposée**: `ura-vis`

**Racine `ura`**:
- ✅ Existe: Racine sacrée "eau, flux, vie"
- Source: `ancien-confluent/lexique/01-racines-sacrees.json`
- Forme liée: `ur`

**Suffixe `vis`**:
- ❌ N'existe PAS dans la grammaire officielle
- Absent de tous les conjugateurs documentés
- Aucune occurrence dans le lexique

**Contexte**: `Va vokiueka vo kala okimako uravis at`

**Hypothèses**:
1. Mot complet non documenté (pas un dérivé)
2. Composition mal formée
3. Erreur dans le texte de test

**Recommandation**: ❌ À corriger ou documenter

---

### 4. `sukamori` ❌ NON DOCUMENTÉ

**Décomposition supposée**: `suk-a-mori`

**Racine `suk`**:
- ✅ Existe: "feu, forge"
- Verbe: `sukam` = forger
- Source: `ancien-confluent/lexique/06-actions.json` ligne 334
- Forme liée: `suk`

**Liaison `a`**:
- ✅ Liaison sacrée existante (relation)

**Racine `mori`**:
- ❌ N'existe PAS dans le lexique
- Recherche exhaustive: aucune occurrence

**Contexte**: `Va maku sukamori vo varu mako su zo sukam ul at`
= "Le grand sukamori l'arme grande... a forgé (passé)"

**Hypothèses**:
1. `mori` = racine non documentée (forgeron? artisan?)
2. Composition erronée
3. Devrait être autre chose

**Recommandation**: ❌ Racine `mori` manquante - à documenter ou corriger

---

### 5. `uraal` ❌ NON DOCUMENTÉ

**Décomposition supposée**: `ur-aa-l` ou `ura-al`

**Racine `ur`/`ura`**:
- ✅ Existe: Racine sacrée "eau, flux, vie"
- Forme liée: `ur`

**Liaison `aa`**:
- ✅ Liaison sacrée existante (relation forte)

**Partie finale `l` ou racine `al`**:
- ❌ Aucune racine `al` trouvée dans le lexique
- Un simple `l` ne peut pas être une racine (trop court)

**Contexte**: `Na tova na uraal kisaran ui...`

**Hypothèses**:
1. Composition mal formée
2. Racine `al` non documentée
3. Erreur de construction

**Recommandation**: ❌ Structure invalide - à corriger

---

### 6. `kala` ❌ NON DOCUMENTÉ

**Recherche**:
- ❌ Aucune occurrence dans tout le lexique
- Pas de racine `kal` trouvée
- Structure valide (CV-CV) mais absente

**Contexte**: `Va vokiueka vo kala okimako uravis at`

**Hypothèses**:
1. Mot non documenté (adjectif? nom?)
2. Erreur ou invention

**Recommandation**: ❌ À documenter ou corriger

---

### 7. `vulu` ❌ NON DOCUMENTÉ

**Recherche**:
- ❌ Aucune occurrence dans tout le lexique
- Pas de racine `vul` trouvée
- Structure valide (CV-CV) mais absente

**Contexte**: `vo mako vulu pasak ok`

**Hypothèses**:
1. Mot non documenté (adjectif? nom?)
2. Erreur ou invention

**Recommandation**: ❌ À documenter ou corriger

---

## Résumé des découvertes

### Mots légitimes (1/7)
| Mot | Statut | Source | Action |
|-----|--------|--------|--------|
| `tiru` | ✅ Nombre = 3 | `22-nombres.json` | Ajouter au lexique principal |

### Problèmes détectés (6/7)

| Mot | Type de problème | Sévérité | Action recommandée |
|-----|------------------|----------|-------------------|
| `kisaran` | Suffixe inexistant `aran` | ⚠️ Haute | Probablement typo de `kisiran` |
| `uravis` | Suffixe inexistant `vis` | ⚠️ Haute | Corriger ou documenter |
| `sukamori` | Racine `mori` manquante | 🔴 Critique | Documenter `mori` ou corriger |
| `uraal` | Composition invalide | 🔴 Critique | Corriger la structure |
| `kala` | Mot totalement absent | 🔴 Critique | Documenter ou supprimer |
| `vulu` | Mot totalement absent | 🔴 Critique | Documenter ou supprimer |

---

## Recommandations

### Option A: Corriger le texte de test
Remplacer les mots non documentés par des équivalents conformes à la grammaire établie.

**Avantages**:
- Maintient la cohérence linguistique
- Texte de test devient une référence fiable
- Coverage peut atteindre 98-100%

**Inconvénients**:
- Perd le texte original si celui-ci était intentionnel

### Option B: Documenter les nouveaux mots
Si ces mots sont des extensions légitimes non documentées, les ajouter au lexique.

**Avantages**:
- Enrichit la langue
- Préserve le texte original

**Inconvénients**:
- Nécessite validation linguistique
- Doit définir les suffixes `aran` et `vis` grammaticalement
- Risque d'incohérences si ajoutés sans réflexion

### Option C: Validation hybride
1. ✅ Ajouter `tiru` au dictionnaire principal (nombre légitime)
2. ⚠️ Corriger `kisaran` → `kisiran` (probable typo)
3. 🔴 Demander validation pour `sukamori`, `uraal`, `kala`, `vulu`, `uravis`

---

## Impact sur le coverage

### Scénario actuel (avec ve/eol ajoutés)
- Coverage: **94%** (114/122)
- Mots non trouvés: 8

### Scénario A: Correction du texte
- Coverage potentiel: **98-100%**
- Dépend des corrections apportées

### Scénario B: Documentation des nouveaux mots
- Coverage potentiel: **98-100%**
- Mais risque d'incohérences grammaticales

---

## Conclusion

Le texte de test contient **6 mots problématiques non conformes** à la grammaire documentée. Avant de pousser le coverage à 95%+, il est **critique** de:

1. ✅ Valider l'origine et l'intentionnalité du texte
2. ⚠️ Décider: correction vs documentation
3. 🔴 Ne PAS ajouter de suffixes (`aran`, `vis`) sans validation linguistique formelle

**Statut actuel du traducteur**: ✅ Robuste et fonctionnel (94% coverage avec grammaire validée)
