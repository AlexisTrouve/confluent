# ConfluentTranslator

Traducteur Français vers Proto-Confluent et Ancien Confluent utilisant des LLMs.

## Installation

```bash
cd ConfluentTranslator
npm install
```

## Configuration

Le fichier `.env` doit être présent à la racine du projet parent (`../`) avec :

```env
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
```

## Lancement

```bash
npm start
```

Interface accessible sur : http://localhost:3000

## Utilisation

1. **Configurer le provider** : Choisir entre Anthropic ou OpenAI
2. **Choisir le modèle** : Selon le provider sélectionné
3. **Sélectionner la langue cible** : Proto-Confluent ou Ancien Confluent
4. **Entrer le texte français** et cliquer sur "Traduire"

La configuration est sauvegardée automatiquement dans le navigateur.

## Structure

```
ConfluentTranslator/
├── server.js              # Serveur Express + API
├── package.json
├── public/
│   └── index.html         # Interface web
└── prompts/
    ├── proto-system.txt   # Prompt système Proto-Confluent
    └── ancien-system.txt  # Prompt système Ancien Confluent
```

## Langues supportées

### Proto-Confluent
- Langue primitive des premiers clans
- Phonologie réduite : 4 voyelles, 8 consonnes
- Syntaxe SOV simple
- Pas de fusion, mots isolés

### Ancien Confluent
- Langue unifiée de la civilisation
- Phonologie complète : 5 voyelles, 10 consonnes
- Liaisons sacrées (16 types)
- Système verbal et temporel complet
