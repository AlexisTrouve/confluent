# Changelog - Full Lockdown Security

## 🔒 Modifications apportées

### Date : 2025-12-02

### Résumé
Migration complète vers une architecture "full lockdown" où **TOUS** les endpoints nécessitent une authentification, sauf les endpoints publics essentiels.

---

## 📝 Modifications détaillées

### 1. Backend (`server.js`)

#### Nouveaux endpoints publics
```javascript
GET /api/health         // Health check (status server)
GET /api/validate       // Validation de token (retourne user info)
```

#### Endpoints sécurisés (authenticate middleware ajouté)

**Lecture (GET) :**
- ✅ `GET /lexique` - Ajout `authenticate`
- ✅ `GET /api/lexique/:variant` - Ajout `authenticate`
- ✅ `GET /api/stats` - Ajout `authenticate`
- ✅ `GET /api/search` - Ajout `authenticate`

**Actions (POST) :**
- ✅ `POST /translate` - Déjà sécurisé
- ✅ `POST /api/reload` - Ajout `authenticate` + `requireAdmin`
- ✅ `POST /api/debug/prompt` - Ajout `authenticate`
- ✅ `POST /api/analyze/coverage` - Ajout `authenticate`
- ✅ `POST /api/translate/raw` - Ajout `authenticate` + `translationLimiter`
- ✅ `POST /api/translate/batch` - Ajout `authenticate` + `translationLimiter`
- ✅ `POST /api/translate/conf2fr` - Ajout `authenticate` + `translationLimiter`
- ✅ `POST /api/translate/conf2fr/llm` - Déjà sécurisé

**Admin routes :**
- ✅ `POST /api/admin/*` - Déjà sécurisé

### 2. Frontend (`public/index.html`)

#### Fonction `authFetch()` améliorée
```javascript
// Avant : Simple wrapper
const authFetch = (url, options) => {
  return fetch(url, { headers: { 'x-api-key': apiKey } })
}

// Après : Avec auto-logout sur 401/403
const authFetch = async (url, options) => {
  const response = await fetch(url, { headers: { 'x-api-key': apiKey } })

  if (response.status === 401 || response.status === 403) {
    clearApiKey()
    checkAuth()
    throw new Error('Session expirée')
  }

  return response
}
```

#### Fonction `login()` améliorée
```javascript
// Avant : Test avec /api/stats
await fetch('/api/stats', { headers: { 'x-api-key': apiKey } })

// Après : Test avec /api/validate + chargement initial
const response = await fetch('/api/validate', { headers: { 'x-api-key': apiKey } })
if (response.ok) {
  setApiKey(apiKey)
  await loadLexique() // Charge les données après connexion
}
```

#### Calls `fetch()` → `authFetch()`
```javascript
// Avant
await fetch('/api/lexique/ancien')
await fetch('/api/stats?variant=ancien')

// Après
await authFetch('/api/lexique/ancien')
await authFetch('/api/stats?variant=ancien')
```

---

## 🎯 Comportement attendu

### Sans authentification
1. Page HTML se charge
2. Overlay de connexion affiché
3. **AUCUNE** donnée chargée
4. Tous les appels API retournent `401 Unauthorized`

### Avec authentification valide
1. Login réussi
2. Overlay disparaît
3. Données chargées automatiquement (lexique, stats)
4. Interface complètement fonctionnelle

### Session expirée
1. Toute requête retournant 401/403
2. Auto-déconnexion immédiate
3. Overlay réaffiché
4. Message "Session expirée"

---

## 🚀 Comment tester

### Méthode 1 : Script automatisé (Linux/Mac/WSL)
```bash
cd ConfluentTranslator
chmod +x test-security.sh
./test-security.sh
```

### Méthode 2 : Test manuel
Voir le fichier `SECURITY_TEST.md` pour la procédure complète.

### Méthode 3 : Tests curl rapides

```bash
# Test endpoint public (doit réussir)
curl http://localhost:3000/api/health

# Test endpoint protégé sans auth (doit échouer avec 401)
curl http://localhost:3000/api/stats

# Test endpoint protégé avec auth (doit réussir)
TOKEN="votre-token-ici"
curl http://localhost:3000/api/stats -H "x-api-key: $TOKEN"
```

---

## 📊 Comparaison Avant/Après

