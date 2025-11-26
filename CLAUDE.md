# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

**Confluent** est un projet de création d'une langue construite (conlang) pour la Civilisation de la Confluence, une civilisation fictive du projet de jeu de rôle **civjdr**.

## État actuel

Le système linguistique de base est **validé et documenté** :
- 67 racines (15 sacrées, 52 standards)
- 16 liaisons sacrées
- 6 castes et 6 lieux nommés

## Documents de référence

- `docs/PLAN_LANGUE_REGARD_LIBRE.md` - Règles linguistiques complètes
- `docs/LEXIQUE_REFERENCE_CONFLUENCE.md` - Vocabulaire de la civilisation à traduire

## Règles linguistiques (résumé)

### Phonétique

**Consonnes (10):** b, k, l, m, n, p, s, t, v, z

**Voyelles actives (5):** a, e, i, o, u

**Voyelles réservées:** y, é, è (pour expansion future)

### Structure des racines

- Toute racine **finit par CV** (consonne + voyelle)
- **~80% standard** : commence par consonne (ex: sili, toka, vena)
- **~20% sacrée** : commence par voyelle (ex: aska, ura, umi) - concepts anciens/fondamentaux

### Système des 16 liaisons sacrées

Quand deux racines se combinent, la voyelle finale de la première est **remplacée** par une liaison :

| Base | Liaisons | Domaine |
|------|----------|---------|
| **I** | i, ie, ii, iu | Agentivité (qui fait, reçoit, est, devient) |
| **U** | u, ui | Appartenance (de, pour) - u = "no" japonais |
| **A** | a, aa, ae, ao | Relation (avec, mélange, égal, domine) |
| **O** | o, oa | Tension (obstacle, résolu/accompli) |
| **E** | e, ei, ea, eo | Dimension (source/passé, présent, futur, éternel) |

### Exemple de composition

```
sili (regard) + -i- (agent) + aska (libre)
→ sil- + i + aska = Siliaska
= "Les porteurs du regard libre"
```

## Vocabulaire validé

### Castes
| Français | Confluent |
|----------|-----------|
| Enfants des Échos | Nakukeko |
| Enfants du Courant | Nakuura |
| Ailes-Grises | Ariaska |
| Faucons Chasseurs | Akoazana |
| Passes-bien | Takitosa |
| Voix de l'Aurore | Oraumi |

### Lieux
| Français | Confluent |
|----------|-----------|
| La Confluence | Uraakota |
| Gouffre Humide | Vukuura |
| Antres des Échos | Kekutoka |
| Cercles de Vigile | Rikuvela |
| Halls des Serments | Talusavu |
| Grande Fresque | Ekakova |

### Peuple
**Siliaska** = "Les porteurs du regard libre"

## Prochaines étapes

1. Enrichir le lexique (verbes, concepts abstraits, émotions...)
2. Définir les formules rituelles
3. Créer le fichier de données JSON/YAML
4. Résoudre les questions ouvertes (pluriel, ordre des mots, négation...)

## Conventions de travail

- **Ratio sacré/standard** : garder ~20-25% de racines sacrées (V initial)
- **Mix phonétique** : ~70% créations originales, ~20% finnois-like, ~10% basque-like
- **Éviter** : sons trop elfiques (L/R liquides), sons anglo/latins (th, ph), trop japonais direct
- **Tester** : chaque nouvelle racine avec des compositions pour vérifier la sonorité

## Lien avec civjdr

Ce projet est un sous-projet de `../civjdr`. La langue reflète les valeurs de la civilisation : observation, transmission, mémoire, confluence/union.
