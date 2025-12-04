# 🧪 Tests API - ConfluentTranslator

Suite de tests automatisés pour valider la sécurité et le bon fonctionnement de l'API.

## 📋 Scripts disponibles

### 1. `test-health.bat`
Teste l'endpoint public `/api/health`.

**Utilisation :**
```cmd
test-health.bat
```

**Vérifie :**
- ✅ Endpoint accessible sans authentification
- ✅ Retourne status 200
- ✅ Retourne JSON avec `"status":"ok"`

---

### 2. `test-unauthorized.bat`
Teste tous les endpoints protégés SANS authentification.

**Utilisation :**
```cmd
test-unauthorized.bat
```

**Vérifie que TOUS les endpoints retournent 401 :**
- GET endpoints : stats, lexique, search, validate
- POST endpoints : translate, reload, debug, coverage, batch, conf2fr

**Résultat attendu :** Tous les tests passent (401 Unauthorized)

---

### 3. `test-authorized.bat`
Teste tous les endpoints protégés AVEC authentification.

**Utilisation :**
```cmd
REM 1. Éditer le fichier et configurer le token
notepad test-authorized.bat

REM 2. Remplacer cette ligne :
REM    set TOKEN=VOTRE_TOKEN_ICI
REM par :
REM    set TOKEN=votre-vrai-token

REM 3. Lancer le test
test-authorized.bat
```

**Vérifie :**
- ✅ Validate token retourne 200 avec user info
- ✅ Stats retourne 200 avec données
- ✅ Lexique retourne 200 avec vocabulaire
- ✅ Search retourne 200 avec résultats
- ✅ Endpoints POST fonctionnent avec auth

**Note :** Certains endpoints nécessitant des API keys LLM sont skippés.

---

### 4. `test-all.bat`
Lance tous les tests dans l'ordre.

**Utilisation :**
```cmd
test-all.bat
```

**Exécute :**
1. Test endpoint public (health)
2. Test sécurité sans auth (unauthorized)
3. Test accès avec auth (authorized)

**Résultat final :** Résumé de tous les tests

---

## 🚀 Quick Start

### Étape 1 : Démarrer le serveur
```cmd
cd ConfluentTranslator
npm start
```

### Étape 2 : Récupérer le token admin
**Option A - Depuis les logs :**
Le serveur affiche le token au démarrage :
```
🔑 Admin token created: c32b04be-2e68-4e15-8362-xxxxx
⚠️  SAVE THIS TOKEN - It will not be shown again!
```

**Option B - Depuis le fichier :**
```cmd
type data\tokens.json
```

### Étape 3 : Configurer test-authorized.bat
```cmd
notepad testsAPI\test-authorized.bat
```

Remplacer :
```batch
set TOKEN=VOTRE_TOKEN_ICI
```
par :
```batch
set TOKEN=c32b04be-2e68-4e15-8362-xxxxx
```

### Étape 4 : Lancer tous les tests
```cmd
cd testsAPI
test-all.bat
```

---

## 📊 Tests détaillés

### Test 1: Endpoint public

| Endpoint | Méthode | Auth | Status attendu | Description |
|----------|---------|------|----------------|-------------|
| `/api/health` | GET | ❌ Non | 200 | Health check serveur |

### Test 2: Endpoints protégés (sans auth)

| Endpoint | Méthode | Auth | Status attendu | Description |
|----------|---------|------|----------------|-------------|
| `/api/stats` | GET | ❌ Non | **401** | Stats lexique |
| `/api/lexique/ancien` | GET | ❌ Non | **401** | Lexique ancien |
| `/api/lexique/proto` | GET | ❌ Non | **401** | Lexique proto |
| `/api/search` | GET | ❌ Non | **401** | Recherche lexique |
| `/api/validate` | GET | ❌ Non | **401** | Validation token |
| `/translate` | POST | ❌ Non | **401** | Traduction FR→CF |
| `/api/reload` | POST | ❌ Non | **401** | Reload lexiques |
| `/api/debug/prompt` | POST | ❌ Non | **401** | Debug prompt |
| `/api/analyze/coverage` | POST | ❌ Non | **401** | Coverage analysis |
| `/api/translate/raw` | POST | ❌ Non | **401** | Traduction raw |
| `/api/translate/batch` | POST | ❌ Non | **401** | Traduction batch |
| `/api/translate/conf2fr` | POST | ❌ Non | **401** | Traduction CF→FR |
| `/api/translate/conf2fr/llm` | POST | ❌ Non | **401** | Traduction CF→FR LLM |

**Total : 13 endpoints doivent retourner 401**

### Test 3: Endpoints protégés (avec auth)