### Avant (Partial Security)
| Endpoint | Auth | Rate Limit | Notes |
|----------|------|------------|-------|
| GET /api/stats | ❌ Non | ❌ Non | Public |
| GET /api/lexique/* | ❌ Non | ❌ Non | Public |
| POST /translate | ✅ Oui | ✅ Oui | Sécurisé |
| POST /api/reload | ❌ Non | ❌ Non | **DANGER** |

### Après (Full Lockdown)
| Endpoint | Auth | Rate Limit | Notes |
|----------|------|------------|-------|
| GET /api/health | ❌ Non | ❌ Non | Public volontaire |
| GET /api/validate | ✅ Oui | ❌ Non | Validation token |
| GET /api/stats | ✅ Oui | ❌ Non | **Sécurisé** |
| GET /api/lexique/* | ✅ Oui | ❌ Non | **Sécurisé** |
| POST /translate | ✅ Oui | ✅ Oui | Sécurisé |
| POST /api/reload | ✅ Oui + Admin | ❌ Non | **Sécurisé** |
| POST /api/translate/* | ✅ Oui | ✅ Oui | **Sécurisé** |

---

## 🔧 Fichiers modifiés

```
ConfluentTranslator/
├── server.js                    # ✏️ Modifié (ajout authenticate sur tous endpoints)
├── public/index.html            # ✏️ Modifié (authFetch partout, auto-logout)
├── SECURITY_TEST.md             # ✨ Nouveau (procédure de test)
├── test-security.sh             # ✨ Nouveau (script de test automatisé)
└── CHANGELOG_SECURITY.md        # ✨ Nouveau (ce fichier)
```

### Fichiers NON modifiés
```
auth.js                          # ✅ Inchangé (système auth déjà en place)
rateLimiter.js                   # ✅ Inchangé
logger.js                        # ✅ Inchangé
adminRoutes.js                   # ✅ Inchangé
data/tokens.json                 # ✅ Inchangé (géré automatiquement)
```

---

## ⚠️ Points d'attention

### Token admin
- Au premier démarrage, le serveur crée automatiquement un token admin
- **IMPORTANT** : Sauvegarder ce token en lieu sûr
- Le token est stocké dans `data/tokens.json`
- Si perdu : supprimer `data/tokens.json` et redémarrer le serveur

### Rate limiting
Les endpoints de traduction ont un rate limit :
- 10 requêtes par minute par IP
- Les erreurs 429 sont normales si dépassement

### CORS
Aucune modification CORS nécessaire (même origine).

### Backward compatibility
- L'endpoint legacy `GET /lexique` fonctionne toujours
- **Mais nécessite maintenant l'authentification**
- Les anciens clients doivent être mis à jour

---

## 🐛 Dépannage

### Erreur : "API key missing"
**Cause :** Requête sans header `x-api-key`
**Solution :** Vérifier que `authFetch()` est utilisé partout dans le frontend

### Erreur : "Session expirée" en boucle
**Cause :** Token invalide ou désactivé
**Solution :** Se reconnecter avec un token valide

### Interface blanche après login
**Cause :** Erreur de chargement des données
**Solution :** Vérifier la console navigateur et les logs serveur

### 401 même avec token valide
**Cause :** Format du header incorrect
**Solution :** Utiliser `x-api-key` (minuscules, tirets)

---

## 📚 Ressources

- **Documentation auth :** Voir `auth.js` (commentaires inline)
- **Tests manuels :** Voir `SECURITY_TEST.md`
- **Tests automatisés :** Voir `test-security.sh`
- **Tokens :** Stockés dans `data/tokens.json`
- **Logs :** Voir console serveur

---

## ✅ Validation

### Checklist de déploiement
- [ ] Serveur démarre sans erreur
- [ ] Token admin créé et sauvegardé
- [ ] Page HTML accessible
- [ ] Login fonctionne avec token valide
- [ ] Tous les endpoints protégés retournent 401 sans auth
- [ ] Tous les endpoints protégés fonctionnent avec auth
- [ ] Auto-logout fonctionne sur 401/403
- [ ] Rate limiting actif sur endpoints traduction
- [ ] Script `test-security.sh` passe tous les tests

---

## 🎉 Résultat

**✅ FULL LOCKDOWN OPÉRATIONNEL**

Tous les endpoints sont maintenant sécurisés. L'interface HTML ne peut charger aucune donnée sans authentification valide. Le système gère automatiquement les sessions expirées.

**Sécurité : 🔒 MAXIMALE**
