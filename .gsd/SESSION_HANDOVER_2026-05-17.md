# Session-handover — 2026-05-17 kväll

**Syfte:** Säkra att en annan Claude-instans (Uppsala-setup eller annan maskin) kan läsa git och förstå exakt var Carl är när han fortsätter sessionen.

**Memory-not (viktigt):** Carls memory-system lever på `/home/kari/.claude/projects/-home-kari/memory/` på den maskin han just nu sitter på. Detta är **inte i git**. En annan maskin har ett tomt eller annat memory-system. **All status som behövs för fortsättning finns i detta handover-doc + commit-historik.**

---

## Vad mergades idag (2026-05-17)

### selvra-protocol (`~/selvra/`, `Carlosante-art/selvra` på GitHub)

| PR | Vad | Commit |
|---|---|---|
| #43 | Audit av source-experts + ny Strava-expert (event-injection-pattern) | `702aa71` |
| #45 | `docs/SOURCE_EXPERT_DATA_PATHS.md` — lås regeln för Path C vs event-injection | `8bac998` |
| #46 | Stjärn-arkitektur + fact_type-allowlist (3 commits — SELVRA_ONTOLOGY, WRITE_SCOPE_PRINCIPLES allowlist, SPEC stjärn-flöde) | `7896010` |

### selvra-app (`~/selvra-app/`, `Carlosante-art/selvra-app` på GitHub)

| PR | Vad | Commit |
|---|---|---|
| #45 | Landing — ny rad om MCP-connect i konsument-språk | `bb42db7` |
| #46 | Demo screen 2 + 3 — Strava/Spotify-sektioner + korrelations-block | `5cab9a1` |
| #47 | Strava sync-job (daglig Vercel-cron → POST events till selvra-protocol) | `8c5d7df` |
| #48 | Friktion-minimering som arkitektonisk constraint (3 docs: PRINCIPLE, IOS_APP_PRIMARY_JOB, FRICTION_MAP) | `8ce3a2c` |
| #49 | FRICTION_MAP ärlig uppdatering efter Anna-test (iPhone-only-lucka + plan-timing flyttad till 3b) | `3c1ac67` |

---

## Öppna PR:er — vad de väntar på

### selvra-protocol

| PR | Branch | Vad | Blocker |
|---|---|---|---|
| #34 | feature/connections-and-token-issuance | Consumer-token-issuance + connections-management endpoints (connect-flow-stack base) | DNS för mcp.selvra.ai (Carl-action) |
| #37 | feature/add-goose-client | Lägg Goose i klient-whitelist | Beror på #34 (samma stack) |
| #39 | feature/audit-pagination | Offset-paginering + has_more på /v1/connections/{id}/audit | Beror på #34 |
| #44 | feat/wire-four-stub-experts-via-event-injection-2026-05-17 | **Ej blockerad — kan mergas när Carl ger ok** | Carl-ok |
| #33 | harden-selvra-paket | PII-scrub-helper + structlog-processor | Carl-ok (eldre PR, kanske obsolet?) |

### selvra-app

| PR | Branch | Vad | Blocker |
|---|---|---|---|
| #25 | docs/ios-build-plan-2026-05-16 | SELVRA_IOS_V1_BUILD_PLAN + uppdaterad landing + Stillra-status | Granskning/Carl-ok (gammal, kan vara reviderad) |
| #27 | feature/manual-import | POST /api/sources/manual-import + CLI + 3 exempel | Separat track, Carl-ok |
| #35 | feature/connect-flow | /connect-flöde mot selvra-protocol consumer-tokens (stack base) | DNS för mcp.selvra.ai |
| #36 | feature/connect-flow-mobile | Mobile-stöd via plattform-toggle | Beror på #35 |
| #37 | feature/add-goose-client | Goose som klient via ny goose-yaml configFormat | Beror på #36 |
| #38 | feature/connections-audit-view | Full audit-vy /connections/[client]/audit + paginering | Beror på #37 |
| #43 | docs/ios-week-2-3-progress-2026-05-17 | API gap-analys + EU-hosting-verifikation | Granskning/Carl-ok |
| #44 | docs/ios-week-5-7-design-docs-2026-05-17 | HealthKit-sync + Apple Sign-in coexistens + Bearer-JWT design-docs | Granskning/Carl-ok |

**Connect-flow-stack-merge-recept:** `selvra/docs/MERGE_RECIPE_CONNECT_FLOW_2026-05-17.md` — exakt sekvens för att merga stacken UTAN att råka radera dependent-branches via `--delete-branch`-fällan.

---

## Kvarvarande blockers (för Carl att hantera)

### B4 — DNS för mcp.selvra.ai

