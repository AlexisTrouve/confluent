# 🔐 Guide d'Administration - ConfluentTranslator

Guide complet pour gérer les tokens API et l'accès à votre instance ConfluentTranslator.

---

## 🚀 Accès à l'interface d'administration

### URL
```
http://localhost:3000/admin.html
```

Ou en production :
```
https://votre-domaine.com/admin.html
```

### Prérequis
- ✅ Être connecté avec un token **admin**
- ✅ Le serveur doit être démarré

### Accès rapide depuis l'interface
1. Connectez-vous à l'interface principale
2. Si vous êtes admin, un bouton **🔐 Admin** apparaît en haut à droite
3. Cliquez dessus pour accéder au panneau d'administration

---

## 🔑 Premier démarrage : Obtenir le token admin

### Méthode automatique

**Au premier démarrage, un token admin est créé automatiquement :**

```bash
cd ConfluentTranslator
npm start
```

**Dans les logs, vous verrez :**
```
🔑 Admin token created: c32b04be-2e68-4e15-8362-a4f5-9b3c-12d4567890ab
⚠️  SAVE THIS TOKEN - It will not be shown again!
```

**⚠️ CRITIQUE : Sauvegardez ce token immédiatement !**
- Copiez-le dans un gestionnaire de mots de passe
- Ou dans un fichier sécurisé (hors du repo git)

### Récupérer le token existant

**Si vous avez déjà démarré le serveur :**

```bash
# Windows
type ConfluentTranslator\data\tokens.json

# Linux/Mac
cat ConfluentTranslator/data/tokens.json
```

**Le fichier ressemble à :**
```json
{
  "c32b04be-2e68-4e15-8362-a4f5-9b3c-12d4567890ab": {
    "name": "admin",
    "role": "admin",
    "enabled": true,
    "createdAt": "2025-12-02T13:25:00.000Z"
  }
}
```

**Le token est la clé (la longue chaîne).**

### Token perdu ou corrompu ?

```bash
cd ConfluentTranslator

# Supprimer le fichier de tokens
rm data/tokens.json  # Linux/Mac
del data\tokens.json # Windows

# Redémarrer le serveur
npm start

# Un nouveau token admin sera créé et affiché
```

---

## 📊 Tableau de bord

L'interface admin affiche 4 statistiques clés :

### Total Tokens
Nombre total de tokens créés (actifs + désactivés)

### Actifs
Nombre de tokens actuellement actifs et utilisables

### Admins
Nombre de tokens avec le rôle admin

### Requêtes (24h)
Nombre total de requêtes API dans les dernières 24h

---

## ➕ Créer un nouveau token

### Via l'interface web

