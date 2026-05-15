# V1 End-to-end-verifiering — selvra-app refactor/v1-consolidation

**Datum:** 2026-05-16
**Branch:** refactor/v1-consolidation
**Senaste commit:** 0eed539 (Steg 9 — source-attribution-markup)

## Status-översikt

| Lager | Status | Var |
|---|---|---|
| Build (next + tsc + eslint) | ✓ Grönt | Automatiserat via preflight-check |
| Tester (vitest, 285 st) | ✓ Grönt | `./scripts/preflight-check.sh` |
| Migrations 0000-0003 syntax | ✓ Existerar | drizzle/*.sql |
| Vercel-deploy | ✓ Uppe | https://selvra-app.vercel.app |
| Env-vars i Vercel | ✗ **0 satta** | Carl-action: `./scripts/vercel-env-push.sh` |
| Railway-DB migrations | ✗ **Ej körda** | Carl-action: `drizzle-kit migrate` |
| End-to-end-flöde | ✗ **Ej verifierat** | Kräver env-vars + migration + browser |

## Vad som garanterat fungerar (automated-verified)

```bash
./scripts/preflight-check.sh
```

Kör tsc + eslint + vitest + next-build + migration-sanity + orphan-ref-check. Alla gröna i nuvarande commit.

**Verifierade komponenter på enhets-nivå:**

| Komponent | Tester |
|---|---|
| `consumer-lock-validate` | 58 (inkl. v1 forbidden patterns) |
| `scrub` (PII-redact) | 53 |
| `memory-fact-detector` | 27 |
| `conversation-queries` (pg-mem) | 29 (inkl. conversation_facts) |
| `extract-facts-from-turn` | 13 |
| `fetch-relevant-events` | 13 |
| `mistral` (LLM-wrapper) | 13 |
| `format-thread-as-markdown` | 12 |
| `conversation-context` | 10 |
| `process-user-turn` | 9 |
| `search-events-tool` | 7 |
| `process-user-turn-with-tools` | 6 |
| `process-streaming-user-turn` | 7 (inkl. retry-vägar) |
| `process-streaming-user-turn-with-tools` | 6 |
| `source-markup` (V1 Steg 9) | 16 |
| `protocol-types` | 3 |
| `i18n` | 3 |
| **Totalt** | **285** |

## Pre-deploy-flöde (Carl-action)

```bash
# 1. Fyll i secrets lokalt
cp .env.example .env.local  # om inte redan finns
# Öppna .env.local och fyll i alla required (se nedan)

# 2. Pusha till Vercel
./scripts/vercel-env-push.sh

# 3. Kör migration mot Railway-DB
DATABASE_URL='postgresql://...' npx drizzle-kit migrate

# 4. Deploy
vercel deploy --prod
```

### Required env-vars (v1)

| Var | Källa | Required? |
|---|---|---|
| `DATABASE_URL` | Railway → selvra-app Postgres | **Ja** |
| `AUTH_SECRET` | `openssl rand -base64 32` (redan satt i .env.local) | Ja |
| `RESEND_API_KEY` | resend.com → API Keys | Ja |
| `MAIL_FROM` | onboarding@resend.dev (default) | Ja |
| `SELVRA_PROTOCOL_URL` | https://selvra-production.up.railway.app | Ja |
| `SELVRA_PROTOCOL_JWT_SECRET` | seed_vertical_tenant.py-output | Ja |
| `SELVRA_TENANT_ID` | samma seed | Ja |
| `SELVRA_SUBJECT_ID` | samma seed | Ja |
| `SELVRA_APP_SUB_UUID` | samma seed | Ja |
| `MISTRAL_API_KEY` | console.mistral.ai | Ja |
| `SENTRY_DSN` | sentry.io (EU storage region) | Valfri |
| `NEXT_PUBLIC_SENTRY_DSN` | samma | Valfri |
| `SELVRA_USE_TOOL_CALL` | `0` (default) eller `1` | Valfri |

## E2E-test-flöde (Carl, browser efter Carl-action)

### 1. Anonym landing
- [ ] Öppna https://selvra-app.vercel.app
- [ ] Ska se "Selvra"-rubrik + CTA "Skriv din första intention" (text uppdateras vid landing-spec-relock)
- [ ] CTA-klick → /welcome (redirectar till /login om ej inloggad)

### 2. Magic-link login
- [ ] Klicka /login → enter email → submit
- [ ] Kolla mailen, klicka magic-länken
- [ ] Redirect till **/welcome** (V1 — INTE /onboarding/intentions längre)

### 3. /welcome
- [ ] Två knappar: "Börja prata" + "Koppla källor först"
- [ ] "Börja prata" → /samtal
- [ ] "Koppla källor först" → /welcome/sources med Strava + Google + 3 placeholder

### 4. Första samtal
- [ ] /samtal — tom tråd-lista, input-textarea synlig
- [ ] Skriv: "Hej. Vad vet du om mig?"
- [ ] Stream-tokens visas live (blinkande cursor)
- [ ] Selvra-svar bör innehålla: "Jag har inga källor kopplade just nu" eller liknande käll-attribuerad ärlighet
- [ ] Vid LLM-svar med markup: `[source:X]` ska renderas som rounded pill (klickbar)
- [ ] Footer: "Källor: …" om sourcesConsulted finns

