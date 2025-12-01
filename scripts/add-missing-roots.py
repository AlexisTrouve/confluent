#!/usr/bin/env python3
"""
Ajoute les 8 racines manquantes qui sont utilisées dans le lexique
"""

import json
from pathlib import Path

LEXIQUE_DIR = Path(__file__).parent.parent / "ancien-confluent" / "lexique"
RACINES_FILE = LEXIQUE_DIR / "02-racines-standards.json"

# Les 8 racines à ajouter (VRAIMENT manquantes, utilisées dans le lexique)
RACINES_A_AJOUTER = {
    "personne": {
        "traductions": [{
            "confluent": "toli",
            "type": "racine",
            "forme_liee": "tol",
            "domaine": "social",
            "note": "Personne, agent, individu - utilisé dans tous les rôles"
        }],
        "synonymes_fr": ["agent", "individu"]
    },
    "nourriture": {
        "traductions": [{
            "confluent": "nutu",
            "type": "racine",
            "forme_liee": "nut",
            "domaine": "alimentation",
            "note": "Nourriture, aliment - racine fondamentale"
        }],
        "synonymes_fr": ["aliment", "manger"]
    },
    "bois_materiau": {
        "traductions": [{
            "confluent": "vito",
            "type": "racine",
            "forme_liee": "vit",
            "domaine": "materiau",
            "note": "Bois (matériau de construction) - distinct de viku (forêt)"
        }],
        "synonymes_fr": ["bois de construction"]
    },
    "garder": {
        "traductions": [{
            "confluent": "konu",
            "type": "racine",
            "forme_liee": "kon",
            "domaine": "action",
            "note": "Garder, protéger, maintenir - racine sécuritaire"
        }],
        "synonymes_fr": ["protéger", "maintenir", "défendre"]
    },
    "duree": {
        "traductions": [{
            "confluent": "aika",
            "type": "racine_sacree",
            "forme_liee": "aik",
            "domaine": "temporel",
            "note": "Temps, durée, époque - du finnois 'aika'"
        }],
        "synonymes_fr": ["temps", "époque", "ère"]
    },
    "souvenir": {
        "traductions": [{
            "confluent": "nemu",
            "type": "racine",
            "forme_liee": "nem",
            "domaine": "mental",
            "note": "Mémoire, souvenir - distinct de memu (mémoire collective)"
        }],
        "synonymes_fr": ["mémoire", "rappel"]
    },
    "mauvais": {
        "traductions": [{
            "confluent": "paka",
            "type": "racine",
            "forme_liee": "pak",
            "domaine": "qualificatif",
            "note": "Mauvais, négatif, malfaisant - inspiration basque"
        }],
        "synonymes_fr": ["négatif", "mal", "malfaisant"]
    },
    "demeurer": {
        "traductions": [{
            "confluent": "tuli",
            "type": "racine",
            "forme_liee": "tul",
            "domaine": "etat",
            "note": "Être, rester, demeurer - du finnois 'tulla'"
        }],
        "synonymes_fr": ["rester", "être", "habiter"]
    }
}

def main():
    print("🔧 Ajout des 8 racines manquantes\n")

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
