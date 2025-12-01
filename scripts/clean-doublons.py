#!/usr/bin/env python3
"""
Supprime les doublons dans 02-racines-standards.json
Garde les versions originales, supprime les nouvelles clés ajoutées
"""

import json
from pathlib import Path

LEXIQUE_DIR = Path(__file__).parent.parent / "ancien-confluent" / "lexique"
RACINES_FILE = LEXIQUE_DIR / "02-racines-standards.json"

# Clés à supprimer (les nouvelles versions qu'on a ajoutées)
DOUBLONS_A_SUPPRIMER = [
    "agent",           # doublon de "personne" (si elle existe ailleurs)
    "proteger",        # garder si pas de doublon
    "duree",           # doublon de "temps"
    "materiau_bois",   # doublon de "bois"
    "negatif",         # doublon de "mauvais"
    "aliment",         # garder si pas de doublon
    "demeurer",        # garder si pas de doublon
    "souvenir"         # doublon de "memoire"
]

def main():
    print("🔧 Nettoyage des doublons dans 02-racines-standards.json\n")

    with open(RACINES_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Avant: {len(data['dictionnaire'])} entrées\n")

    # Afficher les mots confluent et leurs clés
    mots_conf = {}
    for key, value in data['dictionnaire'].items():
        mot = value['traductions'][0]['confluent']
        if mot not in mots_conf:
            mots_conf[mot] = []
        mots_conf[mot].append(key)

    # Trouver les vrais doublons (même mot confluent)
    print("Doublons trouvés (même mot confluent):")
    for mot, cles in sorted(mots_conf.items()):
        if len(cles) > 1:
            print(f"  {mot}: {', '.join(cles)}")

    print("\nSuppression des clés en doublon:")
    removed = 0
    for key in DOUBLONS_A_SUPPRIMER:
        if key in data['dictionnaire']:
            mot = data['dictionnaire'][key]['traductions'][0]['confluent']
            print(f"  ❌ {key} ({mot})")
            del data['dictionnaire'][key]
            removed += 1

    print(f"\n✅ {removed} doublons supprimés")
    print(f"Après: {len(data['dictionnaire'])} entrées")

    # Sauvegarder
    with open(RACINES_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')

    print(f"\n💾 Fichier sauvegardé")

if __name__ == "__main__":
    main()