1. Accédez à `/admin.html`
2. Section **"Créer un nouveau token"**
3. Remplissez les champs :
   - **Nom** : Description du token (ex: "Frontend prod", "Mobile app", "User Jean")
   - **Rôle** :
     - **User** : Accès standard (peut utiliser l'API)
     - **Admin** : Accès complet (peut gérer les tokens)
4. Cliquez sur **"Créer le token"**
5. **IMPORTANT** : Copiez le token affiché immédiatement
6. Le token ne sera **plus jamais affiché**

### Via l'API (curl)

```bash
# Créer un token user
curl -X POST http://localhost:3000/api/admin/tokens \
  -H "x-api-key: VOTRE_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"name":"user-frontend","role":"user"}'

# Créer un token admin
curl -X POST http://localhost:3000/api/admin/tokens \
  -H "x-api-key: VOTRE_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"name":"admin-backup","role":"admin"}'
```

**Réponse :**
```json
{
  "token": "nouveau-token-xyz-123...",
  "name": "user-frontend",
  "role": "user"
}
```

---

## 📋 Gérer les tokens existants

### Lister tous les tokens

**Interface web :**
- Section **"Tokens existants"**
- Affiche tous les tokens avec leurs détails

**API :**
```bash
curl -H "x-api-key: VOTRE_TOKEN_ADMIN" \
  http://localhost:3000/api/admin/tokens
```

### Informations affichées

Pour chaque token :
- 🔑 **ID du token** (en bleu, police monospace)
- 🏷️ **Badge rôle** : Admin (bleu) ou User (gris)
- 📛 **Nom/Description**
- 📅 **Date de création**
- ⚡ **Statut** : Actif ou Désactivé
- 🎛️ **Actions** : Activer/Désactiver, Supprimer

---

## 🔴 Désactiver un token

**Désactiver = bloquer temporairement sans supprimer**

### Interface web
1. Trouvez le token dans la liste
2. Cliquez sur **"Désactiver"**
3. Confirmez

Le token devient gris et affiche un badge "Désactivé"

### API
```bash
curl -X POST http://localhost:3000/api/admin/tokens/TOKEN_A_DESACTIVER/disable \
  -H "x-api-key: VOTRE_TOKEN_ADMIN"
```

**Effet :**
- ❌ Le token ne peut plus faire de requêtes API (401)
- ✅ Le token existe toujours (peut être réactivé)
- ✅ L'historique est conservé

---

## ✅ Activer un token

**Réactiver un token précédemment désactivé**

### Interface web
1. Trouvez le token désactivé (gris)
2. Cliquez sur **"Activer"**

Le token redevient actif immédiatement

### API
```bash
curl -X POST http://localhost:3000/api/admin/tokens/TOKEN_A_ACTIVER/enable \
  -H "x-api-key: VOTRE_TOKEN_ADMIN"
```

---

## 🗑️ Supprimer un token

**⚠️ ATTENTION : Suppression définitive !**

### Interface web
1. Trouvez le token dans la liste
2. Cliquez sur **"Supprimer"** (bouton rouge)
3. **Confirmation demandée** : "Supprimer définitivement ce token ?"
4. Confirmez

Le token est **supprimé définitivement**

### API
```bash
curl -X DELETE http://localhost:3000/api/admin/tokens/TOKEN_A_SUPPRIMER \
  -H "x-api-key: VOTRE_TOKEN_ADMIN"
```

**Effet :**
- ❌ Le token est détruit (ne peut plus être utilisé)
- ❌ Le token ne peut **PAS** être restauré
- ⚠️ Toutes les applications utilisant ce token perdront l'accès

---

## 🎯 Cas d'usage typiques

### 1. Déployer une application frontend

```
1. Créer un token user nommé "Frontend Prod"
2. Copier le token
3. L'ajouter dans les variables d'environnement du frontend
4. Déployer l'application
```

### 2. Donner accès à un utilisateur

```
1. Créer un token user avec le nom de l'utilisateur
2. Envoyer le token de manière sécurisée (Signal, etc.)
3. L'utilisateur se connecte avec ce token sur l'interface web
```

### 3. Créer un compte admin secondaire

```
1. Créer un token admin nommé "Admin Backup"
2. Sauvegarder dans un gestionnaire de mots de passe
3. Utiliser en cas de perte du token admin principal
```

### 4. Révoquer l'accès d'un utilisateur

**Temporaire :**
```
Désactiver le token → L'utilisateur ne peut plus se connecter
Réactiver plus tard si besoin
```

**Définitif :**
```
Supprimer le token → Accès révoqué définitivement
```

### 5. Rotation des tokens

```
1. Créer un nouveau token
2. Mettre à jour l'application avec le nouveau token
3. Vérifier que tout fonctionne
4. Désactiver l'ancien token
5. Attendre 24-48h (vérifier que plus d'utilisation)
6. Supprimer l'ancien token
```

---

## 🔒 Bonnes pratiques de sécurité

### Gestion des tokens

- ✅ **Un token par application/utilisateur**
- ✅ **Noms descriptifs** (ex: "Mobile App v2.1", "User Alice")
- ✅ **Rotation régulière** des tokens (tous les 3-6 mois)
- ✅ **Sauvegarde du token admin** dans un gestionnaire de mots de passe
- ❌ **Ne jamais commit** les tokens dans git
- ❌ **Ne jamais partager** par email/SMS non chiffré

### Rôles

- 🔴 **Admin** : À réserver aux personnes de confiance
  - Peut créer/supprimer des tokens
  - Accès au panneau d'administration
  - Peut recharger les lexiques (`/api/reload`)

- 🔵 **User** : Pour les utilisateurs standards
  - Peut utiliser l'API de traduction
  - Peut consulter les stats/lexique
  - Ne peut pas gérer les tokens

### Production

- ✅ Utiliser HTTPS en production
- ✅ Rate limiting activé (déjà en place)
- ✅ Logs des requêtes activés (déjà en place)
- ✅ Backups réguliers de `data/tokens.json`
- ✅ Monitoring des tokens actifs
- ⚠️ Ne jamais exposer `/api/admin/*` publiquement sans auth

---

## 🐛 Dépannage

### "Accès refusé. Vous devez être admin."

**Cause :** Vous êtes connecté avec un token user

**Solution :**
1. Déconnectez-vous
2. Reconnectez-vous avec un token admin

### "Token invalide"

**Cause :** Le token a été désactivé ou supprimé

**Solution :**
1. Vérifiez dans `data/tokens.json` si le token existe
2. Si désactivé : réactivez-le (avec un autre token admin)
3. Si supprimé : créez un nouveau token

### "Session expirée"

**Cause :** Le token a été révoqué pendant votre session

**Solution :**
1. Reconnectez-vous avec un token valide
2. Si c'était le seul token admin, recréez-en un (voir section "Token perdu")

### Interface admin ne se charge pas

**Cause :** Vous n'êtes pas connecté ou pas admin

**Solution :**
1. Allez sur `http://localhost:3000` (page principale)
2. Connectez-vous avec un token admin
3. Retournez sur `/admin.html` ou cliquez sur le bouton 🔐 Admin

### Le bouton Admin n'apparaît pas

**Cause :** Vous n'êtes pas admin

**Solution :**
- Seuls les tokens avec `role: "admin"` voient ce bouton
- Vérifiez votre rôle : `/api/validate`

---

## 📁 Fichiers importants

### data/tokens.json
**Emplacement :** `ConfluentTranslator/data/tokens.json`

**Format :**
```json
{
  "token-uuid-123": {
    "name": "Description",
    "role": "admin",
    "enabled": true,
    "createdAt": "2025-12-02T..."
  }
}
```

**⚠️ CRITIQUE :**
- Backupez ce fichier régulièrement
- Ne le commitez JAMAIS dans git
- Protégez-le (permissions 600 sur Linux)

### .gitignore
Vérifiez que `data/tokens.json` est bien ignoré :
```
data/tokens.json
.env
```

---

## 🔗 API Admin - Référence

### GET /api/admin/tokens
Liste tous les tokens

**Requiert :** Admin token

**Réponse :**
```json
[
  {
    "token": "abc-123...",
    "name": "Frontend",
    "role": "user",
    "enabled": true,
    "createdAt": "2025-12-02T..."
  }
]
```

### POST /api/admin/tokens
Crée un nouveau token

**Requiert :** Admin token

**Body :**
```json
{
  "name": "Description",
  "role": "user" // ou "admin"
}
```

### POST /api/admin/tokens/:token/disable
Désactive un token

**Requiert :** Admin token

### POST /api/admin/tokens/:token/enable
Active un token

**Requiert :** Admin token

### DELETE /api/admin/tokens/:token
Supprime un token

**Requiert :** Admin token

### GET /api/admin/stats
Statistiques globales

**Requiert :** Admin token

**Réponse :**
```json
{
  "totalTokens": 5,
  "activeTokens": 4,
  "adminTokens": 2,
  "totalRequests24h": 1234
}
```

---

## ✅ Checklist de déploiement

Avant de mettre en production :

- [ ] Token admin créé et sauvegardé en lieu sûr
- [ ] Backup de `data/tokens.json` configuré
- [ ] `data/tokens.json` dans `.gitignore`
- [ ] Variables d'environnement configurées (`.env`)
- [ ] HTTPS activé (certificat SSL)
- [ ] Rate limiting testé et actif
- [ ] Logs configurés et surveillés
- [ ] Tokens de production créés (pas de token "test" en prod)
- [ ] Documentation fournie aux utilisateurs
- [ ] Procédure de rotation des tokens établie

---

## 📞 Support

### Problèmes avec l'interface admin
1. Vérifiez les logs serveur (`npm start`)
2. Vérifiez la console navigateur (F12)
3. Testez les endpoints API manuellement (curl)

### Problèmes avec les tokens
1. Vérifiez `data/tokens.json`
2. Testez avec `/api/validate`
3. Recréez un token admin si nécessaire

---

**Interface d'administration ConfluentTranslator v1.0**
*Full Lockdown Security*
