#!/usr/bin/env bash
# test-mistral-svenska.sh — Mistral API-integration test för iOS-bygget.
#
# Per SELVRA_IOS_V1_BUILD_PLAN_2026-05-16.md §5 vecka 2-3 task 2 + §8 Risk 3.
# Verifierar:
#   1. Mistral API är nåbar med MISTRAL_API_KEY
#   2. Svenska prompts ger acceptabel output-kvalitet
#   3. EU-region-default verifierat (request går till EU-endpoint)
#   4. Latens-baseline mätt (för iOS-streaming-UX-planering)
#
# Användning:
#   export MISTRAL_API_KEY='...'
#   ./scripts/test-mistral-svenska.sh

set -euo pipefail

if [[ -z "${MISTRAL_API_KEY:-}" ]]; then
  echo "✗ MISTRAL_API_KEY env-var saknas"
  echo "  Hämta från https://console.mistral.ai/api-keys"
  exit 1
fi

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
RESET='\033[0m'

API_URL='https://api.mistral.ai/v1/chat/completions'
MODEL='mistral-large-latest'

echo -e "${YELLOW}Mistral svenska + EU-verifikation${RESET}"
echo "Model: $MODEL"
echo "Endpoint: $API_URL"
echo

# Test 1: connectivity + svenska
echo "Test 1: Svenska reflektion (käll-attribuerad observation)"
START=$(date +%s%N)
RESPONSE=$(curl -s -w "\n__HTTP_STATUS__%{http_code}\n__SERVER__%{remote_ip}\n" \
  -X POST "$API_URL" \
  -H "Authorization: Bearer $MISTRAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "'"$MODEL"'",
    "messages": [
      {
        "role": "system",
        "content": "Du är Selvra. Spegel, inte coach. All observation källa-attribuerad. Inga manipulations-mönster. Säg \"jag vet inte\" när data saknas. KÄLLA-ATTRIBUTION: använd inline [source:NAME] direkt efter claim:en."
      },
      {
        "role": "user",
        "content": "Vad visar min sömn-data senaste veckan? Källor tillgängliga: garmin, apple_health."
      }
    ],
    "temperature": 0.7,
    "max_tokens": 300
  }')
END=$(date +%s%N)
LATENCY_MS=$(( (END - START) / 1000000 ))

HTTP_STATUS=$(echo "$RESPONSE" | grep -oP "__HTTP_STATUS__\K[0-9]+")
REMOTE_IP=$(echo "$RESPONSE" | grep -oP "__SERVER__\K[^\s]+")
CONTENT=$(echo "$RESPONSE" | sed '/^__HTTP_STATUS__/,$d')

if [[ "$HTTP_STATUS" != "200" ]]; then
  echo -e "${RED}✗ HTTP $HTTP_STATUS${RESET}"
  echo "$CONTENT" | head -20
  exit 1
fi

echo -e "${GREEN}✓${RESET} HTTP 200 (latens: ${LATENCY_MS}ms, remote-IP: $REMOTE_IP)"
echo

# Test 2: EU-region check (IP-lookup)
echo "Test 2: EU-region verifikation"
GEO=$(curl -s "https://ipapi.co/$REMOTE_IP/json/" 2>&1)
COUNTRY=$(echo "$GEO" | grep -oP '"country_code":\s*"\K[^"]+' | head -1)
COUNTRY_NAME=$(echo "$GEO" | grep -oP '"country_name":\s*"\K[^"]+' | head -1)

# EU-länder lista (förkortad)
EU_COUNTRIES="AT BE BG CY CZ DE DK EE ES FI FR GR HR HU IE IT LT LU LV MT NL PL PT RO SE SI SK"
if [[ "$EU_COUNTRIES" == *"$COUNTRY"* ]]; then
  echo -e "${GREEN}✓${RESET} Mistral-endpoint är i EU ($COUNTRY_NAME)"
else
  echo -e "${RED}✗${RESET} Mistral-endpoint är INTE i EU (är: $COUNTRY_NAME). Kontakta Mistral support — EU-suveränitet bryts."
fi
echo

# Test 3: Extrahera + bedöma svenska kvalitet
echo "Test 3: Output-kvalitet bedömning"
TEXT=$(echo "$CONTENT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data['choices'][0]['message']['content'])
")
echo "Output:"
echo "$TEXT" | sed 's/^/  /'
echo

# Heuristisk kvalitets-check
if echo "$TEXT" | grep -qE "jag vet inte|jag har inga|saknas|inga (data|värden)"; then
  echo -e "${GREEN}✓${RESET} LLM erkänner data-avsaknad (constitutional-conformant)"
else
  echo -e "${YELLOW}⚠${RESET} LLM antar data — granska om hallucination"
fi

if echo "$TEXT" | grep -qE "\[source:[a-z_]+\]"; then
  echo -e "${GREEN}✓${RESET} Käll-attribuering med [source:X]-markup"
else
  echo -e "${YELLOW}⚠${RESET} Saknar [source:X]-markup — prompt-engineering behövs"
fi

if echo "$TEXT" | grep -qiE "du borde|du måste|du bör|du kommer (att )?(må|känna)"; then
  echo -e "${RED}✗${RESET} Coach-språk eller prediktion detekterat (FORBIDDEN_PATTERN)"
else
  echo -e "${GREEN}✓${RESET} Inga forbidden patterns i output"
fi

echo
echo -e "${YELLOW}Sammanfattning:${RESET}"
echo "- Latens: ${LATENCY_MS}ms (acceptabelt för streaming-UX om <2000ms)"
echo "- Region: $COUNTRY_NAME"
echo "- Model: $MODEL"
echo "- Vid behov: testa även mistral-small-latest för latens-jämförelse"
