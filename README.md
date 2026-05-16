# selvra-app

Backend för Selvra konsument iOS-app. Bevarar landing-sida + REST-API.

> "Spegling och lättnad. På mätdata och ord. Det är framtiden."

## Vad det här repot ÄR (2026-05-16)

| Lager | Syfte |
|---|---|
| **Backend (`src/lib/*`, `src/app/api/*`)** | REST + streaming-API för framtida iOS-klient |
| **Landing-sida (`/`)** | Pre-launch publik sida på selvra-app.vercel.app |
| **Auth-flöden (`/login`, `/api/auth/[...nextauth]`)** | Magic-link via Resend (scaffold) + Apple Sign-in (vecka 5+) |
| **Privacy (`/privacy`)** | GDPR + EU AI Act-compliance |
| **Backend-tester (`tests/*`)** | pg-mem-integration + pure-function-tester (315 tester) |

## Vad det här repot INTE är

- Inte konsument-appen själv (det är `selvra-ios`-repot, byggs vecka 4+)
- Inte Stillra (separat repo, klinisk B2B)
- Inte Selvra-protokoll (~/selvra, infrastruktur)

## Aktiv strategi

Per `.gsd/SELVRA_PRODUCT_V1_DEFINITION_2026-05-16.md`:
- iOS-only pivot från webb-UI per `.gsd/SELVRA_CONSUMER_IOS_PIVOT_2026-05-16.md`
- Backend bevaras (60% platform-agnostic)
- Webb-UI arkiverat i branch `archive/web-consumer-2026-05-15`
- iOS-projekt setup startar vecka 4 efter AB-aktivering

## Tekniska beslut

| Lager | Val |
|---|---|
| Backend | Next.js 16 App Router (Server Components + REST + NDJSON-streaming) |
| Database | PostgreSQL via Drizzle ORM (Railway, EU-region) |
| Auth | Auth.js v5 (magic-link) + Apple Sign-in token-exchange (vecka 5) |
| LLM | Mistral Large (Paris) — EU-suverän, primär. Anthropic EU-tier som fallback |
| Hosting | Vercel (Function Region: EU verifierad i `.gsd/EU_HOSTING_VERIFICATION_2026-05-16.md`) |
| Observability | Sentry (EU-region, init när `SENTRY_DSN` satt) |
| Säkerhet | CSP, HSTS, X-Frame-Options i `next.config.ts`. PII-scrub i logger. Auth-gate på alla privata endpoints |

## REST-endpoints (för iOS-konsumtion)

| Route | Metod | Vad |
|---|---|---|
| `/api/threads` | GET / POST | Lista trådar / skapa ny |
| `/api/threads/[id]` | GET / PATCH / DELETE | Single tråd (ägar-validerat) |
| `/api/threads/[id]/turns` | GET | Lista turns kronologiskt |
| `/api/memory/facts` | GET | Lista conversation_facts (filter per type + source) |
| `/api/memory/facts/[id]` | DELETE | Soft-delete extracted fact |
| `/api/memory/explicit` | GET | Lista explicita user-skrivna minnen |
| `/api/memory/explicit/[id]` | DELETE | Soft-delete explicit fakta |
| `/api/account` | GET | Konto-info + lifecycle-status |
| `/api/account/delete` | POST | Hård-delete konto |
| `/api/chat/stream` | POST | NDJSON-streaming chat |
| `/api/export/sref` | GET | SREF v1 JSON-export |
| `/api/export/ai-context` | GET | AI-context-export |
| `/api/auth/[...nextauth]` | * | Auth.js v5 handlers |
| `/api/oauth/{google,strava}/{init,callback}` | * | OAuth-flöden för källkoppling |

Full spec: `.gsd/IOS_API_SPEC_2026-05-16.md`.

## Köra lokalt

```bash
npm install
cp .env.example .env.local        # fyll i värden
npx drizzle-kit migrate           # mot din lokala/Railway DB
npm run dev
```

Mer detaljer: `.gsd/V1_E2E_VERIFICATION_2026-05-16.md` och `.gsd/FAS_1_SETUP.md`.

## Köra tester

```bash
npx vitest run                    # alla 315 tester
npx vitest run --watch
./scripts/preflight-check.sh      # tsc + eslint + vitest + build + audit
```

## Deploy

```bash
./scripts/vercel-env-push.sh      # pusha env-vars till Vercel
vercel deploy --prod
```

Live: https://selvra-app.vercel.app

## Repo-struktur

```
src/
├── app/
│   ├── api/              # REST + streaming endpoints (för iOS-konsumtion)
│   │   ├── threads/
│   │   ├── memory/
│   │   ├── account/
│   │   ├── chat/stream/
│   │   ├── export/
│   │   ├── auth/
│   │   └── oauth/
│   ├── page.tsx          # Landing pre-launch
│   ├── login/            # Magic-link auth-form
│   ├── privacy/          # Privacy policy (GDPR + EU AI Act)
│   └── layout.tsx
├── lib/
│   ├── api/respond.ts    # REST-respons-helpers
│   ├── auth/             # Auth.js config
│   ├── db/               # Drizzle schema + queries
│   ├── llm/              # Mistral (call + stream + tools + json-schema)
│   ├── observability/    # extract-facts, lock-validate, process-user-turn, source-markup, scrub
│   └── protocol/         # Selvra-protokoll-klient
└── components/           # Site-footer + UI-helpers (landing-only)

tests/                    # vitest (pg-mem + pure-function, 315 tester)
.gsd/                     # Strategi-docs (canonical: SELVRA_PRODUCT_V1_DEFINITION)
drizzle/                  # Migrations 0000-0003
scripts/                  # preflight-check, vercel-env-push, test-mistral-svenska
```

## Aktiva docs

| Doc | Innehåll |
|---|---|
| `.gsd/SELVRA_PRODUCT_V1_DEFINITION_2026-05-16.md` | **Canonical** — vad Selvra ÄR |
| `.gsd/SELVRA_IOS_V1_BUILD_PLAN_2026-05-16.md` | Vecka-för-vecka iOS-bygge-plan |
| `.gsd/IOS_API_SPEC_2026-05-16.md` | REST-endpoints för iOS |
| `.gsd/EU_HOSTING_VERIFICATION_2026-05-16.md` | Sub-processor-lista + EU-regions |
| `.gsd/APPLE_DEV_PREP_2026-05-16.md` | Apple Developer Program enrollment |
| `.gsd/BACKEND_AUDIT_2026-05-16.md` | Säkerhets-headers + bundle-baseline |
| `.gsd/V1_E2E_VERIFICATION_2026-05-16.md` | Backend-verifierings-procedur |

## Konstitutionella principer

Selvra ska aldrig veta mer än användaren (IF1). Käll-attribuering på varje
data-claim. Patient-ägd portabilitet via SREF v1. EU-suverän infrastruktur.
Aldrig manipulation (11 forbidden patterns enforced i `consumer-lock-validate.ts`).

Full lista i `.gsd/SELVRA_PRODUCT_V1_DEFINITION_2026-05-16.md` §4.

## Licens

Privat. Selvra är Carls projekt under aktiv utveckling. Kontakt: hello@selvra.ai.
