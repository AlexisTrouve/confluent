# 🔒 Full Lockdown Security - Guide Rapide

## ✅ C'EST FAIT !

Tous les endpoints sont maintenant sécurisés. Voici ce qui a changé :

### Avant → Après

**AVANT :** N'importe qui pouvait :
- ❌ Lire le lexique complet
- ❌ Voir les stats
- ❌ Recharger les lexiques
- ❌ Debugger les prompts
- ❌ Faire des traductions batch

**APRÈS :** Personne ne peut rien faire sans token valide
- ✅ Tous les endpoints nécessitent authentification
- ✅ Interface bloquée sans connexion
- ✅ Auto-logout sur session expirée
- ✅ Rate limiting sur traductions

---

## 🚀 Démarrage rapide

### 1. Lancer le serveur

```bash
cd ConfluentTranslator
npm start
```

### 2. Récupérer le token admin

**Le serveur va afficher :**
```
🔑 Admin token created: c32b04be-2e68-4e15-8362-xxxxx
⚠️  SAVE THIS TOKEN - It will not be shown again!
```

**OU lire le fichier :**
```bash
cat data/tokens.json
```

### 3. Se connecter

1. Ouvrir `http://localhost:3000`
2. Entrer le token admin dans le champ "API Key"
3. Cliquer "Se connecter"
4. ✅ L'interface se charge

---

## 🧪 Tester la sécurité

### Test automatique (Linux/Mac/WSL)

```bash
chmod +x test-security.sh
./test-security.sh
```

### Test manuel rapide

```bash
# Sans auth (doit échouer avec 401)
curl http://localhost:3000/api/stats

# Avec auth (doit réussir)
TOKEN="votre-token"
curl http://localhost:3000/api/stats -H "x-api-key: $TOKEN"
```

**Résultat attendu :**
- Sans auth : `{"error":"API key missing"}` (401)
- Avec auth : JSON avec les stats

---

## 📝 Ce qui a été modifié

### Backend (`server.js`)

```diff
// Avant
- app.get('/api/stats', (req, res) => {
+ app.get('/api/stats', authenticate, (req, res) => {

// Avant
- app.post('/api/reload', (req, res) => {
+ app.post('/api/reload', authenticate, requireAdmin, (req, res) => {
```

**Tous les endpoints ont `authenticate` maintenant**

### Frontend (`index.html`)

```diff
// Avant
- const response = await fetch('/api/stats');
+ const response = await authFetch('/api/stats');

// authFetch() gère automatiquement :
// - Header x-api-key
// - Auto-logout sur 401/403
// - Erreurs de session
```

---

## 🔑 Gestion des tokens

### Où sont les tokens ?
```
ConfluentTranslator/data/tokens.json
```

### Format :
```json
{
  "c32b04be-2e68-4e15-8362-xxx": {
    "name": "admin",
    "role": "admin",
    "enabled": true,
    "createdAt": "2025-12-02T..."
  }
}
```

### Créer un nouveau token admin
```bash
# Supprimer le fichier et redémarrer
rm data/tokens.json
npm start
```

### Créer un token user (via API admin)
```bash
TOKEN_ADMIN="votre-token-admin"
curl -X POST http://localhost:3000/api/admin/tokens \
  -H "x-api-key: $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"name":"user1","role":"user"}'
```

---

## 🛡️ Endpoints sécurisés

### Public (pas d'auth)
- `GET /` - Page HTML
- `GET /api/health` - Health check

### Protégé (auth requise)
- `GET /api/stats`
- `GET /api/lexique/:variant`
- `GET /api/search`
- `GET /api/validate`
- `POST /translate`
- `POST /api/translate/*`
- `POST /api/analyze/coverage`
- `POST /api/debug/prompt`

### Admin only
- `POST /api/reload`
- `POST /api/admin/*`

---

## ⚠️ Troubleshooting

### "API key missing" partout
**Problème :** Pas connecté ou token invalide
**Solution :** Se connecter avec un token valide

### Interface blanche après login
**Problème :** Erreur de chargement
**Solution :** Ouvrir la console (F12) et vérifier les erreurs

### "Session expirée" en boucle
**Problème :** Token désactivé côté serveur
**Solution :** Vérifier `data/tokens.json` que `enabled: true`

### Token admin perdu
**Problème :** Fichier `tokens.json` supprimé ou corrompu
**Solution :**
```bash
rm data/tokens.json
npm start  # Un nouveau token sera créé
```

---

## 📚 Documentation complète

- **Tests détaillés :** Voir `SECURITY_TEST.md`
- **Changelog :** Voir `CHANGELOG_SECURITY.md`
- **Script de test :** Voir `test-security.sh`

---

## ✅ Checklist

- [x] Tous les endpoints protégés
- [x] Interface bloquée sans auth
- [x] Auto-logout sur session expirée
- [x] Rate limiting actif
- [x] Token admin créé automatiquement
- [x] Documentation complète
- [x] Scripts de test fournis

---

## 🎉 Résultat

**Full lockdown opérationnel !**

Personne ne peut accéder aux données sans authentification. Le système est sécurisé de bout en bout.

**Questions ?** Voir `SECURITY_TEST.md` pour plus de détails.
