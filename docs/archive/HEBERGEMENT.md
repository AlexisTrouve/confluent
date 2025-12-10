# Hébergement ConfluentTranslator - Plan d'action

## Décision : Scaleway Start-2-S-SATA

**Offre choisie** : Serveur dédié Scaleway Start-2-S-SATA
**Prix** : 4.99€/mois
**Provider** : Scaleway (français, datacenter EU)

### Spécifications
- **CPU** : Intel C2350 (Avoton) - 2 cores / 2 threads @ 1.7 GHz
- **RAM** : 4 GB DDR3 (dédiée, non partagée)
- **Stockage** : 1 TB HDD SATA
- **Réseau** : Up to 250 Mbps
- **Type** : Bare-metal (hardware physique dédié)

### Pourquoi ce choix ?

#### Avantages
✅ **Hardware dédié** : Pas d'overselling, performance stable et prévisible
✅ **Multi-projets** : Peut héberger TOUS les projets du dossier parent
✅ **Stockage massif** : 1 TB pour données volumineuses, backups, Git LFS
✅ **RAM suffisante** : 4 GB pour faire tourner 5-7 services simultanés
✅ **Prix raisonnable** : 4.99€/mois pour un dédié, c'est excellent
✅ **Centralisation** : Tout au même endroit vs 3-4 VPS séparés à gérer
✅ **Gitea possible** : Enfin un Git privé avec les données volumineuses !

#### vs Alternatives considérées

| Option | Prix | RAM | Disque | Verdict |
|--------|------|-----|--------|---------|
| Railway.app | 5$/mois | Variable | Éphémère | ❌ Pas de persistance facile |
| Render.com | 7$/mois | Variable | Éphémère | ❌ Plus cher, pas adapté |
| VPS Hizakura | 0.83€/mois | 1GB | 15GB | ✅ OK pour 1 projet seul |
| VPS Netcup | 1€/mois | 512MB | 10GB | ✅ OK pour 1 projet seul |
| VPS RackNerd | 0.80$/mois | 768MB | 15GB | ✅ OK pour 1 projet seul |
| Hetzner VPS | 2.49€/mois | 2GB | 20GB | ✅ Bon mais limité multi-projets |
| **Scaleway Dédié** | **4.99€/mois** | **4GB** | **1TB** | **✅ Meilleur pour multi-projets** |

## Architecture prévue

### Projets à héberger

```
/opt/
├── gitea/                      # Git server privé (port 3000)
│   └── data/
│       ├── repositories/       # Repos Git
│       └── lfs/               # Git LFS (gros fichiers)
│
├── data/                       # Données volumineuses (non-Git)
│   ├── confluent/             # Lexiques, données linguistiques
│   ├── chinese-class/         # Assets, datasets
│   ├── seo-generator/         # Templates, caches
│   ├── civjdr/                # Assets de jeu
│   └── backups/               # Backups automatiques
│
├── apps/                       # Applications déployées
│   ├── confluent-translator/  # Port 3001
│   ├── chinese-class/         # Port 3002
│   ├── seo-generator/         # Port 3003
│   └── civjdr/                # Port 3004
│
├── databases/
│   ├── postgres/              # PostgreSQL centralisée
│   └── redis/                 # Cache & sessions
│
├── nginx/                      # Reverse proxy
│   ├── nginx.conf
│   └── ssl/                   # Certificats Let's Encrypt
│
└── docker-compose.yml         # Orchestration complète
```

### Services Docker prévus

| Service | Port | RAM allouée | Rôle |
|---------|------|-------------|------|
| **Gitea** | 3000 | 512 MB | Git privé + LFS |
| **PostgreSQL** | 5432 | 512 MB | Base de données centralisée |
| **Redis** | 6379 | 128 MB | Cache & sessions |
| **ConfluentTranslator** | 3001 | 512 MB | API de traduction |
| **ChineseClass** | 3002 | 256 MB | App apprentissage chinois |
| **SEOGenerator** | 3003 | 256 MB | Serveur génération SEO |
| **CivJDR** | 3004 | 256 MB | Backend jeu de rôle |
| **Nginx** | 80/443 | 128 MB | Reverse proxy + SSL |
| **Portainer** | 9000 | 128 MB | Interface Docker (optionnel) |
| **Système** | - | ~500 MB | Ubuntu/Debian base |
| **TOTAL** | - | **~3.2 GB** | Reste 800 MB de marge |

### Domaines/Sous-domaines (via Nginx)

