#!/usr/bin/env python3
"""
Ajoute les 6 dernières racines manquantes
"""

import json
from pathlib import Path

LEXIQUE_DIR = Path(__file__).parent.parent / "ancien-confluent" / "lexique"
RACINES_FILE = LEXIQUE_DIR / "02-racines-standards.json"

# Les 6 racines à ajouter
RACINES_A_AJOUTER = {
    "ciel": {
        "traductions": [{
            "confluent": "zeru",
            "type": "racine",
            "forme_liee": "zer",
            "domaine": "nature",
            "note": "Ciel, voûte céleste - utilisé dans Ciels-clairs"
        }],
        "synonymes_fr": ["voûte céleste", "firmament"]
    },
    "presage": {
        "traductions": [{
            "confluent": "novi",
            "type": "racine",
            "forme_liee": "nov",
            "domaine": "concept",
            "note": "Présage, signe du futur"
        }],
        "synonymes_fr": ["augure", "signe"]
    },
    "faim": {
        "traductions": [{
            "confluent": "muta",
            "type": "racine",
            "forme_liee": "mut",
            "domaine": "besoin",
            "note": "Faim, manque, besoin de nourriture"
        }],
        "synonymes_fr": ["manque", "privation"]
    },
    "intimite": {
        "traductions": [{
            "confluent": "supu",
            "type": "racine",
            "forme_liee": "sup",
            "domaine": "espace",
            "note": "Intérieur, intimité, espace privé"
        }],
        "synonymes_fr": ["intérieur", "privé"]
    },
    "sale": {
        "traductions": [{
            "confluent": "selu",
            "type": "racine",
            "forme_liee": "sel",
            "domaine": "qualificatif",
            "note": "Salé, eau salée - distinct de salu (sel cristal)"
        }],
        "synonymes_fr": ["salé", "saumâtre"]
    },
    "charge": {
        "traductions": [{
            "confluent": "saki",
            "type": "racine",
            "forme_liee": "sak",
            "domaine": "action",
            "note": "Charge, fardeau, ce qu'on porte"
        }],
        "synonymes_fr": ["fardeau", "cargaison"]
    }
}

def main():
    print("🔧 Ajout des 6 dernières racines manquantes\n")

    with open(RACINES_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Avant: {len(data['dictionnaire'])} entrées\n")

    added = 0
    for key_fr, entry in RACINES_A_AJOUTER.items():
        if key_fr not in data['dictionnaire']:
            mot = entry['traductions'][0]['confluent']
            print(f"  ✅ Ajout: {key_fr} → {mot}")
            data['dictionnaire'][key_fr] = entry
            added += 1
        else:
            print(f"  ⚠️  Existe déjà: {key_fr}")

    print(f"\n✅ {added} racines ajoutées")
    print(f"Après: {len(data['dictionnaire'])} entrées")

    # Sauvegarder
    with open(RACINES_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')

    print(f"\n💾 Fichier sauvegardé")

if __name__ == "__main__":
    main()
