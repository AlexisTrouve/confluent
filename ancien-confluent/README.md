# Ancien Confluent - Lexique

Ce dossier contient le lexique complet de la langue Confluent dans sa version "ancien".

## Structure

```
ancien-confluent/
├── lexique/                    # Fichiers JSON du lexique (31 catégories)
│   ├── 00-grammaire.json
│   ├── 01-racines-sacrees.json
│   ├── 02-racines-standards.json
│   └── ... (28 autres fichiers)
│
├── docs/                       # Documentation générée
│   └── LEXIQUE-COMPLET.md      # Lexique complet en Markdown (généré)
│
├── generer-lexique-complet.js  # Script de génération (Node.js)
└── generer-lexique-complet.bat # Script pour Windows
```

## Génération du lexique complet

Le lexique complet est généré automatiquement à partir des fichiers JSON.

### Sous Linux/Mac/WSL

```bash
node generer-lexique-complet.js
```

### Sous Windows

Double-cliquez sur `generer-lexique-complet.bat` ou exécutez :

```cmd
generer-lexique-complet.bat
```

### Résultat

Le script génère le fichier `docs/LEXIQUE-COMPLET.md` qui contient :
- Une table des matières cliquable
- 31 catégories organisées
- 835+ entrées de lexique
- Pour chaque entrée :
  - Le mot français
  - La traduction en Confluent
  - La forme liée (si applicable)
  - Le type (racine sacrée, racine standard, etc.)
  - Le domaine
  - Les notes
  - Les synonymes français

## Format des fichiers JSON

Chaque fichier JSON suit cette structure :

```json
{
  "_comment": "Description de la catégorie",
  "_mots_a_gerer": [],
  "dictionnaire": {
    "mot_francais": {
      "traductions": [
        {
          "confluent": "motsconfluent",
          "type": "racine_sacree",
          "forme_liee": "form",
          "domaine": "domaine_concept",
          "note": "Note explicative"
        }
      ],
      "synonymes_fr": ["synonyme1", "synonyme2"]
    }
  }
}
```

## Statistiques

- **31 catégories** de vocabulaire
- **835+ entrées** au total
- **19 racines sacrées** (commencent par une voyelle)
- **67 racines standards**

## Catégories disponibles

1. Grammaire et Règles
2. Racines Sacrées
3. Racines Standards
4. Castes
5. Lieux
6. Corps et Sens
7. Actions
8. Émotions
9. Nature et Éléments
10. Institutions
11. Animaux
12. Armes et Outils
13. Concepts Abstraits
14. Rituels
15. Géographie
16. Rôles et Titres
17. Communication
18. Temps
19. Couleurs
20. Santé et Dangers
21. Objets et Matériaux
22. Famille
23. Nombres
24. Nourriture
25. Habitat
26. Navigation
27. Architecture
28. Concepts Philosophiques
29. Étrangers
30. Actions Militaires
31. Vêtements et Apparence
