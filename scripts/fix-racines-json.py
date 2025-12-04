#!/usr/bin/env python3
"""
Répare le fichier 02-racines-standards.json :
- Déplace les 8 racines de "pronoms" vers "dictionnaire"
- Garde tous les pronoms dans "pronoms"
"""

import json
from pathlib import Path

# Chemins
LEXIQUE_DIR = Path(__file__).parent.parent / "ancien-confluent" / "lexique"
RACINES_FILE = LEXIQUE_DIR / "02-racines-standards.json"

# Les 8 racines à déplacer de pronoms vers dictionnaire
RACINES_A_DEPLACER = {
    "agent": "toli",
    "proteger": "konu",
    "duree": "aika",
    "materiau_bois": "vito",
    "negatif": "paka",
    "aliment": "nutu",
    "demeurer": "tuli",
    "souvenir": "nemu"
}

def main():
    print("🔧 Réparation du fichier 02-racines-standards.json\n")

    # Charger le fichier
    with open(RACINES_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Avant: {len(data['dictionnaire'])} entrées dans dictionnaire")
    print(f"Avant: {len(data['pronoms'])} entrées dans pronoms\n")

    # Déplacer les racines
    moved = 0
    for key_fr, mot_conf in RACINES_A_DEPLACER.items():
        if key_fr in data['pronoms']:
            print(f"  Déplacement: {key_fr} ({mot_conf})")
            data['dictionnaire'][key_fr] = data['pronoms'][key_fr]
            del data['pronoms'][key_fr]
            moved += 1

    print(f"\n✅ {moved} racines déplacées")
    print(f"Après: {len(data['dictionnaire'])} entrées dans dictionnaire")
    print(f"Après: {len(data['pronoms'])} entrées dans pronoms")

    # Sauvegarder
    with open(RACINES_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')

    print(f"\n💾 Fichier sauvegardé: {RACINES_FILE}")

if __name__ == "__main__":
    main()
