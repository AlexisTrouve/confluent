#!/usr/bin/env python3
"""
Corrige les 5 autres erreurs de format
"""

import json
from pathlib import Path

LEXIQUE_DIR = Path(__file__).parent.parent / "ancien-confluent" / "lexique"

# Corrections à appliquer: (fichier, ancien_mot, nouveau_mot, mots_fr)
CORRECTIONS = [
    ("07-emotions.json", "koliukitan", "koliukita", ["gratitude"]),
    ("09-institutions.json", "nutuumilis", "nutuumili", ["Maison des Decouvertes"]),
    ("11-armes-outils.json", "pikiualk", "pikiuarku", ["fleche"]),
    ("23-nourriture.json", "mukunekas", "mukuneka", ["cuisiner"]),
    ("23-nourriture.json", "ulapis", "ulapisu", ["infuser", "boire"]),
]

def main():
    print("🔧 Correction des erreurs de format\n")

    for fichier, ancien, nouveau, mots_fr in CORRECTIONS:
        file_path = LEXIQUE_DIR / fichier

        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        modified = False

        for mot_fr in mots_fr:
            if mot_fr in data['dictionnaire']:
                for trad in data['dictionnaire'][mot_fr]['traductions']:
                    if trad.get('confluent') == ancien:
                        print(f"[{fichier}] \"{mot_fr}\": {ancien} → {nouveau}")
                        trad['confluent'] = nouveau

                        # Mettre à jour la composition si elle contient l'ancien mot
                        if 'composition' in trad:
                            trad['composition'] = trad['composition'].replace(ancien, nouveau)

                        modified = True

        if modified:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write('\n')
            print(f"  ✅ {fichier} sauvegardé\n")

    print("✅ Toutes les corrections appliquées")

if __name__ == "__main__":
    main()
