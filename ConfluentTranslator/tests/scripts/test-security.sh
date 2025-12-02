#!/bin/bash

# Test de sécurité - Full Lockdown
# Ce script teste tous les endpoints pour vérifier qu'ils sont protégés

echo "🔒 Test de sécurité - ConfluentTranslator"
echo "========================================"
echo ""

BASE_URL="http://localhost:3000"
TOKEN=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TOTAL=0
PASSED=0
FAILED=0

test_endpoint() {
  local method=$1
  local endpoint=$2
  local expected_status=$3
  local description=$4
  local auth=$5

  TOTAL=$((TOTAL + 1))

  if [ "$method" = "GET" ]; then
    if [ "$auth" = "true" ]; then
      response=$(curl -s -w "\n%{http_code}" -H "x-api-key: $TOKEN" "$BASE_URL$endpoint")
    else
      response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    fi
  else
    if [ "$auth" = "true" ]; then
      response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -H "x-api-key: $TOKEN" -d '{"text":"test"}' "$BASE_URL$endpoint")
    else
      response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d '{"text":"test"}' "$BASE_URL$endpoint")
    fi
  fi

  status=$(echo "$response" | tail -n1)

  if [ "$status" = "$expected_status" ]; then
    echo -e "${GREEN}✓${NC} $description"
    echo -e "  ${method} ${endpoint} → ${status}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗${NC} $description"
    echo -e "  ${method} ${endpoint} → ${status} (attendu: ${expected_status})"
    FAILED=$((FAILED + 1))
  fi
  echo ""
}

echo "📋 Phase 1: Endpoints PUBLICS (sans auth)"
echo "==========================================="
echo ""

test_endpoint "GET" "/api/health" "200" "Health check public" "false"

echo ""
echo "🔒 Phase 2: Endpoints PROTÉGÉS (sans auth → 401)"
echo "=================================================="
echo ""

test_endpoint "GET" "/api/stats" "401" "Stats sans auth" "false"
test_endpoint "GET" "/api/lexique/ancien" "401" "Lexique sans auth" "false"
test_endpoint "GET" "/api/search?q=test" "401" "Search sans auth" "false"
test_endpoint "POST" "/translate" "401" "Traduction FR→CF sans auth" "false"
test_endpoint "POST" "/api/translate/conf2fr" "401" "Traduction CF→FR sans auth" "false"
test_endpoint "POST" "/api/reload" "401" "Reload sans auth" "false"

echo ""
echo "🔑 Phase 3: Récupération du token admin"
echo "========================================"
echo ""

# Vérifier si le fichier tokens.json existe
if [ ! -f "data/tokens.json" ]; then
  echo -e "${YELLOW}⚠${NC} Fichier data/tokens.json introuvable"
  echo "  Veuillez démarrer le serveur une fois pour créer le token admin"
  exit 1
fi

# Extraire le premier token
TOKEN=$(jq -r 'keys[0]' data/tokens.json 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo -e "${YELLOW}⚠${NC} Aucun token trouvé dans data/tokens.json"
  echo "  Veuillez démarrer le serveur une fois pour créer le token admin"
  exit 1
fi

echo -e "${GREEN}✓${NC} Token admin trouvé: ${TOKEN:0:20}..."
echo ""

echo "🔓 Phase 4: Endpoints PROTÉGÉS (avec auth → 200)"
echo "================================================="
echo ""

test_endpoint "GET" "/api/stats" "200" "Stats avec auth" "true"
test_endpoint "GET" "/api/lexique/ancien" "200" "Lexique avec auth" "true"
test_endpoint "GET" "/api/validate" "200" "Validation avec auth" "true"
test_endpoint "GET" "/api/search?q=test&variant=ancien" "200" "Search avec auth" "true"

echo ""
echo "📊 RÉSULTATS"
echo "============"
echo ""
echo -e "Total: ${TOTAL} tests"
echo -e "${GREEN}Réussis: ${PASSED}${NC}"
echo -e "${RED}Échoués: ${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ TOUS LES TESTS SONT PASSÉS${NC}"
  echo -e "${GREEN}🔒 Le système est correctement sécurisé${NC}"
  exit 0
else
  echo -e "${RED}✗ CERTAINS TESTS ONT ÉCHOUÉ${NC}"
  echo -e "${RED}⚠ Vérifiez la configuration de sécurité${NC}"
  exit 1
fi
