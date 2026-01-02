#!/bin/bash

echo "==============================================="
echo "   CONFLUENT COVERAGE TEST SUITE"
echo "==============================================="
echo ""

# Kill any existing server on port 3000
echo "[1/4] Arrêt du serveur existant..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 2

# Start server in background
echo "[2/4] Démarrage du serveur..."
cd "$(dirname "$0")"
npm start > /dev/null 2>&1 &
SERVER_PID=$!
sleep 5

# Check if server is running
if ! curl -s http://localhost:3000/api/stats > /dev/null 2>&1; then
    echo "[ERREUR] Le serveur n'a pas démarré correctement"
    exit 1
fi

echo "[3/4] Exécution des tests de coverage..."
echo ""

# Function to extract coverage
get_coverage() {
    echo "$1" | grep -o '"coverage":[0-9]*' | grep -o '[0-9]*'
}

# Function to extract missing words
get_missing() {
    echo "$1" | python3 -c "import sys, json; data=json.load(sys.stdin); print(', '.join([w['word'] for w in data.get('missing', [])]))" 2>/dev/null || echo "N/A"
}

# Test 1 - Texte court culturel
RESULT1=$(curl -s -X POST http://localhost:3000/api/analyze/coverage \
    -H "Content-Type: application/json" \
    -d '{"text": "Les enfants des echos observent le courant dans la confluence"}')
COV1=$(get_coverage "$RESULT1")
MISS1=$(get_missing "$RESULT1")

# Test 2 - Texte long culturel
RESULT2=$(curl -s -X POST http://localhost:3000/api/analyze/coverage \
    -H "Content-Type: application/json" \
    -d '{"text": "La civilisation de la Confluence repose sur l'\''observation, la transmission de la memoire et l'\''union des castes. Les Enfants des Echos ecoutent les murmures du passe tandis que les Faucons Chasseurs protegent les frontieres."}')
COV2=$(get_coverage "$RESULT2")
MISS2=$(get_missing "$RESULT2")

# Test 3 - Vocabulaire quotidien
RESULT3=$(curl -s -X POST http://localhost:3000/api/analyze/coverage \
    -H "Content-Type: application/json" \
    -d '{"text": "manger boire eau nourriture pain viande poisson legume fruit sel epice cuire couteau table feu lumiere maison porte fenetre toit sol mur escalier"}')
COV3=$(get_coverage "$RESULT3")
MISS3=$(get_missing "$RESULT3")

# Test 4 - Pronoms et verbes
RESULT4=$(curl -s -X POST http://localhost:3000/api/analyze/coverage \
    -H "Content-Type: application/json" \
    -d '{"text": "je tu il elle nous vous ils regarder voir observer ecouter parler dire penser savoir comprendre aimer vouloir pouvoir devoir faire aller venir"}')
COV4=$(get_coverage "$RESULT4")
MISS4=$(get_missing "$RESULT4")

# Test 5 - Adjectifs
RESULT5=$(curl -s -X POST http://localhost:3000/api/analyze/coverage \
    -H "Content-Type: application/json" \
    -d '{"text": "grand petit haut bas long court chaud froid bon mauvais beau laid fort faible rapide lent clair sombre"}')
COV5=$(get_coverage "$RESULT5")
MISS5=$(get_missing "$RESULT5")

# Test 6 - Nombres
RESULT6=$(curl -s -X POST http://localhost:3000/api/analyze/coverage \
    -H "Content-Type: application/json" \
    -d '{"text": "un deux trois quatre cinq six sept huit neuf dix cent mille premier dernier"}')
COV6=$(get_coverage "$RESULT6")
MISS6=$(get_missing "$RESULT6")

# Get stats
STATS=$(curl -s http://localhost:3000/api/stats)
ENTRIES=$(echo "$STATS" | grep -o '"total_entries":[0-9]*' | head -1 | grep -o '[0-9]*')

echo "[4/4] Génération du rapport..."
echo ""
echo "==============================================="
echo "             RAPPORT DE COVERAGE"
echo "==============================================="
echo ""
echo "Lexique chargé: $ENTRIES entrées (ancien)"
echo ""
echo "TEST 1 - Texte court culturel     : ${COV1}%"
echo "TEST 2 - Texte long culturel      : ${COV2}%"
echo "TEST 3 - Vocabulaire quotidien    : ${COV3}%"
echo "TEST 4 - Pronoms et verbes        : ${COV4}%"
echo "TEST 5 - Adjectifs courants       : ${COV5}%"
echo "TEST 6 - Nombres                  : ${COV6}%"
echo ""

# Calculate average
AVG=$(( (COV1 + COV2 + COV3 + COV4 + COV5 + COV6) / 6 ))
echo "COVERAGE MOYEN                    : ${AVG}%"
echo ""
echo "==============================================="
echo "          MOTS MANQUANTS PAR TEST"
echo "==============================================="
echo ""
echo "TEST 1 (${COV1}%):"
echo "  $MISS1"
echo ""
echo "TEST 2 (${COV2}%):"
echo "  $MISS2"
echo ""
echo "TEST 3 (${COV3}%):"
echo "  $MISS3"
echo ""
echo "TEST 4 (${COV4}%):"
echo "  $MISS4"
echo ""
echo "TEST 5 (${COV5}%):"
echo "  $MISS5"
echo ""
echo "TEST 6 (${COV6}%):"
echo "  $MISS6"
echo ""
echo "==============================================="
echo ""
echo "Serveur toujours actif sur http://localhost:3000 (PID: $SERVER_PID)"
echo "Pour arrêter: kill $SERVER_PID"
echo ""
