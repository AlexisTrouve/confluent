# Syntaxe du Confluent

Ce document décrit la structure des phrases, la négation et les questions.

---

## Ordre des mots : SOV

Le Confluent utilise l'ordre **Sujet-Objet-Verbe** :

```
[CIRCONSTANTS] [SUJET] [OBJET] [NÉGATION] [VERBE] [CONJUGATEUR] [MODE] [QUESTION]
```

Le verbe est toujours en fin de proposition, suivi de son conjugateur.

---

## Structure de base

### Phrase simple

```
Va tori vo sili mirak u
[SUJET] personne [OBJET] regard observer [PRÉSENT]
"La personne observe le regard"
```

### Phrase avec bénéficiaire

```
Va aita ni naki vo seka kisun at
[SUJET] ancêtre [POUR] enfant [OBJET] savoir transmettre [PASSÉ]
"L'ancêtre a transmis le savoir pour l'enfant"
```

### Phrase avec mouvement

```
Ve ura vi toka tekis en
[DEPUIS] eau [VERS] terre aller [FUTUR]
"(Il) ira depuis l'eau vers la terre"
```

### Phrase avec lieu

```
No talu va kasi vosak u
[DANS] hall [SUJET] chef parler [PRÉSENT]
"Dans le hall, le chef parle"
```

### Phrase avec instrument

```
Va naki vu kari vo kova nekan at
[SUJET] enfant [AVEC] pierre [OBJET] peinture faire [PASSÉ]
"L'enfant a fait la peinture avec la pierre"
```

---

## Négation

Les particules de négation se placent **avant le verbe**. Elles forment une famille basée sur **zo-**.

| Particule | Structure | Sens |
|-----------|-----------|------|
| **zo** | CV | ne...pas (négation neutre) |
| **zom** | CVC | jamais (négation éternelle) |
| **zob** | CVC | interdit / tabou |
| **zoe** | CVC | pas vraiment (négation douce) |

### Exemples de négation

```
Va tori vo sili zo mirak u
"La personne n'observe pas le regard"

Va tori vo sili zom mirak u
"La personne n'observe jamais le regard"

Va tori vo sili zob mirak u
"Il est interdit d'observer le regard"

Va tori vo sili zoe mirak u
"La personne n'observe pas vraiment le regard"
```

---

## Questions

### Question fermée (oui/non)

La particule **ka** se place en **fin de phrase** (après tout le reste).

```
Va tori vo sili mirak u ka
"Est-ce que la personne observe le regard ?"
```

### Questions ouvertes

Les mots interrogatifs **remplacent** le mot inconnu dans la phrase.

| Particule | Sens |
|-----------|------|
| **ki** | qui ? |
| **ke** | quoi ? |
| **ko** | où ? |
| **ku** | quand ? |

### Exemples de questions ouvertes

```
Va ki vo sili mirak u
"Qui observe le regard ?"

Va tori vo ke mirak u
"La personne observe quoi ?"

No ko va tori tekis en
"Où la personne ira ?"

Ku va tori tekis at
"Quand la personne est-elle allée ?"
```

**Note :** Une seule question par phrase (pas de cumul ki, ke, ko, ku).

---

## Cumul des modes

On peut cumuler négation + mode. Structure de fin de phrase :

```
[NÉGATION] [VERBE] [CONJUGATEUR] [MODE]
```

### Exemples de cumuls

```
Va tori vo asa zob mirak u ul
"La personne ne peut pas observer le sacré (c'est interdit)"

Va naki vo seka zo sekam en es
"L'enfant veut ne pas connaître le savoir (dans le futur)"

Va oraumi vo veri zom kisun ait ul
"Les Voix de l'Aurore n'ont jamais pu transmettre la vérité (ancestral)"
```

---

## Phrases complexes

### Avec lieu, pluriel, passé ancestral

```
No vukuura va aita su ni naki su vo seka su kisun ait
[DANS] Gouffre.Humide [SUJET] ancêtre [PL] [POUR] enfant [PL] [OBJET] savoir [PL] transmettre [PASSÉ.ANCESTRAL]
"Dans le Gouffre Humide, les ancêtres ont transmis les savoirs pour les enfants"
```

### Avec mouvement, bénéficiaire, souhait

```
Ve kekutoka vi uraakota ni aliaska va nakukeko vo kari su takan es
[DEPUIS] Antres.Échos [VERS] Confluence [POUR] Ailes-Grises [SUJET] Enfants.Échos [OBJET] pierre [PL] porter [SOUHAIT]
"Les Enfants des Échos veulent porter les pierres depuis les Antres vers la Confluence pour les Ailes-Grises"
```

### Cyclique, pluriel, évidentiel

```
Ve ora vi luna va oraumi su vo umi su mirak eon uv
[DEPUIS] aurore [VERS] lune [SUJET] Voix.Aurore [PL] [OBJET] esprit [PL] observer [CYCLIQUE] [ÉCRIT]
"C'est écrit que les Voix de l'Aurore observent cycliquement les esprits depuis l'aurore jusqu'à la lune"
```

### Vérité éternelle

```
Ve ura vi toka ve toka vi zeru va umi tekis eom
[DEPUIS] eau [VERS] terre [DEPUIS] terre [VERS] ciel [SUJET] esprit aller [ÉTERNEL]
"L'esprit va éternellement de l'eau vers la terre, de la terre vers le ciel"
```

---

## Phrase maximale

Structure complète avec tous les éléments :

```
Ku ve kekutoka vi uraakota no talusavu vu kari na aita su va oraumi ni naki su vo seka su zoe kisun ait ka

[QUAND] [DEPUIS] Antres [VERS] Confluence [DANS] Halls [AVEC] pierre [DE] ancêtre [PL]
[SUJET] Voix.Aurore [POUR] enfant [PL] [OBJET] savoir [PL] [NÉG.DOUX] transmettre [PASSÉ.ANCESTRAL] [QUESTION]

"Quand est-ce que les Voix de l'Aurore n'ont pas vraiment transmis les savoirs des ancêtres
pour les enfants, avec la pierre, dans les Halls des Serments, depuis les Antres vers la Confluence ?"
```

---

## Récapitulatif des structures

| Élément | Structure | Position |
|---------|-----------|----------|
| Circonstants (lieu, temps, mouvement) | particule + nom | début de phrase |
| Sujet | va + nom | après circonstants |
| Bénéficiaire | ni + nom | avant ou après objet |
| Objet | vo + nom | avant négation/verbe |
| Négation | zo/zom/zob/zoe | avant verbe |
| Verbe | CVCVC | avant conjugateur |
| Conjugateur | V/VC/VVC | après verbe |
| Mode | ul/es/ok | après conjugateur |
| Question fermée | ka | fin absolue |

---

## Ce qui n'est pas encore défini

1. **Propositions relatives** ("le chien qui a mangé...")
2. **Connecteurs logiques** (mais, donc, car, si, alors, ou...)
3. **Subordination** (avant de, après avoir, parce que, afin de...)

Ces éléments peuvent être développés selon les besoins du JDR.

---

*Document de référence - Langue Confluent*
*Voir aussi : 03-GRAMMAIRE.md, 05-LEXIQUE.md*
