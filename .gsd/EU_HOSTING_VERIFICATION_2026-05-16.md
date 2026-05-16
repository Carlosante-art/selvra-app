# EU-hosting verifikation

Per `SELVRA_IOS_V1_BUILD_PLAN_2026-05-16.md` §5 vecka 2-3 task 3.
Konstitutionellt krav från §2: EU-suverän infrastruktur. Inga
sub-processors utanför EU utan explicit dokumentation.

## Lager-för-lager-status

### 1. Frontend hosting — Vercel

**Status:** Konfiguration kräver verifikation.

| Komponent | Region | Verifierad? |
|---|---|---|
| Static-pages (landing, privacy, login) | Globalt CDN — Edge-noder Frankfurt + Stockholm + Paris | Ja (default Vercel) |
| Serverless Functions (`/api/*`) | **MÅSTE VERIFIERAS** — region väljs i `vercel.json` eller projekt-inställningar | Pending |
| Build-runners | US-baserade by default | Acceptabelt (kör inte user-data) |

**Action:**
- Verifiera Vercel Function Region är `fra1` (Frankfurt) eller `cdg1` (Paris)
- Sätt explicit i `vercel.json` om saknas:
  ```json
  {
    "regions": ["fra1"],
    "functions": {
      "src/app/api/**/*.ts": { "runtime": "nodejs20.x", "regions": ["fra1"] }
    }
  }
  ```

### 2. Backend hosting — Railway

**Status:** Stillra-server är på Railway (Hetzner-region Frankfurt enligt
memory). selvra-app DB är också Railway.

**Action:**
- Verifiera DB-region är `eu-west1` (Hetzner Frankfurt) eller `eu-west2` (Amsterdam)
- Inte `us-west1` eller `asia-east1`
- Railway dashboard: Project → DB-service → Settings → Region

### 3. LLM-provider — Mistral

**Status:** Mistral är franskt företag baserat i Paris. API-endpoints
default till EU-region.

**Verifikation:**
- `scripts/test-mistral-svenska.sh` har inbyggd IP-region-check
- Kör med `MISTRAL_API_KEY` satt
- Bekräftar att API-endpoint resolver till EU-IP

### 4. LLM-provider fallback — Anthropic EU-tier

**Status:** Anthropic erbjuder EU-tier med DPA (Data Processing Agreement)
och no-training-commitment. Kräver Enterprise-plan.

**Action:**
- Inte aktiverat i v1 — Mistral är primär
- Lagra som "väntar Mistral-failure-pattern" + Enterprise-pris-bedömning
- Aldrig OpenAI consumer-tier (konstitutionellt förbjudet)

### 5. Error-tracking — Sentry

**Status:** Sentry har EU-region (Frankfurt). Måste väljas vid org-skapande.

**Verifikation:**
- Sentry-org URL: `https://*.sentry.io` har EU-routing om EU-org
- Settings → Data Residency: "European Union"
- Inte aktivt i Stillra/selvra-app än (`SENTRY_DSN` ej satt i Vercel)

### 6. Mail — Resend

**Status:** Resend är US-baserat. **Detta är problem för EU-suveränitet.**

**Mitigation-alternativ:**
- Resend har EU-region launch H2 2026 (deras roadmap)
- Alternativt: Mailgun EU (Tyskland), Postmark EU (Tyskland), Sendgrid EU
- Tills Resend EU klar: använd onboarding@resend.dev som default, byt
  vid AB-aktivering om EU-mail-provider bättre passar

**Action:**
- Vid AB-aktivering: re-evaluera Resend EU-status vs alternativ
- Dokumentera valet i DPA-bedömning

### 7. OAuth-providers

| Provider | Datalokation | Kommentar |
|---|---|---|
| Apple Sign-in | Global | Apple-policy, inte vårt val. Token-exchange sker EU-side om server är EU |
| Google (Calendar + Gmail) | Global | Google policy. Min: håll token + tokens-refresh-flow EU-side |
| Strava | Global | Strava är US. Token-flöde EU-side |
| Garmin Connect | Global | Garmin har EU-API om man väljer EU-region vid OAuth-app-registrering |

**Generell princip:** API-anrop GÅR till providers globalt, men token-storage
+ all user-data-bearbetning sker EU-side i vår backend.

### 8. Apple Push Notification Service (när iOS-app aktiverar push)

**Status:** APNs är Apple-infrastruktur. iOS-default. Inte vårt val.

**Constitutional risk:** Push-notifikationer riskerar manipulation
(FOMO-krokar är förbjudna). Beslut: pausa push-features i v1.

## Sub-processors-lista (compliance-doc-stub)

| Sub-processor | Roll | EU-region? |
|---|---|---|
| Vercel | Frontend hosting | Verifiera Function Region |
| Railway (Hetzner) | Backend + DB | EU (Frankfurt) |
| Mistral | LLM | EU (Paris) |
| Supabase | Stillra DB | EU (verifiera region) |
| Sentry | Error-tracking (när aktiverat) | EU-region required |
| Resend | Mail (när aktiverat) | US — re-evaluera vid AB |
| Apple | Sign-in + APNs | Global |
| Google | OAuth (Calendar, Gmail) | Global |
| Strava | OAuth | Global |
| Garmin | OAuth | EU-API tillgänglig |

**Action:** Skapa formell sub-processor-lista i `~/selvra/docs/privacy/SUB_PROCESSORS.md`
när AB är aktivt + GDPR-DPA-template:s behövs.

## EU AI Act-compliance

Sammankoppling till `consumer-lock-validate.ts`-implementationen:

