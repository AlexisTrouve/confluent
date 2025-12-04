#!/bin/bash
# Script de setup pour le déploiement de ConfluentTranslator
# Fixe les chemins cassés après la restructuration du projet

cd "$(dirname "$0")/ConfluentTranslator"

echo "Création des symlinks pour les données..."

# Symlinks pour les lexiques (vers confluent/data/)
ln -sf ../../data/lexique.json data/
ln -sf ../../data/lexique-francais-confluent.json data/

# Symlinks pour les dossiers de lexiques (vers confluent/proto-confluent et ancien-confluent)
ln -sf ../proto-confluent .
ln -sf ../ancien-confluent .

echo "Symlinks créés avec succès !"
echo ""
echo "Structure:"
echo "  ConfluentTranslator/data/lexique.json -> ../../data/lexique.json"
echo "  ConfluentTranslator/data/lexique-francais-confluent.json -> ../../data/lexique-francais-confluent.json"
echo "  ConfluentTranslator/proto-confluent -> ../proto-confluent"
echo "  ConfluentTranslator/ancien-confluent -> ../ancien-confluent"