```
git.votredomaine.fr       → Gitea (port 3000)
confluent.votredomaine.fr → ConfluentTranslator (port 3001)
chinese.votredomaine.fr   → ChineseClass (port 3002)
seo.votredomaine.fr       → SEOGenerator (port 3003)
civjdr.votredomaine.fr    → CivJDR (port 3004)
portainer.votredomaine.fr → Portainer (port 9000)
```

## Avantages stratégiques

### 1. Fini les .gitignore de l'enfer

**Avant** (GitHub/Bitbucket avec limites) :
```gitignore
# .gitignore horrible actuel
node_modules/
data/
*.json              # Lexiques trop volumineux
lexiques/
datasets/
models/
uploads/
*.db
backups/
logs/
assets/
```

**Après** (Gitea + stockage 1TB) :
```gitignore
# .gitignore minimaliste
node_modules/
.env
```

Tout le reste → **dans Git avec LFS** ou **dans /opt/data/** monté en volume

### 2. Git LFS pour gros fichiers

- Lexiques JSON volumineux : ✅ Dans Git avec LFS
- Datasets ML/training : ✅ Dans Git avec LFS
- Assets (images, vidéos) : ✅ Dans Git avec LFS ou /opt/data/
- Backups de DB : ✅ Dans /opt/data/backups/

### 3. Backups automatiques

Avec 1 TB, possibilité de :
- Backup quotidien de toutes les DBs
- Backup hebdomadaire complet (repos + data)
- Rotation sur 30 jours d'historique
- Export vers stockage externe (Scaleway Object Storage, S3, etc.)

### 4. Centralisation & simplicité

Au lieu de gérer :
- ❌ 1 compte Railway pour ConfluentTranslator
- ❌ 1 VPS pour ChineseClass
- ❌ 1 autre VPS pour SEOGenerator
- ❌ GitHub pour le code (avec limites)
- ❌ Dropbox/Drive pour les données

Vous avez :
- ✅ 1 serveur Scaleway pour TOUT
- ✅ 1 Gitea pour tous les repos + données
- ✅ 1 point d'administration (Portainer)
- ✅ 1 facture de 4.99€/mois

## Stack technique

### OS & Base
- **Ubuntu 22.04 LTS** ou **Debian 12**
- **Docker** + **Docker Compose** (orchestration)
- **Nginx** (reverse proxy + SSL)
- **Let's Encrypt** (certificats HTTPS gratuits)

### Services infrastructure
- **Gitea** (Git server privé, alternative légère à GitLab)
- **PostgreSQL 15** (DB centralisée pour toutes les apps)
- **Redis 7** (cache, sessions, queues)
- **Portainer** (interface web pour gérer Docker)

### Monitoring (optionnel futur)
- **Prometheus** + **Grafana** (métriques & dashboards)
- **Loki** (logs centralisés)
- **Uptime Kuma** (monitoring uptime)

## Estimation de performance

### ConfluentTranslator
- **RAM utilisée** : ~100-200 MB au repos
- **CPU** : Quasi 0% sauf pendant appels LLM (quelques secondes)
- **Disque** : ~500 MB (code + node_modules + lexiques)
- **Verdict** : ✅ Largement suffisant

### Tous les projets combinés
- **RAM totale** : ~2.5-3 GB utilisée / 4 GB disponibles
- **CPU** : ~10-20% moyen (pics à 50-70% lors de requêtes)
- **Disque** : ~50-100 GB utilisés / 1 TB disponibles
- **Verdict** : ✅ Très confortable

### Scalabilité
- Peut gérer **100-500 requêtes/jour** par service sans problème
- Peut monter à **1000-2000 req/jour** avec optimisation
- Au-delà : besoin d'upgrade vers serveur plus puissant

## Coûts réels

### Scaleway
- **Serveur** : 4.99€/mois
- **Domaine** (optionnel) : ~10-15€/an (ex: .fr, .com)
- **Backup externe** (optionnel) : ~1-2€/mois (Scaleway Object Storage 100GB)
- **Total** : ~5-7€/mois

### APIs externes (facturées séparément)
- **Anthropic Claude** : Selon usage (~0.015$/1K tokens)
- **OpenAI GPT** : Selon usage (~0.03$/1K tokens)

Pour 100 traductions/jour de textes moyens (~500 tokens) :
- Coût LLM : ~10-20$/mois
- **Total global** : ~25-30€/mois (serveur + LLM)

## Points d'attention

### ⚠️ Limitations du hardware

#### CPU ancien (Intel Avoton 2013)
- ❌ Pas adapté pour : Compilation lourde, calcul intensif, ML training
- ✅ Parfait pour : Services web, APIs, Node.js, Python, DBs légères

#### HDD vs SSD
- ❌ I/O plus lent qu'un SSD NVMe moderne
- ✅ Suffisant pour : Serveurs web, stockage data, Git repos
- ⚠️ Pour DB intensives : Utiliser Redis pour caching

#### Bande passante 250 Mbps
- ✅ Largement suffisant pour usage perso/PME
- ⚠️ Limité pour : Streaming vidéo HD, téléchargements massifs

### 🔒 Sécurité à prévoir

- **Firewall** : UFW configuré (fermer tout sauf 80, 443, 22, 3000)
- **SSH** : Désactiver password auth, utiliser clés SSH seulement
- **Fail2ban** : Bloquer brute-force SSH/HTTP
- **HTTPS** : Obligatoire sur tous les services (Let's Encrypt)
- **Secrets** : Variables d'environnement, pas de hardcode
- **Backups** : Automatisés et testés régulièrement

### 📊 Monitoring recommandé

- **Disk usage** : Surveiller le remplissage du 1TB
- **RAM** : Alertes si > 90% utilisée
- **CPU** : Identifier les process gourmands
- **Uptime** : Monitoring externe (UptimeRobot gratuit)

## Plan de migration

### Phase 1 : Setup serveur (Jour 1)
1. Commander Scaleway Start-2-S-SATA
2. Installer Ubuntu 22.04 LTS
3. Setup Docker + Docker Compose
4. Configurer firewall (UFW)
5. Setup SSH avec clés (désactiver password)

### Phase 2 : Infrastructure (Jour 1-2)
1. Déployer PostgreSQL + Redis
2. Déployer Nginx avec config basique
3. Déployer Gitea
4. Configurer domaine(s) + DNS
5. Setup Let's Encrypt (certbot)

### Phase 3 : Migration ConfluentTranslator (Jour 2-3)
1. Créer Dockerfile pour ConfluentTranslator
2. Pusher sur Gitea
3. Déployer via docker-compose
4. Migrer data/lexique.json vers /opt/data/
5. Tester traductions
6. Configurer nginx reverse proxy

### Phase 4 : Autres projets (Jour 3-7)
1. Migrer ChineseClass
2. Migrer SEOGenerator
3. Migrer CivJDR
4. Tester chaque service

### Phase 5 : Finalisation (Jour 7+)
1. Setup backups automatiques
2. Déployer Portainer
3. Documentation serveur
4. Monitoring basique
5. Tests de charge

## Ressources & Liens

### Scaleway
- **Console** : https://console.scaleway.com/
- **Docs Start** : https://www.scaleway.com/en/dedibox/start/

### Gitea
- **Docs** : https://docs.gitea.io/
- **Git LFS Guide** : https://docs.gitea.io/en-us/git-lfs-support/

### Docker
- **Docker Compose Docs** : https://docs.docker.com/compose/
- **Best practices** : https://docs.docker.com/develop/dev-best-practices/

### Nginx
- **Reverse proxy guide** : https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/
- **Let's Encrypt** : https://certbot.eff.org/

### Communauté VPS
- **LowEndBox** : https://lowendbox.com/ (deals VPS)
- **LowEndTalk** : https://lowendtalk.com/ (forum communautaire)

## Alternatives futures

Si le serveur devient insuffisant :

### Upgrade Scaleway
- **Start-2-L-SSD** : 8.99€/mois (4GB RAM, 2x250GB SSD RAID)
- **Pro-1-S-SSD** : 13.99€/mois (8GB RAM, 2x2TB HDD RAID)

### Migration vers cloud
- **Hetzner Dedicated** : 39€/mois (Ryzen 5, 64GB RAM, 2x NVMe)
- **Contabo Dedicated** : 50€/mois (specs similaires)

### Scaling horizontal
- Séparer Gitea sur serveur dédié
- Apps sur Kubernetes (k3s sur Hetzner)
- DB managée (Scaleway Managed PostgreSQL)

## Conclusion

Le **Scaleway Start-2-S-SATA à 4.99€/mois** est le choix optimal pour :

✅ **Centraliser** tous vos projets perso
✅ **Héberger** un Git privé avec données volumineuses
✅ **Éliminer** les .gitignore cauchemars
✅ **Performance** stable et prévisible (hardware dédié)
✅ **Évolutivité** : Place pour 5-7 projets simultanés
✅ **Prix** : Excellent rapport qualité/prix (vs 3-4 VPS séparés)

**Prochaine étape** : Commander le serveur et commencer la Phase 1 du plan de migration.

---

**Document créé le** : 2025-12-03
**Auteur** : Claude Code
**Statut** : Plan validé, prêt pour mise en œuvre
