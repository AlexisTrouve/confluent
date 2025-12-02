# 🚀 Quick Start - Tests API

Guide ultra-rapide pour tester la sécurité en 2 minutes.

## Étape 1 : Vérification rapide

```cmd
cd ConfluentTranslator\testsAPI
quick-check.bat
```

**Ce script vérifie :**
- ✅ Serveur actif
- ✅ Sécurité active (401 sans auth)
- ✅ Token admin créé
- ✅ curl disponible

**Si tout est OK, passez à l'étape 2.**

---

## Étape 2 : Récupérer le token

```cmd
get-token.bat
```

**Ce script affiche :**
- Le contenu de `data/tokens.json`
- Le token admin en vert
- Instructions pour configurer les tests

**Copiez le token affiché.**

---

## Étape 3 : Configurer les tests

```cmd
notepad test-authorized.bat
```

**Modifier cette ligne :**
```batch
set TOKEN=VOTRE_TOKEN_ICI
```

**Par :**
```batch
set TOKEN=c32b04be-2e68-4e15-8362-xxxxx
```

*(Remplacez par votre vrai token)*

**Sauvegarder et fermer.**

---

## Étape 4 : Lancer tous les tests

```cmd
test-all.bat
```

**Ce script lance :**
1. ✅ Test endpoint public (health)
2. ✅ Test sécurité sans auth (13 tests)
3. ✅ Test accès avec auth (8 tests)

**Total : 22 tests**

---

## ✅ Résultat attendu

### Test 1 : Health check
```
[OK] 200 Endpoint accessible
```

### Test 2 : Sans authentification
```
Total: 13 tests
Passes: 13 (401 retourne)
Echoues: 0
[OK] Tous les endpoints sont correctement proteges
```

### Test 3 : Avec authentification
```
Total: 8 tests
Passes: 8 (200 OK)
Echoues: 0
[OK] Tous les endpoints sont accessibles avec auth
```

---

## 🐛 Problèmes ?

### "Serveur inactif"
```cmd
cd ConfluentTranslator
npm start
```

### "Token introuvable"
```cmd
REM Supprimer et recréer
del data\tokens.json
npm start
```

### "curl non reconnu"
- Windows 10+ : curl est préinstallé
- Vérifier : `curl --version`

---

## 📚 Plus de détails ?

Voir `README.md` pour la documentation complète.

---

**C'est tout ! En 4 étapes, vous avez testé toute la sécurité de l'API.**