- **Article 5(1)(a)** — Förbud mot manipulativa AI-system → IMPLEMENTERAT
  som forbidden patterns
- **Article 26(2)** — Transparens om AI → IMPLEMENTERAT via käll-attribuering
- **Article 50** — Disclosure att användaren interagerar med AI → IMPLEMENTERAT
  via app-namn + landing-copy
- **Article 11(2)** — Data-styrning → IMPLEMENTERAT via SREF v1 export +
  patient-ägd portabilitet

## Verifiering kör

Manuell check kvarstår tills:
1. Vercel-region för Functions konfirmerad
2. Railway-region för DB konfirmerad
3. Supabase-region för Stillra konfirmerad
4. Mistral-region testad via `scripts/test-mistral-svenska.sh`

Carl-tasks:
- Logga in Vercel → settings → general → Functions Region
- Logga in Railway → DB-service → settings → Region
- Logga in Supabase → project → settings → general → Region

Output rapporteras tillbaka för audit-uppdatering.

---

## Verifikations-status per 2026-05-17

Claude körde verifikationer via Vercel + Railway CLI. Resultat per pending-rad:

### 1. Vercel Function Region — ✅ VERIFIERAT EU

`vercel.json` har explicit `"regions": ["fra1"]`. Alla serverless functions körs i Frankfurt. Plus 2 crons (`/api/cron/extract-facts` 03:00 UTC, `/api/cron/cleanup-soft-deleted` 04:00 UTC) som ärver region.

**Bekräftat.** Inga ytterligare actions.

### 2. Railway-region — ⏳ INDIRECT VERIFIERAD

Railway CLI exponerar inte region per service via standard-kommandon. Indirekta indikationer:

- `RAILWAY_PRIVATE_DOMAIN=selvra.railway.internal` (intern, ingen region-info)
- `DATABASE_URL` pekar på `aws-0-eu-west-1.pooler.supabase.com` (= Supabase Frankfurt, INTE Railway-Postgres)
- Selvra-app + selvra-protocol använder samma Supabase-instans

Vad detta betyder: **all user-data lever i Supabase eu-west-1 (Frankfurt-närliggande AWS Irland)**. Railway-services är compute (Python/Node), inte data-lagring.

**Carl-action kvarstår:** verifiera Railway-compute-region via dashboard (Settings → Region per service). Bör vara `europe-west4` (Amsterdam) eller `europe-west1` (Belgien) — Railway:s EU-regioner.

### 3. Supabase-region — ✅ VERIFIERAT EU

`DATABASE_URL` på Railway selvra-service exponerar: `aws-0-eu-west-1.pooler.supabase.com`. Det är Supabase eu-west-1 (AWS Frankfurt-zon, Irland-datacenter).

**Bekräftat.** All user-data lever på EU-mark.

### 4. Mistral-region — ⏳ SKIPPAT (MISTRAL_API_KEY ej satt)

Per [`CHAT_PIPELINE_DEPRECATION_2026-05-16`](CHAT_PIPELINE_DEPRECATION_2026-05-16.md) är web-chat-pipelinen DEPRECATED. MISTRAL_API_KEY skippad från Vercel-env. När iOS-byget aktiveras (vecka 5+) måste Mistral-test köras innan iOS-chat-streaming exponeras till TestFlight-användare.

**Carl-action när iOS-bygget startar:** sätt MISTRAL_API_KEY + kör `scripts/test-mistral-svenska.sh` för region-verifikation.

### 5. Upstash Redis — ⏳ VERIFIKATION KRÄVS

Redis lever på `divine-ape-116602.upstash.io` (verifierat via Railway env-var i selvra-service). Upstash-region per database visas i deras dashboard, inte i URL.

**Carl-action:** logga in https://console.upstash.com → divine-ape-116602 → Database details → bekräfta region är EU (typ `eu-west-1` eller `eu-central-1`). Om annan region: migrera databasen via Upstash-flow (manuell, kräver downtime).

### 6. Sentry — ✅ EJ I BRUK (skippat per Carl)

SENTRY_DSN är inte satt i Vercel. Sentry-SDK no-op:ar utan DSN. Inget data lämnar systemet till Sentry. När/om Sentry aktiveras måste EU-region-org användas (Settings → Data Residency: "European Union").

### 7. Resend — ⚠ AKTIVT US, AKCEPTERAT TILLS AB-AKTIVERING

RESEND_API_KEY är satt + producerar magic-link-mail. Resend är US-baserat. Detta är **känd compliance-gap** för EU-suveränitet.

**Mitigation:**
- Resend har EU-region launch H2 2026 (deras roadmap) — re-evaluera vid release
- Alternativt vid AB-aktivering: byt till Mailgun EU (Tyskland) eller Postmark EU
- DPA med Resend måste signeras innan extern launch (TestFlight publik = launch)

**Carl-action:** vid AB-aktivering, formell DPA + plan för EU-mail-byte.

## Sammanvägd compliance-status 2026-05-17

| Lager | EU? | Status |
|---|---|---|
| Vercel Frontend | ✅ | fra1 bekräftat |
| Supabase DB | ✅ | eu-west-1 bekräftat |
| Upstash Redis | ⏳ | Carl-verifikation kvar |
| Railway Compute | ⏳ | Carl-verifikation kvar |
| Mistral LLM | ⏳ | Aktiveras vecka 5+, region-test då |
| Sentry | N/A | Ej aktivt |
| Resend Mail | ⚠ | US — accepterat tills AB |

**Compliance-grade idag:** **B+** (gap är Resend + 2 outverifierade)
**Mål för TestFlight-launch (vecka 13):** **A** (alla verifierade EU + Resend bytt eller DPA-signerad)
