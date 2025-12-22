# Guide d'utilisation - Projet Confluent

Ce guide vous explique comment utiliser le projet Confluent, un système de langue construite pour la Civilisation de la Confluence.

## Qu'est-ce que le Confluent ?

Le Confluent est une **langue construite** (conlang) créée pour la Civilisation de la Confluence, une civilisation fictive du projet de jeu de rôle **civjdr**.

La langue reflète les valeurs profondes de cette civilisation :
- **L'observation** : "regarder avant d'agir"
- **La transmission** : le savoir partagé de génération en génération
- **La mémoire** : ne rien oublier des ancêtres et de leur sagesse
- **La confluence** : la force naît de la rencontre et du mélange

Le projet comprend deux composantes :
1. **Une langue complète** avec phonologie, morphologie, grammaire et lexique
2. **Un traducteur web** (ConfluentTranslator) pour traduire entre français et confluent via LLM

## Installation rapide

### Prérequis

- **Node.js** version 14 ou supérieure
- Accès à une API LLM (Anthropic Claude ou OpenAI)

### Étapes d'installation

1. **Cloner le dépôt**
```bash
git clone <url-du-repo>
cd confluent
```

2. **Installer les dépendances**
```bash
cd ConfluentTranslator
npm install
```

3. **Configurer les clés API**

Créer un fichier `.env` à la racine du projet (parent de ConfluentTranslator) :

```env
ANTHROPIC_API_KEY=votre_cle_anthropic
OPENAI_API_KEY=votre_cle_openai
```

4. **Lancer le serveur**
```bash
npm start
```

Le serveur démarre sur http://localhost:3000

## Utiliser l'interface web

### Accès

Ouvrir http://localhost:3000 dans votre navigateur.

### Configuration

1. **Choisir le provider LLM** : Anthropic ou OpenAI
2. **Sélectionner le modèle** : selon le provider choisi
3. **Choisir la variante de langue** :
   - **Proto-Confluent** : langue primitive des premiers clans (phonologie réduite, syntaxe simple)
   - **Ancien Confluent** : langue unifiée avec liaisons sacrées et système verbal complet

### Traduire

1. Entrer votre texte français dans le champ de texte
2. Cliquer sur "Traduire"
3. Le résultat apparaît avec plusieurs niveaux d'analyse :
   - **Layer 1** : Traduction directe
   - **Layer 2** : Analyse contextuelle
   - **Layer 3** : Traduction finale avec contexte

Votre configuration est sauvegardée automatiquement dans le navigateur.

## Utiliser l'API

### Exemple simple de traduction

```bash
curl -X POST http://localhost:3000/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Bonjour, je suis un voyageur",
    "variant": "ancien",
    "provider": "anthropic",
    "model": "claude-3-5-sonnet-20241022"
  }'
```

### Endpoints principaux

- **POST /translate** - Traduction FR → Confluent
- **POST /api/translate/conf2fr** - Traduction Confluent → FR
- **GET /api/search** - Recherche dans le lexique
- **POST /api/analyze/coverage** - Analyse de couverture lexicale

Pour plus de détails sur l'API, consultez [docs/API.md](../ConfluentTranslator/docs/API.md) ou CLAUDE.md.

## Explorer la langue

### Documentation linguistique complète

La documentation de l'Ancien Confluent se trouve dans `ancien-confluent/docs/` :

1. **01-PHONOLOGIE.md** - Sons, consonnes, voyelles
2. **02-MORPHOLOGIE.md** - Racines et liaisons sacrées
3. **03-GRAMMAIRE.md** - Verbes, conjugaisons, particules
4. **04-SYNTAXE.md** - Construction de phrases, négation, questions
5. **05-VOCABULAIRE.md** - Lexique complet validé
6. **06-ADJECTIFS.md** - Système adjectival

### Consulter le lexique

Le lexique JSON complet est disponible dans :
- `ancien-confluent/lexique/lexique-ancien-complet.json`
- `proto-confluent/lexique/lexique-proto-complet.json`

Vous pouvez également consulter :
- `docs/LEXIQUE_REFERENCE_CONFLUENCE.md` - Vocabulaire de référence
- `ancien-confluent/docs/06-LEXIQUE-COMPLET.md` - Version markdown

### Formules rituelles

Consultez `docs/FORMULES_RITUELLES.md` pour les expressions sacrées et formules de la civilisation.

### Contexte culturel

Pour comprendre la civilisation et ses valeurs, lisez `docs/culture/CONTEXTE_CIVILISATION.md`.

## Contribuer

### Structure du projet

```
confluent/
├── ancien-confluent/          # Langue unifiée
│   ├── docs/                  # Documentation complète
│   └── lexique/               # Fichiers JSON
├── proto-confluent/           # Langue primitive
│   ├── docs/
│   └── lexique/
├── ConfluentTranslator/       # Serveur de traduction
│   ├── src/                   # Code source organisé
│   ├── public/                # Interface web
│   └── prompts/               # Prompts système LLM
├── docs/                      # Documentation générale
│   ├── culture/               # Contexte civilisationnel
│   └── archive/
└── data/                      # Données partagées
```

### Ajouter du vocabulaire

Pour enrichir le lexique :

1. **Éditer le fichier JSON** approprié :
   - `ancien-confluent/lexique/lexique-ancien-complet.json`
   - `proto-confluent/lexique/lexique-proto-complet.json`

2. **Respecter la structure** :
```json
{
  "mot_francais": "traduction_confluent"
}
```

3. **Suivre les règles linguistiques** :
   - Toute racine finit par CV (consonne + voyelle)
   - ~80% racines standard (commence par consonne)
   - ~20% racines sacrées (commence par voyelle)
   - Pas de majuscules en confluent
   - Consonnes autorisées : b, k, l, m, n, p, s, t, v, z
   - Voyelles : a, e, i, o, u

4. **Régénérer le lexique complet** (si applicable) :
```bash
cd ancien-confluent
node generer-lexique-complet.js
```

5. **Tester** :
```bash
cd ConfluentTranslator
npm start
# Puis tester la traduction via l'interface
```

### Tests

Pour lancer les tests :
```bash
cd ConfluentTranslator/tests
# Voir scripts disponibles
```

## Ressources utiles

### Documentation technique
- **CLAUDE.md** - Guide pour Claude Code
- **ConfluentTranslator/STRUCTURE.md** - Architecture du traducteur
- **ConfluentTranslator/README.md** - Documentation du serveur

### Documentation linguistique
- **docs/SYSTEM_PROMPT_LLM.md** - Prompt système complet pour LLM
- **docs/SYSTEME_NUMERIQUE_BASE12.md** - Système de nombres
- **docs/EMOTIONS_METAPHORES.md** - Vocabulaire émotionnel

### Hébergement
- **HEBERGEMENT.md** - Guide d'hébergement complet

## Support et questions

Pour toute question ou problème :
1. Consulter la documentation dans `docs/` et `ancien-confluent/docs/`
2. Vérifier les issues existantes
3. Créer une nouvelle issue avec tag approprié

## Philosophie du projet

Le Confluent n'est pas qu'une langue : c'est un **artefact multi-générationnel**, comme la Grande Fresque de la civilisation. Chaque contribution ajoute une couche de sens, enrichit le système, et transmet le savoir.

Comme le disent les Siliaska : **"Observer, apprendre, transmettre"**.
