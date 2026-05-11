# selvra-app

Reflektions-väljaren ovanpå Selvra-protokollet.

Selvra läser källor du redan använder och speglar mönster mellan vad du
säger att du vill och vad datan visar att du gör. Inte en dashboard. Inte
en coach. Ett brev till dig själv, varje vecka.

## Status

Pre-v1 dogfood-fas. Streamlined-v1-scope låst per Carl-direktiv
2026-05-11 (9 slices). Aktivering av externa OAuth-providers + Magic-link-
mail-flow deferred till post-AB (~2-3 veckor från 2026-05-11).

**Live:** https://selvra-app-production.up.railway.app

Levererat hittills:

- **Slice 4 — Subject-aliasing** (full): alias-tabell i protokoll-lagret,
  Carls Stillra-alias seedad, synthesis cross-tenant-resolution fungerar.
- **Slice 6 — Visual design grundnivå** (full): nav-header med
  active-state, footer med export-länk, typography polish.
- **Slice 7 — Signal-opt-in + 5-stegs onboarding-flow** (full): Steg 1-5
  wired (Landing → Login → Intentions → Källor → Signal → Klart).
- **Slice 9 — SREF-export UX** (full): `/export` med download-route som
  hämtar full representation från protokollets `/v1/subjects/{id}/sref-export`.
- **Slice 1 — Magic-link auth** (scaffold): Auth.js v5 + Drizzle + Resend
  konfigurerat, väntar AB för Resend-konto + Railway Postgres + AUTH_SECRET.
- **Slice 2 — Google OAuth** (scaffold): Cal + Gmail-metadata, väntar AB.
- **Slice 3 — Strava OAuth** (scaffold): aktivitets-OAuth, väntar AB.

Pending AB-godkännande:

- **Slice 5 — Synthesis prompt v0.3-v0.5 mot fullständig data**
- **Slice 8 — Open Wearables deploy-förberedelse**

## Dokument

- **[DESIGN.md](DESIGN.md)** — Canonical lock-dokument. Produktdoktrin,
  reflektions-format, self-report-arkitektur, onboarding-flow,
  adapter-pattern. Läs detta innan kod-arbete.
- **[AGENTS.md](AGENTS.md)** — Tone + non-negotiables för AI-assistenter.
- **[.gsd/STATE.md](.gsd/STATE.md)** — Aktuell session-state.
- **[.gsd/ROADMAP.md](.gsd/ROADMAP.md)** — Milstolpar.
- **[.gsd/decisions/](.gsd/decisions/)** — Strategiska beslut + öppna frågor:
  - `APPLICATIONS_PENDING_AB_2026-05-11.md` — externa registreringar deferred
  - `SOURCE_STRATEGY_PIVOT_2026-05-11.md` — Open Wearables + Path C
  - `SUBJECT_ALIASING_OPEN_QUESTION_2026-05-11.md` — multi-user-prep
  - `OPEN_WEARABLES_FAS_2-5_2026-05-11.md` — post-AB-aktivering

Relaterade repos:

- `~/selvra` — Selvra-protokollet (event-sourced representation, HTTP-fasad
  live på `selvra-production.up.railway.app`, subject_aliases-tabell aktiv).

## Quick start (local dev)

```bash
npm install
cp .env.example .env   # fyll i värden från seed-skript + AB-aktiverade tjänster
npm run dev
```

Öppna http://localhost:3000.

## Stack

- Next.js 16 (App Router, Server Components, Turbopack)
- TypeScript
- Tailwind v4
- Drizzle ORM + Auth.js v5 (Magic-link via Resend) — aktiveras post-AB
- jose för JWT-signering mot Selvra-protokollet
- Deploy: Railway (https://selvra-app-production.up.railway.app)
- Backend: Selvra-protokollet (`selvra-production.up.railway.app`)

## Adapter-arkitektur

Per DESIGN.md §2: en adapter per integration-yta, alla mot samma
protokoll-interface. Scaffold för Strava + Google klar; Open Wearables,
Spotify, AI-konversation-import kommer senare. Aktivering kräver
OAuth-credentials under bolagets namn (AB-deferred).

## Licens

MIT — se [LICENSE](LICENSE).