Måste pekas (CNAME) till Railway-target. Railway dashboard visar exakt target när custom domain läggs till. När detta är gjort kan connect-flow-stacken mergas enligt MERGE_RECIPE.

**Var:** DNS-provider (Cloudflare/Namecheap/var Carl köpt domänen).

### B8 — Merga connect-flow-stack (efter B4)

Sekvens enligt MERGE_RECIPE. Använd INTE `--delete-branch` förrän hela stacken är mergad — det auto-stänger dependent PR:er (LEARNINGS_LOG 2026-05-16).

### B9 — Manuell E2E-regression (efter B8)

Verifiera att Claude Desktop kan ansluta via mcp.selvra.ai. Test-checklist i MERGE_RECIPE.

### Strava sync — Vercel-env-vars saknas

PR #47 mergades men ingen Strava-data flödar förrän Carl satt i Vercel:
- STRAVA_CLIENT_ID + STRAVA_CLIENT_SECRET (för refresh-flow)
- STRAVA_ACCESS_TOKEN + STRAVA_REFRESH_TOKEN + STRAVA_EXPIRES_AT (initial OAuth)
- STRAVA_ATHLETE_ID

Carl kör OAuth-flow manuellt via `/api/oauth/strava/init` en gång, kopierar callback-output, sen körs cron dagligen 05:00 UTC.

---

## Konstitutionella dokument (var de bor)

### selvra-protocol/docs/
- `SELVRA_ONTOLOGY.md` — sju ontologi-rader (skapad idag)
- `SELVRA_POSITION_2026-05-17.md` — kanonisk position
- `WRITE_SCOPE_PRINCIPLES_2026-05-16.md` — Princip 11 + fact_type-allowlist (utökad idag)
- `SOURCE_EXPERT_DATA_PATHS.md` — Path C vs event-injection-regel (skapad idag)
- `SOURCE_EXPERTS_AUDIT_2026-05-17.md` — inventering av 8 experter
- `CONVERSATION_SOURCE_ATTRIBUTION_2026-05-16.md` — käll-attribuering
- `PROPOSE_OBSERVATION_SPEC_2026-05-16.md` — teknisk spec för PR #36
- `MERGE_RECIPE_CONNECT_FLOW_2026-05-17.md` — merge-sekvens

### selvra-protocol/SELVRA_SPEC.md (root)
Huvuddokument med 11 principer + Position-sektion + ny "Arkitektonisk princip: stjärn-flöde"-sektion (tillagd idag).

### selvra-app/.gsd/
- `SELVRA_APP_ROLE_2026-05-17.md` — parallell positionering på klient-rollen
- `IOS_APP_PRIMARY_JOB_2026-05-17.md` — strategisk avgränsning (skapad idag)
- `FRICTION_MINIMIZATION_PRINCIPLE_2026-05-17.md` — friktion som constraint (skapad idag, reviderad idag efter Anna-test)
- `FRICTION_MAP_2026-05-17.md` — 16+ friktionspunkter, kategori A/B/C/D (skapad idag, reviderad idag efter Anna-test)
- `IOS_HEALTHKIT_SYNC_DESIGN_2026-05-17.md`
- `IOS_AUTH_COEXISTENCE_DESIGN_2026-05-17.md`
- `IOS_AUTH_BEARER_JWT_DESIGN_2026-05-17.md`
- `IOS_API_SPEC_2026-05-16.md`
- `IOS_API_GAP_ANALYSIS_2026-05-17.md`
- `CHAT_PIPELINE_DEPRECATION_2026-05-16.md`
- `DUAL_FACT_EXTRACTION_MIGRATION_2026-05-16.md`
- `EU_HOSTING_VERIFICATION_2026-05-16.md`
- `SELVRA_IOS_V1_BUILD_PLAN_2026-05-16.md` — master-styrning för iOS-arbete

---

## Anna-testet (för iOS-design-arbete framåt)

Carl bad Claude läsa FRICTION_MAP rad för rad med en specifik person i sinnet. Claude valde Anna: 38, T1D-mamma, iPhone-only med Claude Pro, söndagskväll. Resultaten ledde till PR #49 (ärlig uppdatering av FRICTION_MAP).

**Carls instruktion till framtida iOS-bygge:** "Den dagen iOS-appen byggs ska du ha den personen i sinnet vid varje commit. Det är vad som skiljer en friktion-minimerad produkt från en med god intention som ändå glider mot komplexitet."

Anna är test-personan. Använd henne vid framtida designval för iOS-yta.

---

## Topology (operativa fakta)

