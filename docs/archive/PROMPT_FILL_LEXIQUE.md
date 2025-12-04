# PROMPT SUCCESSEUR : Remplir les lexiques Confluent

## Ta mission

Tu dois remplir les fichiers JSON de lexique dans `ancien-confluent/lexique/` et `proto-confluent/lexique/` en traduisant les mots français listés dans `_mots_a_gerer` vers le Confluent.

## Structure du repo

```
confluent/
├── proto-confluent/
│   ├── lexique/           # JSON à remplir (proto-langue)
│   └── docs/              # Doc proto-confluent
├── ancien-confluent/
│   ├── lexique/           # JSON à remplir (langue actuelle du jeu)
│   └── docs/              # Doc langue complète
├── docs/
│   ├── archive/PLAN_LANGUE_REGARD_LIBRE.md  # DOC DE RÉFÉRENCE PRINCIPALE
│   ├── LEXIQUE_REFERENCE_CONFLUENCE.md      # Vocabulaire FR source
│   └── culture/           # Contexte civilisation
```

## Documents à lire AVANT de commencer

1. `docs/archive/PLAN_LANGUE_REGARD_LIBRE.md` - **CRITIQUE** : contient toutes les règles, racines, liaisons, grammaire
2. `ancien-confluent/lexique/_meta.json` - Liste des domaines à traiter
3. Un fichier lexique existant comme exemple de structure

## Structure JSON des fichiers lexique

Chaque fichier lexique a cette structure :

```json
{
  "_comment": "Description du domaine",
  "_mots_a_gerer": [
    "mot1", "mot2", "mot3"
  ],
  "dictionnaire": {
    "mot_francais": {
      "traductions": [
        {
          "confluent": "motconfluent",
          "type": "racine|racine_sacree|composition|verbe|nom_propre",
          "forme_liee": "mot-",
          "composition": "rac1-liaison-rac2",
          "sens_litteral": "Sens décomposé",
          "racines": ["racine1", "racine2"],
          "domaine": "categorie",
          "categorie": "sous-categorie",
          "note": "Note explicative"
        }
      ],
      "synonymes_fr": ["synonyme1", "synonyme2"]
    }
  }
}
```

### Champs selon le type

**Pour une racine simple :**
```json
{
  "confluent": "kari",
  "type": "racine",
  "forme_liee": "kar",
  "domaine": "materiau"
}
```

**Pour une racine sacrée (commence par voyelle) :**
```json
{
  "confluent": "aska",
  "type": "racine_sacree",
  "forme_liee": "ask",
  "domaine": "concept_fondateur"
}
```

**Pour une composition :**
```json
{
  "confluent": "Siliaska",
  "type": "composition",
  "composition": "sil-i-aska",
  "sens_litteral": "Porteurs du regard libre",
  "racines": ["sili", "aska"],
  "domaine": "peuple"
}
```

**Pour un verbe (CVCVC, 5 lettres, finit par consonne) :**
```json
{
  "confluent": "mirak",
  "type": "verbe",
  "racine": "mira",
  "forme_liee": "mir",
  "structure": "CVCVC",
  "domaine": "action"
}
```

## Règles linguistiques à respecter

### Racines (noms/concepts)
- Structure : **finit toujours par CV** (consonne + voyelle)
- 2-4 lettres
- ~80% commencent par consonne (standard)
- ~20% commencent par voyelle (sacrées - concepts anciens/fondamentaux)

### Verbes
- Structure : **CVCVC** (5 lettres exactement)
- Finit toujours par **consonne**
- Exemples : mirak, tekis, nekan, vosak

### Les 16 liaisons sacrées

Pour composer deux racines, on retire la voyelle finale de la première et on ajoute une liaison :

| Liaison | Sens |
|---------|------|
| **i** | Agent actif (qui fait) |
| **ie** | Agent récepteur (qui reçoit) |
| **ii** | Agent essentiel (qui EST) |
| **iu** | Agent potentiel (qui devient) |
| **u** | Appartenance (de) |
| **ui** | But (pour) |
| **a** | Avec |
| **aa** | Mélange, fusion |
| **ae** | Égal |
| **ao** | Domine |
| **o** | Tension, obstacle |
| **oa** | Résolu, accompli |
| **e** | Source, origine |
| **ei** | Centre, présent |
| **ea** | Direction, futur |
| **eo** | Totalité, éternel |

### Consonnes autorisées
b, k, l, m, n, p, s, t, v, z

### Voyelles autorisées
a, e, i, o, u

## Les 67 racines existantes

### 15 racines sacrées (voyelle initiale)
| Racine | Forme liée | Sens |
|--------|------------|------|
| aska | ask- | libre, liberté |
| aita | ait- | ancêtre, ancien |
| asa | as- | sacré, divin |
| apo | ap- | oiseau, vol |
| alu | al- | grue |
| aki | ak- | faucon |
| ura | ur- | eau, fluide |
| umi | um- | esprit, souffle |
| iko | ik- | un, unique |
| ita | it- | être, exister |
| ena | en- | origine, source |
| eka | ek- | tout, totalité |
| oki | ok- | épreuve, défi |
| ora | or- | aurore, aube |
| onu | on- | son, vibration |

