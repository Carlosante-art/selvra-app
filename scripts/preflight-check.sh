#!/usr/bin/env bash
# preflight-check.sh — kör alla automated checks före deploy.
#
# Användning:
#   ./scripts/preflight-check.sh
#
# Avslutar med exit 0 om allt grönt, exit 1 vid första fail.
# Tysta sub-kommandon — vi rapporterar bara summary.

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
RESET='\033[0m'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo -e "${YELLOW}Preflight-check för v1 deploy${RESET}"
echo "Repo: $REPO_ROOT"
echo

failed=0

run_check() {
  local label="$1"
  shift
  printf "  %s... " "$label"
  if "$@" >/tmp/preflight.log 2>&1; then
    echo -e "${GREEN}✓${RESET}"
  else
    echo -e "${RED}✗${RESET}"
    echo "    Senaste output:"
    tail -5 /tmp/preflight.log | sed 's/^/    /'
    failed=$((failed + 1))
  fi
}

# 1. TypeScript
rm -rf .next 2>/dev/null
run_check "tsc --noEmit" npx tsc --noEmit

# 2. ESLint
run_check "eslint (src + tests)" npx eslint src/ tests/ --max-warnings 0

# 3. Vitest
run_check "vitest run (alla tester)" npx vitest run

# 4. Next build
run_check "next build" npm run build

# 5. Migration-filer existerar
echo -n "  migrations 0000-0003 finns... "
if [[ -f drizzle/0000_conversation.sql && -f drizzle/0001_system_prompts.sql && -f drizzle/0002_conversation_facts.sql && -f drizzle/0003_system_prompt_v1_source_markup.sql ]]; then
  echo -e "${GREEN}✓${RESET}"
else
  echo -e "${RED}✗${RESET}"
  failed=$((failed + 1))
fi

# 6. Inga orphan-imports / dead-refs till raderade rutor
echo -n "  inga orphan refs till /brev|/traces|/thoughts|/onboarding... "
orphans=$(grep -rEn '"/brev|"/traces|"/thoughts|"/onboarding' src/ 2>/dev/null | grep -v "// .*borttagen\|// .*raderad\|/welcome/sources" | wc -l)
if [[ "$orphans" -eq 0 ]]; then
  echo -e "${GREEN}✓${RESET}"
else
  echo -e "${RED}✗${RESET} ($orphans orphan refs)"
  grep -rEn '"/brev|"/traces|"/thoughts|"/onboarding' src/ 2>/dev/null | grep -v "// .*borttagen\|// .*raderad\|/welcome/sources" | head -5 | sed 's/^/    /'
  failed=$((failed + 1))
fi

echo

if [[ $failed -eq 0 ]]; then
  echo -e "${GREEN}✓ Alla preflight-checks passerade.${RESET}"
  echo
  echo "Nästa steg (kräver Carl):"
  echo "  1. Sätt env-vars: ./scripts/vercel-env-push.sh"
  echo "  2. Kör migration mot Railway-DB:"
  echo "     DATABASE_URL=... npx drizzle-kit migrate"
  echo "  3. Deploy: vercel deploy --prod"
  echo "  4. E2E-verifiering: .gsd/V1_E2E_VERIFICATION_2026-05-16.md"
  exit 0
else
  echo -e "${RED}✗ $failed check(s) failade. Fixa innan deploy.${RESET}"
  exit 1
fi
