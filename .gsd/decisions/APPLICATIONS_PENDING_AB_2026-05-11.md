# Applications pending AB-approval

**Beslut taget 2026-05-11 av Carl.**
**Status: alla externa service-registreringar deferred tills AB är godkänt.**
**Förväntad tidshorisont: 2-3 veckor (AB-registrering pågår).**

---

## Bakgrund

Carl registrerar AB (Selvra Protocol AB eller liknande, namn TBD).
Aktiekapital 25 000 kr. Bank kontaktas 2026-05-11.

Alla externa service-relationer (OAuth-providers, transactional mail,
wearable-aggregators) ska etableras under bolagets namn, inte personligt
konto. Skäl:

1. **Konsistent identitet i user-consent-screens** — användare som ger
   Selvra permission att läsa deras Strava/Calendar/Gmail ser
   "Selvra Protocol AB", inte "Carl Karjalainen Joels".
2. **Billing + bokföring renare** — alla SaaS-fakturor faktureras AB
   från dag 1.
3. **Compliance** — vissa providers (Garmin) kräver legal entity ändå;
   andra (Strava, Google) accepterar individuell men byter är friktion.

Avgränsning: detta gäller **externa service-relationer**. Interna
provisioneringar i existerande Railway-konto (lägga till en Postgres-
tjänst, deploy:a Open Wearables) kan om-så-önskas vänta också, men har
ingen extern relation som skulle ändras post-AB. Carls preferens
2026-05-11: vänta även dessa för konsistens.

---

## Lista över pending applications

### Tier 1 — externa service-registreringar (kräver AB-identitet)

| Service | Vad | Unblocks | Status | Kostnad |
|---|---|---|---|---|
| **Resend** | Transactional mail för Magic-link | Slice 1 — Magic-link wiring | Pending AB | Free tier räcker dogfood |
| **Strava OAuth-app** | OAuth-credentials för Strava-data | Slice 3 — Strava activity-flow | Pending AB | Free |
| **Google Cloud Console + OAuth-app (Cal + Gmail)** | OAuth för Calendar + Gmail-metadata | Slice 2 — Google sources | Pending AB | Free tier räcker dogfood |
| **Spotify Developer-app** | OAuth för lyssnings-data | v1.1 — soft-include | Pending AB | Free |
| **Garmin Connect Developer Program** | OAuth + Webhook access (enterprise-only) | Garmin direct integration | Pending AB **+ approval** (kan ta veckor utöver AB) | Free men approval-baserat |
| **Apple Developer Program** | Apple ID för iOS-app, HealthKit-SDK senare | iOS-shell Phase 2 | Pending AB | $99/år |
| **Domain verification: selvra.ai DKIM/SPF** | Mail-avsändning som noreply@selvra.ai | Resend mail-domain polish (v1.1) | Pending AB + Resend | Domain redan ägd |

### Tier 2 — Railway-interna provisioneringar (inte externa relationer)

| Service | Vad | Unblocks | Status |
|---|---|---|---|
| **Railway Postgres för selvra-app** | App-DB för Auth.js + ev. token-storage | Slice 1 (Magic-link wiring) + Slice 3 (DB-baserad token-storage) | Pending AB per Carl-preferens 2026-05-11 |
| **Open Wearables Railway-deploy** | 7-service stack (Postgres, Backend, Frontend, Redis, Celery, etc.) | Slice 8 + framtida Garmin/Polar/Whoop via Open Wearables | Pending AB per Carl-preferens 2026-05-11 |

### Tier 3 — admin-actions som inte är "ansökningar"

| Action | Vad | Status |
|---|---|---|
| `openssl rand -base64 32` för AUTH_SECRET | Generera secret för Auth.js | Trivial, görs vid wiring-tid |
| Drizzle migrate på Railway Postgres | DB-tabeller för Auth.js | Trivial, körs när Postgres provisioned |
| Seed Stillra-tenant-mappning i subject_aliases | Carls alias för dogfood | **Klart 2026-05-11** (b3a87256 → 2bfe0414) |

---

## Vad detta betyder för pågående arbete

### Stoppas

- **Magic-link wiring** (Slice 1 finish) — väntar på Resend + DB
- **Strava data-flow** (Slice 3 wiring) — väntar på Strava OAuth-app
- **Google OAuth** (Slice 2 — Cal + Gmail) — väntar på Google Cloud + AB-identitet
- **Open Wearables-deploy** (Slice 8) — väntar AB
- **Synthesis prompt v0.3-v0.5 mot fullständig data** — väntar på källor
- **Brev v0.3 verifiering av Selvras tes** — väntar på fullständig data

### Kan fortsätta utan extern aktivering

- ✓ **Slice 4** (Subject-aliasing): klar
- ✓ **Slice 6** (Visual design grundnivå): klar
- → **Slice 9** (SREF-export UX): pure code, ingen extern dependency
- → **Slice 7** (Onboarding-glue + Signal-opt-in UI): pure code, DB-storage
   stub:as tills DB anländer
- → **Slice 2** (Google OAuth) **scaffold**: code mirrors Strava-scaffold,
   inga creds behövs förrän aktivering
- → **Synthesis prompt-iteration** mot **existerande data** (intentions
   + tankar + Dexcom via Path C) — kan fortsätta refining v0.2 → v0.3
   inom nuvarande substrat
- → **Tech-debt-betalning** — t.ex. ta bort hardcoded fallback i synthesis
   när alias-rad stabiliserats, RLS-policy-design för subject_aliases
- → **Dokumentation**: STATE.md, README, design-docs

---

## Re-engagement vid AB-godkännande

När AB är godkänt + konton:

1. **Carl:** Skapa konton/OAuth-apps i ordning Resend → Strava →
   Google → Open Wearables under AB-namn.
2. **Claude Code:** Wire:a varje konton-set en åt gången till befintlig
   scaffold. För varje koppling: kör smoke-test (skicka magic-link,
   syncha Strava-aktivitet, hämta Google Calendar-event).
3. **Carl + Claude Code:** Brev v0.3 mot fullständig data — verifiera
   eller falsifiera Selvras gap-tes.

Tids-estimat post-AB för wiring: 4-6 dagar (mindre än scaffold-fasen
eftersom infrastruktur redan finns).

---

## Referenser

- Streamlined-v1-scope: `STATE.md` "Next up"-sektionen
- Source-strategi: `SOURCE_STRATEGY_PIVOT_2026-05-11.md`
- Subject-aliasing: `SUBJECT_ALIASING_OPEN_QUESTION_2026-05-11.md`
