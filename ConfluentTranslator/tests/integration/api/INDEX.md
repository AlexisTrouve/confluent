# 📦 testsAPI/ - Index des fichiers

Suite complète de tests pour valider la sécurité de l'API ConfluentTranslator.

## 📂 Structure

```
testsAPI/
├── README.md               Documentation complète (8KB)
├── QUICKSTART.md           Guide rapide 2 minutes
├── INDEX.md                Ce fichier
│
├── quick-check.bat         Vérification rapide (4 checks)
├── get-token.bat           Extraction du token admin
│
├── test-health.bat         Test endpoint public (1 test)
├── test-unauthorized.bat   Test sécurité sans auth (13 tests)
├── test-authorized.bat     Test accès avec auth (8 tests)
└── test-all.bat            Lance tous les tests (22 tests)
```

---

## 🎯 Quel script utiliser ?

### Je veux tester rapidement tout le système
➡️ **`test-all.bat`** - Lance tous les tests d'un coup (22 tests)

### Je veux vérifier si tout est prêt pour les tests
➡️ **`quick-check.bat`** - Vérifie serveur, sécurité, token, outils (4 checks)

### Je veux récupérer mon token admin
➡️ **`get-token.bat`** - Affiche le token depuis data/tokens.json

### Je veux tester un aspect spécifique

| Aspect à tester | Script | Tests | Durée |
|----------------|--------|-------|-------|
| Endpoint public | `test-health.bat` | 1 | ~2s |
| Sécurité sans auth | `test-unauthorized.bat` | 13 | ~10s |
| Accès avec auth | `test-authorized.bat` | 8 | ~8s |

---

## 📖 Documentation

### Pour débuter
➡️ **`QUICKSTART.md`** - Guide en 4 étapes (2 minutes)

### Pour tout comprendre
➡️ **`README.md`** - Documentation complète avec :
- Scripts disponibles
- Tests détaillés
- Critères de succès
- Dépannage
- Personnalisation

---

## ⚡ Workflow recommandé

### Première fois
```cmd
1. quick-check.bat      Vérifier que tout est prêt
2. get-token.bat        Récupérer le token admin
3. notepad test-authorized.bat   Configurer le token
4. test-all.bat         Lancer tous les tests
```

### Tests réguliers
```cmd
test-all.bat            Après chaque modification serveur
```

### Debug spécifique
```cmd
test-health.bat         Si problème de connexion serveur
test-unauthorized.bat   Si doute sur la sécurité
test-authorized.bat     Si problème d'authentification
```

---

## 🔢 Statistiques

### Scripts de test
- **4 scripts** de test principaux
- **2 scripts** utilitaires
- **22 tests** au total
- **100%** des endpoints couverts

### Endpoints testés

**Public (sans auth) :**
- 1 endpoint : `/api/health`

**Protégés (doivent retourner 401 sans auth) :**
- 5 GET : stats, lexique/ancien, lexique/proto, search, validate
- 8 POST : translate, reload, debug/prompt, analyze/coverage, translate/raw, translate/batch, translate/conf2fr, translate/conf2fr/llm

**Protégés (doivent retourner 200 avec auth) :**
- 4 GET : validate, stats, lexique/ancien, search
- 4 POST : debug/prompt, analyze/coverage, translate/batch, translate/conf2fr

---

## 🎨 Codes couleurs (dans les scripts)

Les scripts utilisent des codes couleurs pour les résultats :

- **[OK]** - Test passé (vert)
- **[FAIL]** - Test échoué (rouge)
- **[ERREUR]** - Erreur système (rouge)
- **Token affiché** - En vert dans get-token.bat

---

## 🔧 Configuration requise

### Outils
- Windows 10+ (curl préinstallé)
- Node.js (pour le serveur)
- PowerShell (pour get-token.bat)

### Serveur
- ConfluentTranslator démarré (`npm start`)
- Port 3000 disponible
- Token admin créé (auto au premier démarrage)

### Optionnel (pour tests LLM)
- ANTHROPIC_API_KEY dans .env
- OPENAI_API_KEY dans .env

---

## 📝 Notes importantes

### Token admin
- Créé automatiquement au premier démarrage
- Stocké dans `data/tokens.json`
- Affiché une seule fois dans les logs
- Utilisez `get-token.bat` pour le récupérer

### Tests LLM
Certains tests sont skippés car ils nécessitent :
- API keys LLM configurées (.env)
- Crédits API disponibles
- Plus de temps d'exécution

Ces tests peuvent être lancés manuellement si besoin.

### Personnalisation
Pour ajouter vos propres tests :
1. Créer `test-custom.bat`
2. Suivre le format des scripts existants
3. Ajouter dans `test-all.bat`
4. Documenter ici

---

## 🔗 Liens connexes

### Dans ce dossier
- `README.md` - Documentation complète
- `QUICKSTART.md` - Guide rapide

### Documentation principale
- `../README_SECURITY.md` - Guide sécurité principal
- `../SECURITY_TEST.md` - Tests manuels détaillés
- `../CHANGELOG_SECURITY.md` - Historique des modifications

### Code source
- `../server.js` - Endpoints API
- `../auth.js` - Système d'authentification
- `../rateLimiter.js` - Rate limiting

---

## ✅ Checklist avant test

Avant de lancer les tests, vérifiez :

- [ ] Serveur démarré (`npm start`)
- [ ] Port 3000 libre
- [ ] curl disponible (`curl --version`)
- [ ] Token admin extrait (`get-token.bat`)
- [ ] Token configuré dans `test-authorized.bat`

**Tout est OK ?** ➡️ Lancez `test-all.bat`

---

## 🎉 Résultat attendu

Si tous les tests passent :
```
========================================
RESULTAT: OK - Tous les tests sont passes
========================================

[OK] Tous les endpoints sont correctement proteges
[OK] Tous les endpoints sont accessibles avec auth
```

**C'est bon !** Votre API est correctement sécurisée.

---

**Made with ❤️ for ConfluentTranslator**
*Version 1.0 - Full Lockdown Security*