| Endpoint | Méthode | Auth | Status attendu | Description |
|----------|---------|------|----------------|-------------|
| `/api/validate` | GET | ✅ Oui | **200** | Validation token |
| `/api/stats` | GET | ✅ Oui | **200** | Stats lexique |
| `/api/lexique/ancien` | GET | ✅ Oui | **200** | Lexique ancien |
| `/api/search?q=eau` | GET | ✅ Oui | **200** | Recherche "eau" |
| `/api/debug/prompt` | POST | ✅ Oui | **200** | Debug prompt |
| `/api/analyze/coverage` | POST | ✅ Oui | **200** | Coverage analysis |
| `/api/translate/batch` | POST | ✅ Oui | **200** | Traduction batch |
| `/api/translate/conf2fr` | POST | ✅ Oui | **200** | Traduction CF→FR |

**Total : 8 endpoints doivent retourner 200**

### Endpoints skippés

Ces endpoints nécessitent des configurations supplémentaires :

| Endpoint | Raison | Comment tester |
|----------|--------|----------------|
| `/translate` | Requiert ANTHROPIC_API_KEY | Configurer `.env` |
| `/api/translate/raw` | Requiert API keys LLM | Configurer `.env` |
| `/api/translate/conf2fr/llm` | Requiert API keys LLM | Configurer `.env` |
| `/api/reload` | Admin only | Utiliser token admin |

---

## ✅ Critères de succès

### Test complet réussi si :

**Test 1 (health) :**
- ✅ Status 200 retourné
- ✅ JSON contient `"status":"ok"`

**Test 2 (unauthorized) :**
- ✅ 13/13 endpoints retournent 401
- ✅ Message "API key missing" ou similaire

**Test 3 (authorized) :**
- ✅ 8/8 endpoints retournent 200
- ✅ Données JSON valides retournées

---

## 🐛 Dépannage

### Erreur: "curl n'est pas reconnu"
**Cause :** curl n'est pas installé ou pas dans le PATH

**Solution :**
- Windows 10+ : curl est préinstallé
- Vérifier : `curl --version`
- Installer si besoin : https://curl.se/windows/

### Erreur: "Connexion refusée"
**Cause :** Le serveur n'est pas démarré

**Solution :**
```cmd
cd ConfluentTranslator
npm start
```

### Test unauthorized échoue (pas 401)
**Cause :** Un endpoint n'est pas protégé

**Solution :**
- Vérifier que `authenticate` middleware est présent sur l'endpoint
- Vérifier `server.js:line XX` pour l'endpoint qui échoue

### Test authorized échoue (401 au lieu de 200)
**Cause :** Token invalide ou expiré

**Solution :**
1. Vérifier que le token est correct dans `test-authorized.bat`
2. Vérifier que le token existe dans `data/tokens.json`
3. Vérifier que `enabled: true` dans le fichier JSON

### Test authorized retourne 500
**Cause :** Erreur serveur (lexiques non chargés, etc.)

**Solution :**
- Vérifier les logs du serveur
- Vérifier que les fichiers lexique existent
- Redémarrer le serveur

---

## 📝 Logs et debugging

### Activer les logs détaillés
Les logs sont automatiquement affichés dans la console du serveur.

### Voir le détail d'une requête
Ajouter `-v` à curl pour voir les headers :
```cmd
curl -v http://localhost:3000/api/stats
```

### Tester un endpoint manuellement
```cmd
REM Sans auth (doit échouer)
curl http://localhost:3000/api/stats

REM Avec auth (doit réussir)
curl -H "x-api-key: VOTRE_TOKEN" http://localhost:3000/api/stats
```

---

## 🔧 Personnalisation

### Ajouter un nouveau test

**1. Créer `test-custom.bat` :**
```batch
@echo off
echo Test personnalise
curl -H "x-api-key: %TOKEN%" http://localhost:3000/api/custom-endpoint
pause
```

**2. Ajouter dans `test-all.bat` :**
```batch
echo TEST 4: CUSTOM
call test-custom.bat
```

### Modifier le serveur de test
Par défaut : `http://localhost:3000`

Pour changer :
```batch
REM Dans chaque fichier .bat, remplacer :
set BASE_URL=http://localhost:3000
REM par :
set BASE_URL=http://votre-serveur:port
```

---

## 📚 Ressources

- **Documentation sécurité :** Voir `../SECURITY_TEST.md`
- **Changelog :** Voir `../CHANGELOG_SECURITY.md`
- **Guide rapide :** Voir `../README_SECURITY.md`
- **Auth système :** Voir `../auth.js`

---

## 🎯 Résumé

| Script | Tests | Durée | Prérequis |
|--------|-------|-------|-----------|
| `test-health.bat` | 1 | ~2s | Serveur actif |
| `test-unauthorized.bat` | 13 | ~10s | Serveur actif |
| `test-authorized.bat` | 8 | ~8s | Serveur + Token |
| `test-all.bat` | 22 | ~20s | Serveur + Token |

**Total : 22 tests automatisés**

---

## ✨ Contribution

Pour ajouter de nouveaux tests :
1. Créer un nouveau fichier `.bat`
2. Suivre le format des tests existants
3. Ajouter dans `test-all.bat`
4. Documenter dans ce README

---

**Made with ❤️ for ConfluentTranslator security testing**
