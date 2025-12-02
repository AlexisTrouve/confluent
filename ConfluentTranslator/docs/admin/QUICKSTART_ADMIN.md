# 🚀 Quick Start - Administration

Guide ultra-rapide pour démarrer avec l'interface d'administration.

---

## Étape 1 : Démarrer le serveur

```bash
cd ConfluentTranslator
npm start
```

**⚠️ IMPORTANT : Notez le token admin affiché dans les logs !**

---

## Étape 2 : Se connecter

1. Ouvrir `http://localhost:3000`
2. Coller le token admin dans le champ "API Key"
3. Cliquer "Se connecter"

---

## Étape 3 : Accéder à l'admin

1. Cliquer sur le bouton **🔐 Admin** (en haut à droite)
2. Ou aller directement sur `http://localhost:3000/admin.html`

---

## Étape 4 : Créer des tokens

### Pour un utilisateur standard

1. **Nom** : "User - Jean"
2. **Rôle** : User
3. Cliquer "Créer le token"
4. **COPIER LE TOKEN AFFICHÉ** (il ne sera plus affiché)
5. Envoyer le token à l'utilisateur

### Pour une application

1. **Nom** : "Frontend Production"
2. **Rôle** : User
3. Cliquer "Créer le token"
4. **COPIER LE TOKEN**
5. Ajouter dans les variables d'environnement de l'app

### Pour un autre admin

1. **Nom** : "Admin Backup"
2. **Rôle** : Admin
3. Cliquer "Créer le token"
4. **COPIER LE TOKEN**
5. Sauvegarder dans un gestionnaire de mots de passe

---

## Étape 5 : Gérer les tokens

### Désactiver temporairement
**Use case :** Bloquer un utilisateur temporairement
1. Trouver le token dans la liste
2. Cliquer "Désactiver"

### Supprimer définitivement
**Use case :** Révoquer l'accès définitivement
1. Trouver le token dans la liste
2. Cliquer "Supprimer" (rouge)
3. Confirmer

---

## 🔑 Où est mon token admin ?

### Logs du serveur
```
🔑 Admin token created: c32b04be-2e68-4e15-8362-xxxxx
⚠️  SAVE THIS TOKEN - It will not be shown again!
```

### Fichier tokens.json
```bash
# Windows
type data\tokens.json

# Linux/Mac
cat data/tokens.json
```

### Recréer un token admin (si perdu)
```bash
del data\tokens.json  # Windows
rm data/tokens.json   # Linux/Mac
npm start             # Redémarrer le serveur
```

---

## 📊 Interface admin - Vue d'ensemble

```
┌─────────────────────────────────────────────┐
│  🔐 Administration                          │
│  Gestion des tokens API                     │
└─────────────────────────────────────────────┘

┌─────────┬─────────┬─────────┬────────────┐
│ Total   │ Actifs  │ Admins  │ Req. (24h) │
│   5     │   4     │   2     │   1,234    │
└─────────┴─────────┴─────────┴────────────┘

┌─────────────────────────────────────────────┐
│  ➕ Créer un nouveau token                  │
│                                             │
│  Nom: [________________]                    │
│  Rôle: [User ▼]                             │
│  [Créer le token]                           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  📋 Tokens existants                        │
│                                             │
│  c32b04be-2e68-4e15-8362-xxxxx              │
│  🏷️ ADMIN  Nom: Admin Principal            │
│  📅 Créé: 02/12/2025                        │
│  [Désactiver] [Supprimer]                   │
│                                             │
│  a7f3c9d1-1234-5678-90ab-xxxxx              │
│  🏷️ USER  Nom: Frontend Prod               │
│  📅 Créé: 02/12/2025                        │
│  [Désactiver] [Supprimer]                   │
└─────────────────────────────────────────────┘
```

---

## ⚡ Commandes rapides

```bash
# Démarrer le serveur
cd ConfluentTranslator && npm start

# Extraire le token admin
cat data/tokens.json | grep -o '"[^"]*"' | head -1

# Créer un token user (API)
curl -X POST http://localhost:3000/api/admin/tokens \
  -H "x-api-key: VOTRE_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"name":"User Test","role":"user"}'

# Lister tous les tokens (API)
curl -H "x-api-key: VOTRE_TOKEN_ADMIN" \
  http://localhost:3000/api/admin/tokens
```

---

## ✅ Checklist

- [ ] Serveur démarré
- [ ] Token admin noté et sauvegardé
- [ ] Connecté à l'interface
- [ ] Accès au panneau admin
- [ ] Token user de test créé
- [ ] Documentation lue (`ADMIN_GUIDE.md`)

---

## 🎯 Prochaines étapes

1. **Lire la doc complète** : `ADMIN_GUIDE.md`
2. **Créer des tokens** pour vos applications/utilisateurs
3. **Configurer les backups** de `data/tokens.json`
4. **Mettre en place HTTPS** (production)
5. **Tester la sécurité** : `testsAPI/test-all.bat`

---

## 🆘 Besoin d'aide ?

- **Guide complet** : Voir `ADMIN_GUIDE.md`
- **Tests** : Voir `testsAPI/README.md`
- **Sécurité** : Voir `README_SECURITY.md`

---

**C'est tout ! En 5 étapes, vous maîtrisez l'administration de ConfluentTranslator.** 🎉
