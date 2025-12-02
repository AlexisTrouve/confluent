# Structure du projet ConfluentTranslator

Ce document décrit l'organisation du projet après la réorganisation.

## Arborescence

```
ConfluentTranslator/
├── server.js                    # Point d'entrée principal (lance src/api/server.js)
├── package.json                 # Dépendances et scripts npm
├── .env / .env.example          # Configuration environnement
├── README.md                    # Documentation utilisateur
│
├── src/                         # Code source organisé
│   ├── api/                     # Serveur et routes HTTP
│   │   ├── server.js            # Serveur Express principal
│   │   └── adminRoutes.js       # Routes d'administration
│   ├── core/                    # Logique métier
│   │   ├── translation/         # Modules de traduction
│   │   │   ├── confluentToFrench.js  # Traduction Confluent → FR
│   │   │   ├── contextAnalyzer.js    # Analyse contextuelle
│   │   │   └── promptBuilder.js      # Construction des prompts LLM
│   │   ├── morphology/          # Morphologie et décomposition
│   │   │   ├── morphologicalDecomposer.js  # Décomposition morphologique
│   │   │   ├── radicalMatcher.js           # Recherche par radicaux
│   │   │   └── reverseIndexBuilder.js      # Construction d'index inversés
│   │   └── numbers/             # Traitement des nombres
│   │       ├── numberConverter.js       # Conversion FR → Confluent
│   │       └── numberPreprocessor.js    # Prétraitement des nombres
│   └── utils/                   # Utilitaires
│       ├── auth.js              # Authentification et tokens
│       ├── lexiqueLoader.js     # Chargement des lexiques
│       ├── logger.js            # Système de logs
│       └── rateLimiter.js       # Rate limiting
│
├── docs/                        # Documentation
│   ├── admin/                   # Documentation admin
│   │   ├── ADMIN_GUIDE.md
│   │   └── QUICKSTART_ADMIN.md
│   ├── security/                # Documentation sécurité
│   │   ├── README_SECURITY.md
│   │   ├── SECURITY_TEST.md
│   │   └── CHANGELOG_SECURITY.md
│   ├── dev/                     # Documentation développeur
│   │   ├── analysis/            # Analyses techniques
│   │   │   └── ANALYSE_MOTS_PROBLEMATIQUES.md
│   │   └── numbers/             # Documentation nombres
│   │       └── NUMBER_PREPROCESSING.md
│   └── changelog/               # Historique et résultats
│       ├── COMMIT_SUMMARY.md
│       ├── TESTS_SUMMARY.md
│       ├── TESTS_NOMBRES_RESULTAT.md
│       └── test-results-radical-system.md
│
├── tests/                       # Tests
│   ├── unit/                    # Tests unitaires (.js, .json, .txt)
│   ├── integration/             # Tests d'intégration
│   │   └── api/                 # Tests API (ex: testsAPI/)
│   └── scripts/                 # Scripts de test (.sh, .bat)
│
├── data/                        # Données du projet
│   ├── lexique.json             # Lexique principal
│   ├── tokens.json              # Tokens d'authentification
│   └── (autres fichiers JSON de lexique)
│
├── prompts/                     # Prompts système pour LLM
│   ├── proto-system.txt
│   └── ancien-system.txt
│
├── public/                      # Fichiers statiques
│   ├── index.html
│   ├── admin.html
│   └── (autres fichiers statiques)
│
├── logs/                        # Logs applicatifs
│   └── (fichiers de logs générés)
│
├── plans/                       # Plans et documentation de travail
│   └── (documents de planification)
│
└── node_modules/                # Dépendances npm (généré)
```

## Principes d'organisation

### src/ - Code source

Le dossier `src/` contient tout le code applicatif organisé par fonction :

- **api/** : Tout ce qui concerne le serveur HTTP et les routes
- **core/** : La logique métier, subdivisée par domaine
  - `translation/` : Traduction et analyse linguistique
  - `morphology/` : Analyse morphologique des mots
  - `numbers/` : Gestion spécifique des nombres
- **utils/** : Fonctions utilitaires transverses

### docs/ - Documentation

Documentation organisée par audience et type :

- **admin/** : Guides pour les administrateurs
- **security/** : Documentation sécurité
- **dev/** : Documentation technique pour développeurs
- **changelog/** : Historique des changements et résultats de tests

### tests/ - Tests

Tests organisés par type :

- **unit/** : Tests unitaires des modules individuels
- **integration/** : Tests d'intégration entre modules
- **scripts/** : Scripts shell/batch pour lancer les tests

## Imports et chemins

### Depuis src/api/ (server.js, adminRoutes.js)

```javascript
// Utilitaires
require('../utils/auth')
require('../utils/logger')
require('../utils/lexiqueLoader')
require('../utils/rateLimiter')

// Translation
require('../core/translation/contextAnalyzer')
require('../core/translation/promptBuilder')
require('../core/translation/confluentToFrench')

// Morphology
require('../core/morphology/reverseIndexBuilder')

// Chemins vers ressources
path.join(__dirname, '..', '..', 'public')
path.join(__dirname, '..', '..', 'prompts')
path.join(__dirname, '..', '..', 'data')
```

### Depuis src/core/translation/

```javascript
// Vers numbers
require('../numbers/numberConverter')
require('../numbers/numberPreprocessor')

// Vers morphology
require('../morphology/radicalMatcher')
require('../morphology/morphologicalDecomposer')
```

### Depuis src/core/morphology/ ou src/core/numbers/

```javascript
// Vers data
require('../../data/lexique.json')
```

## Démarrage

Le point d'entrée est `server.js` à la racine qui importe `src/api/server.js` :

```bash
node server.js
```

ou

```bash
npm start
```

## Migrations futures

Si nécessaire, cette structure permet facilement :

- D'ajouter de nouveaux modules dans `src/core/`
- De créer des sous-modules dans `src/api/` (ex: routes métier)
- D'ajouter des catégories de tests
- D'organiser la documentation par projets

## Avantages

- **Clarté** : Chaque fichier a sa place logique
- **Maintenabilité** : Structure modulaire et organisée
- **Scalabilité** : Facile d'ajouter de nouveaux modules
- **Découvrabilité** : On trouve rapidement ce qu'on cherche
- **Séparation des préoccupations** : Code / Docs / Tests séparés