### Repos
- `~/selvra/` → GitHub `Carlosante-art/selvra` — protokoll-implementation (Python)
- `~/selvra-app/` → GitHub `Carlosante-art/selvra-app` — konsument-klient (Next.js 16 + TypeScript)
- `~/frida-app/` → GitHub `Carlosante-art/frida-app` — Stillra patient-app (Expo/RN)
- `~/stillra-server-master/` → Stillras backend

### Deploy-topology
- **Railway-projekt:** `distinguished-simplicity` (innehåller services: `selvra`, `selvra-app`)
- **Postgres:** Supabase eu-west-1 — delad mellan selvra-protocol och selvra-app
- **Redis:** Upstash `divine-ape-116602.upstash.io` (EU)
- **Vercel:** selvra-app, Pro-plan, fra1-region
- **DNS:** `mcp.selvra.ai` — PENDING (CNAME → Railway-target)

### Kritiska UUIDs (Carl)
- TENANT_ID: `312f157b-0f84-4ea4-a306-ef84640f4357`
- SUBJECT_ID (Carl): `2bfe0414-56c6-5692-8ef3-9c7d3991fe90`
- SELVRA_APP_SUB_UUID: `d4484381-6936-4c42-94ba-af515987ab53`

### DATABASE_URL prefix
`postgresql://postgres.rmlcekjqlpnnovwshofp:...@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`

---

## Vad nästa Claude bör veta

1. **Mitt minne är lokalt** — du har inte tillgång till mina feedback-/project-memories. Allt jag behövde minnas till nästa session finns i detta doc + relevanta .gsd-/docs-filer.

2. **Friktion-principer är låsta:**
   - "Friktionsfri UX i flöde" (selvra-app/.gsd/, plus min memory `feedback_friktionsfri_ux_first_2026-05-16`)
   - "Avsiktlig friktion i konsekvens" (memory `feedback_avsiktlig_friktion_i_konsekvens_2026-05-17`)
   - "Friktion-minimering som arkitektonisk constraint" (PR #48, reviderad #49)
   - Dessa är tripel-par. Inga konflikter mellan dem.

3. **Tre arkitektoniska distinktioner låsta idag:**
   - **Stjärn-flöde** (inte kedja) — AI-system läser direkt från Selvra
   - **Reproducerbar extraktion** — fact_type-allowlist för write-scope
   - **Path C vs event-injection** — regel för var data lever, var experten läser

4. **Sju ontologi-rader låsta:** se `selvra/docs/SELVRA_ONTOLOGY.md`.

5. **Anna är test-persona** för iOS-arbete — T1D-mamma, iPhone-only Pro, ingen Mac. Hon faller av vid friktionspunkt 12 idag (Anthropic-deep-link saknas). Designa med henne i sinnet.

6. **Senaste lärdom-format Carl etablerat (2026-05-17):**
   - Princip-formuleringar låses i dokument INNAN implementation
   - Audit kan avslöja att antalet filer ≠ funktionell täckning
   - "Bra till mig" → spara som feedback memory (för senare sessioner)

---

## Pågående task-tråd (när Carl är tillbaka)

Sista direktiva sekvens:
1. ✅ Merga PR #49 (Anna-test uppdatering)
2. ✅ Pusha exakt allting till git
3. ✅ Skapa handover-doc så Uppsala-Claude förstår läget

**Inget aktivt arbete pågår.** Carl avbröt sin "merga" för att be om handover. Detta dokument är leverans.

**Logiska nästa steg när Carl är tillbaka:**
- Hantera B4 DNS (om Carl har möjlighet på Uppsala-setup)
- Sedan B8 + B9 (connect-flow-stack merge + E2E)
- Eventuellt merga PR #44 selvra-protocol (Wire fyra stubs — ej blockerad, men Carl har inte sagt merga)
- Eventuellt merga PR #25, #27, #43, #44 selvra-app — granskning krävs först
- iOS-implementation (vecka 5-7 enligt SELVRA_IOS_V1_BUILD_PLAN) — efter att alla constraint-docs är låsta (DE ÄR NU)

---

## Snabb-orientering för Uppsala-Claude

Om du läser detta dokument första gången:

1. Läs `selvra/docs/SELVRA_ONTOLOGY.md` — sju rader, det är produktens filosofiska grund
2. Läs `selvra/docs/SELVRA_POSITION_2026-05-17.md` — vad Selvra är (protokoll, klient, vertikal)
3. Läs `selvra-app/.gsd/IOS_APP_PRIMARY_JOB_2026-05-17.md` — vad iOS-appen ska göra
4. Läs `selvra-app/.gsd/FRICTION_MAP_2026-05-17.md` — med Anna i sinnet
5. Kör `git log --oneline -20` i båda repos för att se senaste aktivitet
6. Kör `gh pr list --state open` för att se vad som väntar
7. Fråga Carl vad han vill fortsätta med
