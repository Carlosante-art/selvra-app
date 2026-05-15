#!/usr/bin/env bash
# vercel-env-push.sh — Pusha env-vars från en .env-fil till Vercel.
#
# Användning:
#   ./scripts/vercel-env-push.sh                # läser .env.local
#   ./scripts/vercel-env-push.sh .env.prod      # explicit fil
#   ./scripts/vercel-env-push.sh .env.local preview  # specifik environment
#
# Default-environment är 'production'. Andra giltiga: 'preview', 'development'.
#
# Skriptet:
#   - Hoppar över kommentar-rader (#) och tomma rader
#   - Hoppar över rader utan värde (KEY=)
#   - Strippar både '" och "'-quotes från värden
#   - Tar bort befintlig var innan add (idempotent)
#   - Stoppar vid första fel (set -e)
#
# Förutsätter att 'vercel' CLI är installerad och inloggad
# (vercel whoami ska visa carlosante-art).

set -euo pipefail

ENV_FILE="${1:-.env.local}"
TARGET_ENV="${2:-production}"

# Färgkoder för läsbar output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
RESET='\033[0m'

if [[ ! -f "$ENV_FILE" ]]; then
  echo -e "${RED}✗${RESET} $ENV_FILE finns inte."
  echo
  echo "Skapa filen först:"
  echo "  cp .env.example $ENV_FILE"
  echo "  # fyll i värden"
  echo "  $0 $ENV_FILE $TARGET_ENV"
  exit 1
fi

# Kolla att vercel CLI funkar
if ! vercel whoami >/dev/null 2>&1; then
  echo -e "${RED}✗${RESET} Vercel CLI inte inloggad. Kör 'vercel login'."
  exit 1
fi

# Kolla att vi är länkade till ett projekt
if [[ ! -f ".vercel/project.json" ]]; then
  echo -e "${RED}✗${RESET} Projektet är inte länkat. Kör 'vercel link' först."
  exit 1
fi

PROJECT_NAME=$(grep -o '"projectName":"[^"]*"' .vercel/project.json | cut -d'"' -f4)
echo -e "Pushar env-vars från ${YELLOW}$ENV_FILE${RESET} till ${YELLOW}$PROJECT_NAME${RESET} (env: ${YELLOW}$TARGET_ENV${RESET})"
echo

COUNT_PUSHED=0
COUNT_SKIPPED=0

while IFS= read -r line || [[ -n "$line" ]]; do
  # Strippa whitespace
  line="${line#"${line%%[![:space:]]*}"}"
  line="${line%"${line##*[![:space:]]}"}"

  # Hoppa över kommentarer och tomma rader
  [[ -z "$line" || "$line" =~ ^# ]] && continue

  # Splitta KEY=VALUE
  if [[ ! "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
    continue
  fi

  key="${BASH_REMATCH[1]}"
  value="${BASH_REMATCH[2]}"

  # Hoppa över KEY=  (tom)
  if [[ -z "$value" ]]; then
    echo -e "${YELLOW}—${RESET} $key  (tom, hoppar över)"
    COUNT_SKIPPED=$((COUNT_SKIPPED + 1))
    continue
  fi

  # Strippa quotes från värdet (både double + single)
  if [[ "$value" =~ ^\"(.*)\"$ ]]; then
    value="${BASH_REMATCH[1]}"
  elif [[ "$value" =~ ^\'(.*)\'$ ]]; then
    value="${BASH_REMATCH[1]}"
  fi

  # Ta bort befintlig var (om finns) så add inte fail:ar
  vercel env rm "$key" "$TARGET_ENV" --yes >/dev/null 2>&1 || true

  # Pusha ny — vercel env add läser värdet från stdin
  if printf '%s' "$value" | vercel env add "$key" "$TARGET_ENV" >/dev/null 2>&1; then
    echo -e "${GREEN}✓${RESET} $key"
    COUNT_PUSHED=$((COUNT_PUSHED + 1))
  else
    echo -e "${RED}✗${RESET} $key  (vercel env add fail:ade)"
    exit 1
  fi
done < "$ENV_FILE"

echo
echo -e "${GREEN}✓${RESET} $COUNT_PUSHED variabler pushade, $COUNT_SKIPPED hoppade över."
echo
echo "Nästa: ${YELLOW}vercel deploy --prod${RESET} för att rebuilda med nya env-vars."
