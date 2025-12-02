# Test de Sécurité - Full Lockdown

## 🎯 Objectif
Vérifier que **TOUS** les endpoints sont sécurisés et nécessitent une authentification.

## 🔐 Système d'authentification

### Endpoints publics (pas d'auth)
- `GET /api/health` - Health check (status: ok)
- `GET /` - Page HTML statique

### Endpoints protégés (auth requise)
Tous les autres endpoints nécessitent le header `x-api-key` avec un token valide.

## 📋 Checklist de test

### 1. Démarrage initial

```bash
cd ConfluentTranslator
npm start
```

**Attendu :** Le serveur démarre et affiche :
- Port d'écoute (3000)
- Nombre d'entrées lexique chargées
- **IMPORTANT :** Message de création du token admin si `data/tokens.json` est vide

### 2. Accès sans authentification

**Test :** Ouvrir `http://localhost:3000` dans le navigateur

**Attendu :**
- ✅ La page HTML se charge
- ✅ L'overlay de connexion est affiché (fond noir avec modal bleu)
- ✅ Un champ "API Key" et un bouton "Se connecter"

**Vérification :** Aucune donnée ne doit être chargée dans les onglets (stats, lexique)

### 3. Test d'authentification invalide

**Test :** Entrer une fausse clé API (ex: `test-123`)

**Attendu :**
- ❌ Message d'erreur "Clé API invalide"
- ❌ L'overlay reste affiché

### 4. Récupération du token admin

**Option A - Depuis les logs serveur :**
```bash
# Chercher dans les logs du serveur au démarrage
grep "Admin token" logs.txt
```

**Option B - Lire le fichier :**
```bash
cat ConfluentTranslator/data/tokens.json
```

**Format du fichier :**
```json
{
  "c32b04be-2e68-4e15-8362-...": {
    "name": "admin",
    "role": "admin",
    "enabled": true,
    "createdAt": "2025-12-02T..."
  }
}
```

### 5. Connexion avec token valide

**Test :** Copier le token admin et le coller dans le champ API Key

