# Installation Gitea - Résumé

**Date:** 2025-12-04
**Version:** Gitea 1.22.6
**IP VPS:** 57.131.33.10

---

## ✅ Installation Complétée

### Composants installés :
- ✅ PostgreSQL 17
- ✅ Gitea 1.22.6
- ✅ Nginx (reverse proxy)
- ✅ Certbot (Let's Encrypt)

---

## 📊 Configuration

### Base de données PostgreSQL
- **Database:** `giteadb`
- **User:** `gitea`
- **Password:** `gitea_secure_password_2025`

### Gitea
- **User système:** `git`
- **Port interne:** 8080
- **Dossier data:** `/var/lib/gitea/`
- **Config:** `/etc/gitea/app.ini`
- **Repos:** `/home/git/gitea-repositories/`

### Nginx
- **Config:** `/etc/nginx/sites-available/gitea`
- **Port:** 80 (HTTP) → sera 443 (HTTPS après SSL)
- **Domaine:** `git.alexistrouve.pro`

---

## 🔧 Prochaines étapes (MANUELLES)

### 1. Configuration DNS ⚠️ **ACTION REQUISE**

Créer un enregistrement DNS A pointant vers le VPS :

```
Type: A
Nom: git
Domaine: alexistrouve.pro
Valeur: 57.131.33.10
TTL: 3600 (ou auto)
```

**Résultat:** `git.alexistrouve.pro` → `57.131.33.10`

**Comment vérifier:**
```bash
dig git.alexistrouve.pro
# ou
nslookup git.alexistrouve.pro
```

---

### 2. Générer le certificat SSL (après DNS)

Une fois le DNS configuré et propagé (5-30 minutes) :

```bash
sudo certbot --nginx -d git.alexistrouve.pro
```

Certbot va :
- Vérifier que le domaine pointe bien vers ce serveur
- Générer un certificat Let's Encrypt
- Modifier automatiquement la config nginx
- Activer HTTPS sur le port 443

---

### 3. Finaliser l'installation Gitea

Accéder à l'interface web :

**Sans SSL (temporaire):**
```
http://57.131.33.10:8080
```

**Avec DNS + SSL (recommandé):**
```
https://git.alexistrouve.pro
```

#### Configuration initiale via l'interface :

1. **Database Settings** (pré-rempli dans app.ini) :
   - Type: PostgreSQL
   - Host: 127.0.0.1:5432
   - Database: `giteadb`
   - Username: `gitea`
   - Password: `gitea_secure_password_2025`

2. **General Settings** :
   - Site Title: `Git Confluent` (ou votre choix)
   - Repository Root Path: `/home/git/gitea-repositories`
   - Git LFS Root Path: `/var/lib/gitea/data/lfs`
   - Run As Username: `git`

3. **Server and Third-Party Settings** :
   - SSH Server Domain: `git.alexistrouve.pro`
   - SSH Port: `22`
   - Gitea HTTP Listen Port: `8080`
   - Gitea Base URL: `https://git.alexistrouve.pro/`
   - Log Path: `/var/lib/gitea/log`

4. **Administrator Account** :
   - Créer un compte admin
   - Username: `admin` (ou votre choix)
   - Email: `alexistrouve.pro@gmail.com`
   - Password: (choisir un mot de passe fort)

5. Cliquer sur **Install Gitea**

---

## 🔄 Commandes utiles

### Gérer Gitea
```bash
# Status
sudo systemctl status gitea

# Démarrer
sudo systemctl start gitea

# Arrêter
sudo systemctl stop gitea

# Redémarrer
sudo systemctl restart gitea

# Logs
sudo journalctl -u gitea -f
```

### Gérer Nginx
```bash
# Tester config
sudo nginx -t

# Recharger
sudo systemctl reload nginx

# Redémarrer
sudo systemctl restart nginx
```

### Gérer PostgreSQL
```bash
# Se connecter
sudo -u postgres psql

# Lister bases
sudo -u postgres psql -c "\l"

# Accéder à la base Gitea
sudo -u postgres psql giteadb
```

### Certificat SSL
```bash
# Renouveler manuellement
sudo certbot renew

# Tester le renouvellement (dry-run)
sudo certbot renew --dry-run

# Lister certificats
sudo certbot certificates
```

---

## 📁 Fichiers importants

```
/etc/gitea/app.ini                  # Configuration Gitea
/var/lib/gitea/                     # Données Gitea
/home/git/gitea-repositories/       # Repos Git
/etc/nginx/sites-available/gitea    # Config nginx
/etc/systemd/system/gitea.service   # Service systemd
```

---

## 🔐 Sécurité

### Changer le mot de passe PostgreSQL

```bash
sudo -u postgres psql
ALTER USER gitea WITH PASSWORD 'nouveau_mot_de_passe_fort';
\q
```

Puis mettre à jour `/etc/gitea/app.ini` :
```ini
[database]
PASSWD = nouveau_mot_de_passe_fort
```

Redémarrer Gitea :
```bash
sudo systemctl restart gitea
```

### Firewall (si ufw activé)

```bash
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 22/tcp    # SSH (déjà ouvert normalement)
sudo ufw reload
```

---

## 🚀 Migration depuis Bitbucket

Une fois Gitea configuré, pour migrer un repo :

1. Dans Gitea : **+ → New Migration → Bitbucket**
2. Ou en CLI :
```bash
cd /home/git/gitea-repositories/votre-user/
git clone --mirror https://bitbucket.org/AlexisTrouve/confluent.git
cd confluent.git
git push --mirror git@git.alexistrouve.pro:votre-user/confluent.git
```

---

## 📞 Support

- Documentation Gitea : https://docs.gitea.com
- Let's Encrypt : https://letsencrypt.org/docs/

---

**Installation effectuée par Claude Code le 2025-12-04**

🤖 Generated with [Claude Code](https://claude.com/claude-code)