### 52 racines standards (consonne initiale)
| Racine | Forme liée | Sens |
|--------|------------|------|
| zeru | zer- | ciel |
| toka | tok- | terre, sol |
| suki | suk- | feu, flamme |
| vena | ven- | air, vent |
| kari | kar- | pierre, roche |
| nura | nur- | rivière, courant |
| tasa | tas- | montagne |
| viku | vik- | forêt, arbre |
| luna | lun- | lune |
| sora | sor- | soleil, lumière |
| sili | sil- | œil, regard |
| kanu | kan- | main |
| voki | vok- | voix, parole |
| tiku | tik- | oreille, écoute |
| muka | muk- | visage |
| kori | kor- | cœur |
| sanu | san- | corps |
| peki | pek- | pied, base |
| keko | kek- | écho, résonance |
| mira | mir- | voir, observer |
| teki | tek- | aller, chemin |
| kita | kit- | donner |
| pasa | pas- | prendre |
| neka | nek- | faire, créer |
| vosa | vos- | dire, parler |
| seka | sek- | savoir, connaître |
| moki | mok- | apprendre |
| kisu | kis- | transmettre |
| zaki | zak- | garder, protéger |
| taka | tak- | porter |
| zana | zan- | chasser |
| kota | kot- | union, confluence |
| naki | nak- | enfant, descendant |
| tori | tor- | personne |
| vaku | vak- | ami, allié |
| zoka | zok- | ennemi |
| mitu | mit- | famille, clan |
| kasi | kas- | chef, guide |
| veri | ver- | vrai, vérité |
| tosa | tos- | bon, bien |
| mako | mak- | grand, vaste |
| pisu | pis- | petit, fin |
| nuvi | nuv- | nouveau, jeune |
| kiru | kir- | échanger |
| vasi | vas- | pont, lien |
| vuku | vuk- | profond, gouffre |
| nisa | nis- | humide |
| siku | sik- | cercle |
| vela | vel- | veille, vigile |
| savu | sav- | serment |
| talu | tal- | hall |
| kova | kov- | peinture, fresque |

### Racines démonstratives
| Racine | Forme liée | Sens |
|--------|------------|------|
| tisa | tis- | ici, proche |
| tova | tov- | là-bas, loin |

## Processus de travail

1. **Lis le fichier** `_mots_a_gerer` pour voir les mots à traduire
2. **Vérifie** si une racine existe déjà (utilise les 67 racines ci-dessus)
3. **Si oui** : utilise-la ou compose avec les liaisons
4. **Si non** : crée une nouvelle racine en respectant les règles phonétiques
5. **Remplis** le dictionnaire avec tous les champs appropriés
6. **Retire** le mot de `_mots_a_gerer` une fois traité

## Exemples de traductions

**Mot simple avec racine existante :**
```json
"pierre": {
  "traductions": [{
    "confluent": "kari",
    "type": "racine",
    "forme_liee": "kar",
    "domaine": "materiau"
  }],
  "synonymes_fr": ["roche"]
}
```

**Composition de deux racines :**
```json
"regard libre": {
  "traductions": [{
    "confluent": "siliaska",
    "type": "composition",
    "composition": "sil-i-aska",
    "sens_litteral": "Regard porteur de liberté",
    "racines": ["sili", "aska"],
    "domaine": "concept_fondateur"
  }]
}
```

**Nouvelle racine à créer :**
```json
"sel": {
  "traductions": [{
    "confluent": "salu",
    "type": "racine",
    "forme_liee": "sal",
    "domaine": "materiau",
    "note": "Nouvelle racine créée"
  }]
}
```

## Conventions importantes

- **Mix phonétique** : ~70% original, ~20% finnois-like, ~10% basque-like
- **Éviter** : sons trop elfiques (trop de L/R), sons anglo/latins (th, ph)
- **Ratio sacré** : ~20-25% de racines sacrées max
- **Tester** : vérifie que la nouvelle racine sonne bien en composition

## À ne PAS faire

- Ne pas inventer de nouvelles liaisons (16 existent, c'est fixe)
- Ne pas créer de racines qui violent la structure CV finale
- Ne pas créer de verbes qui ne font pas 5 lettres CVCVC
- Ne pas utiliser de consonnes hors de la liste (b, k, l, m, n, p, s, t, v, z)

## Commande pour tester

Après avoir rempli, vérifie que le JSON est valide :
```bash
cat ancien-confluent/lexique/XX-fichier.json | python -m json.tool
```

---

**Bonne chance ! La langue Confluent t'attend.**