**Attendu :**
- ✅ Message de succès (ou disparition de l'overlay)
- ✅ Redirection vers l'interface principale
- ✅ Les données se chargent automatiquement (stats, lexique)
- ✅ Bouton "Déconnexion" visible en haut à droite

### 6. Vérification endpoints protégés

**Test en ligne de commande (sans auth) :**

```bash
# Test health (PUBLIC - devrait fonctionner)
curl http://localhost:3000/api/health

# Test stats (PROTÉGÉ - devrait échouer)
curl http://localhost:3000/api/stats

# Test lexique (PROTÉGÉ - devrait échouer)
curl http://localhost:3000/api/lexique/ancien

# Test traduction (PROTÉGÉ - devrait échouer)
curl -X POST http://localhost:3000/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"bonjour","target":"ancien","provider":"anthropic","model":"claude-sonnet-4-20250514"}'
```

**Attendu pour endpoints protégés :**
```json
{
  "error": "API key missing"
}
```
Status HTTP: `401 Unauthorized`

### 7. Vérification endpoints protégés (avec auth)

```bash
# Remplacer YOUR_TOKEN par le token admin
TOKEN="c32b04be-2e68-4e15-8362-..."

# Test stats (devrait fonctionner)
curl http://localhost:3000/api/stats \
  -H "x-api-key: $TOKEN"

# Test lexique (devrait fonctionner)
curl http://localhost:3000/api/lexique/ancien \
  -H "x-api-key: $TOKEN"

# Test validation (devrait fonctionner)
curl http://localhost:3000/api/validate \
  -H "x-api-key: $TOKEN"
```

**Attendu :** Réponses JSON avec données complètes

### 8. Test de l'interface web

**Test dans le navigateur (connecté) :**

1. **Onglet Stats**
   - ✅ Statistiques affichées
   - ✅ Nombres de mots, racines, etc.

2. **Onglet Lexique**
   - ✅ Recherche fonctionnelle
   - ✅ Résultats affichés en temps réel

3. **Onglet Traduction FR→CF**
   - ✅ Peut entrer du texte
   - ✅ Bouton "Traduire" actif
   - ✅ Traduction s'affiche (si API keys LLM configurées)

4. **Onglet Traduction CF→FR**
   - ✅ Peut entrer du texte
   - ✅ Bouton "Traduire" actif
   - ✅ Traduction s'affiche

### 9. Test de déconnexion

**Test :** Cliquer sur "Déconnexion"

**Attendu :**
- ✅ Confirmation demandée
- ✅ Overlay de connexion réaffiché
- ✅ Données effacées de l'interface
- ✅ LocalStorage vidé (`confluentApiKey` supprimé)

### 10. Test de session expirée

**Test :**
1. Se connecter
2. Supprimer le token côté serveur (éditer `data/tokens.json` et mettre `enabled: false`)
3. Tenter une action (ex: recherche lexique, traduction)

**Attendu :**
- ✅ Erreur "Session expirée"
- ✅ Déconnexion automatique
- ✅ Redirection vers overlay de connexion

## 🛡️ Liste complète des endpoints protégés

### GET (lecture)
- ✅ `/lexique` - Auth requise
- ✅ `/api/lexique/:variant` - Auth requise
- ✅ `/api/stats` - Auth requise
- ✅ `/api/search` - Auth requise
- ✅ `/api/validate` - Auth requise

### POST (écriture/actions)
- ✅ `/translate` - Auth + Rate limiting
- ✅ `/api/reload` - Auth + Admin only
- ✅ `/api/debug/prompt` - Auth requise
- ✅ `/api/analyze/coverage` - Auth requise
- ✅ `/api/translate/raw` - Auth + Rate limiting
- ✅ `/api/translate/batch` - Auth + Rate limiting
- ✅ `/api/translate/conf2fr` - Auth + Rate limiting
- ✅ `/api/translate/conf2fr/llm` - Auth + Rate limiting
- ✅ `/api/admin/*` - Auth + Admin only

## 📊 Résultats attendus

✅ **SUCCÈS si :**
- Tous les endpoints protégés retournent 401 sans token
- Tous les endpoints protégés fonctionnent avec token valide
- Interface web bloque l'accès sans connexion
- Déconnexion fonctionne correctement
- Sessions expirées sont gérées automatiquement

❌ **ÉCHEC si :**
- Un endpoint protégé répond sans token
- L'interface charge des données sans connexion
- Les erreurs d'auth ne déconnectent pas automatiquement

## 🚀 Commandes rapides

```bash
# Démarrer le serveur
npm start

# Vérifier les tokens
cat data/tokens.json

# Créer un nouveau token (si admin token perdu)
# Supprimer data/tokens.json et redémarrer le serveur
rm data/tokens.json
npm start

# Tester tous les endpoints publics
curl http://localhost:3000/api/health

# Tester tous les endpoints protégés (sans auth - doit échouer)
curl http://localhost:3000/api/stats
curl http://localhost:3000/api/lexique/ancien

# Tester avec auth (doit réussir)
TOKEN="votre-token-ici"
curl http://localhost:3000/api/stats -H "x-api-key: $TOKEN"
```

## 🔧 Dépannage

**Problème : Pas de token admin créé**
- Solution : Supprimer `data/tokens.json` et redémarrer

**Problème : 401 même avec token valide**
- Solution : Vérifier que le token est actif (`enabled: true`)
- Vérifier le format du header : `x-api-key` (minuscules, avec tirets)

**Problème : Interface ne se charge pas**
- Solution : Vérifier que `public/index.html` est accessible
- Vérifier les logs serveur pour erreurs

**Problème : Rate limiting bloque les requêtes**
- Solution : Attendre 1 minute ou redémarrer le serveur