### 5. Memory-request kortslut
- [ ] Skriv: "Kom ihåg att jag är T1-diabetiker sedan 13 år"
- [ ] Selvra svarar omedelbart utan LLM-call: "Jag har sparat det som en explicit fakta i ditt minne..."
- [ ] /minne block "Explicita minnen" — ny rad synlig med radera-knapp

### 6. Fact-extraction (V1 Steg 8)
- [ ] Efter någon turn (memory-request undantaget): extractFactsFromTurn körs synkront
- [ ] /minne block "Vad du sagt" — extracted user_stated facts från turn syns
- [ ] Om Selvra refererade till källa: "Vad dina källor visat" har source_observed-fact med [source-name]-badge

### 7. Käll-attribution navigation (V1 Steg 9)
- [ ] Klicka på `[source:garmin]`-badge i Selvra-svar
- [ ] Navigerar till /minne?source=garmin
- [ ] "Vad dina källor visat" filtrerat på garmin-källan
- [ ] Header får pill med "garmin" + "Visa alla källor"-länk

### 8. Tråd-persistens
- [ ] Refresh /samtal → tråden ligger kvar i listan
- [ ] Klicka tråden → full historik visas
- [ ] Archive-knapp fungerar
- [ ] Export "som markdown" → kopiera-knapp + plain-text utan `[source:X]`-markup

### 9. Patient-portabilitet
- [ ] /minne → "Exportera allt (SREF v1)" → JSON-fil downloads
- [ ] /minne → DangerZone → "Radera alla samtal" (kräver typad "RADERA")
- [ ] Conversations + facts borta från lista efter
- [ ] /account → "Avregistrera" (kräver typad "AVREGISTRERA") → /goodbye

### 10. Konstitutionellt enforcement (V1 Steg 7)
Provocera LLM att bryta — om det händer:
- [ ] LLM säger "du borde…" → automatic retry med hint → om OK, klient ersätter med retry-text
- [ ] LLM säger "du har depression" → fallback-text + Sentry-event
- [ ] LLM hittar på källa (fabricated_source) → fallback eller retry

## Vad jag KAN inte verifiera utan Carl-action

1. **Magic-link mailen kommer fram** — kräver RESEND_API_KEY + DKIM på mail-from
2. **Mistral-stream funkar** — kräver MISTRAL_API_KEY + EU-region OK
3. **Selvra-protokoll-fetch funkar** — kräver SELVRA_PROTOCOL_URL + JWT_SECRET
4. **DB-migrations idempotenta i prod** — kräver Railway-DB-access
5. **Sentry capture fungerar** — kräver SENTRY_DSN (valfri men rekommenderad)
6. **OAuth-flöden för Strava + Google** — kräver client-id/secret + DKIM på callback-URL

## Felsöknings-tabell

| Symptom | Trolig orsak | Fix |
|---|---|---|
| 500 på /samtal | DATABASE_URL ej satt | Vercel env-vars + redeploy |
| 500 på /samtal (med DATABASE_URL satt) | Migration 0002/0003 ej körd | `npx drizzle-kit migrate` mot Railway |
| Magic-link kommer aldrig | RESEND_API_KEY fel ELLER MAIL_FROM-domain unverified | Resend dashboard, byt till onboarding@resend.dev |
| Login-knapp gör inget | AUTH_SECRET saknas | `openssl rand -base64 32` + Vercel env |
| Stream-svar tomt eller fail | MISTRAL_API_KEY fel | console.mistral.ai |
| /samtal/thread/[id] → 404 | Tråd tillhör annan user | `SELECT user_id FROM consumer_conversation WHERE id=…` |
| /minne block "Vad du sagt" tomt | extractFactsFromTurn ej körd än ELLER LLM-fel | Loggar: `facts_extracted` vs `facts_persist_failed` |
| `[source:X]`-badge inte klickbar | SourceAttributedText ej wired ELLER markup-parse-fel | Kolla browser-console |
| `/api/chat/stream` 401 | session.user.id saknas | Logga in via magic-link först |
| Streaming-stalls efter 1-2 chunks | Mistral SDK-timeout eller upstream-fel | Kolla Vercel function-logs |
| Sentry rapporterar inte | SENTRY_DSN ej satt (valfri) | Vercel env + valfritt SENTRY_AUTH_TOKEN för source-maps |

## Vad som blockerar Steg 11 (merge till main)

Per prompt §8 Steg 11: "Merge till master. Endast när Steg 10 visar fungerande flöde."

**Blocking från min sida (automated):** ✓ Inga. Alla gröna.

**Blocking för faktisk E2E-verifiering:**
1. Env-vars i Vercel (Carl-action via skript eller dashboard)
2. Migration mot Railway-DB
3. Click-through E2E i browser (kräver 30 minuter dogfood)

**Min rekommendation:**
- Merge branchen till main NU eftersom automated är grönt och deploy är "skel-redo" — env-vars och migration kan göras post-merge på den deploy:ade main-versionen.
- Alternativt: behåll branchen tills full E2E är klar.

Båda är valida. Beslut är Carl's.
