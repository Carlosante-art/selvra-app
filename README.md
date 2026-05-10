# selvra-app

Reflektions-väljaren ovanpå Selvra-protokollet.

Selvra läser källor du redan använder och speglar mönster mellan vad du
säger att du vill och vad datan visar att du gör. Inte en dashboard. Inte
en coach. Ett brev till dig själv, varje vecka.

## Status

v0.0.0 — scaffolding. Inget shippat publikt än. Carl är första användare.

## Dokument

- **[DESIGN.md](DESIGN.md)** — Canonical lock-dokument. Produktdoktrin,
  reflektions-format, self-report-arkitektur, onboarding-flow,
  adapter-pattern. Läs detta innan kod-arbete.
- **[AGENTS.md](AGENTS.md)** — Instruktioner till AI-assistenter som
  arbetar i repot.
- **[.gsd/STATE.md](.gsd/STATE.md)** — Aktuell session-state.
- **[.gsd/ROADMAP.md](.gsd/ROADMAP.md)** — Milstolpar.

Relaterade repos:

- `~/selvra` — Selvra-protokollet (event-sourced representation, HTTP-fasad
  live på `selvra-production.up.railway.app`).

## Quick start

```bash
npm install
cp .env.example .env   # fyll i värden
npm run dev
```

Öppna http://localhost:3000.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Lint code |

## Stack

- Next.js 16 (App Router, Server Components)
- TypeScript
- Tailwind v4
- Deploy: Railway (planerat)
- Backend: Selvra-protokollet via HTTP

## Licens

MIT — see [LICENSE](LICENSE).
