<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may
all differ from your training data. Read the relevant guide in
`node_modules/next/dist/docs/` before writing any code. Heed deprecation
notices.
<!-- END:nextjs-agent-rules -->

---

## What this project is

**selvra-app** är reflektions-väljaren ovanpå Selvra-protokollet. Konsument-
app som låter användaren toggla källor (via Terra i v1) och få veckovis
strukturerade reflektioner baserade på gapet mellan vad hon säger att hon
vill, vad hon säger att hon gör, och vad datan visar att hon faktiskt gör.

**Läs `DESIGN.md` först.** Det är canonical lock-dokument för all design.
Pushback på något där kräver explicit re-locking i konversation.

## Audience / user

V1: Carl själv (solo founder, T1D, Dexcom-användare). Han dogfoodar appen.
Reflektionen levereras "för någon som har data men inte sammanhang".

## Tone & voice

- **Svenska först.** Engelska som secondary locale.
- **Declarativ, observational.** Inte coach. Inte motiverande.
- **Käll-attribuerad.** "Garmin visade X" — inte "du gjorde X".
- **Brev-metaforen** styr reflektions-textens form (se DESIGN §3).

## Stack & conventions

- Next.js 16 (App Router, Server Components)
- TypeScript
- Tailwind v4
- 2-space indent, single quotes där JSX inte är inblandat, semikolon valfria
- Server Components default; Client Components opt-in via `"use client"`

## Non-negotiables

- **Aldrig coach-språk.** "Du borde", "you should", "try to" → bug.
- **Aldrig prescriptive notifications.** Tillgänglighets-signal OK (max
  veckovis, faktabaserad). "Vi saknar dig" → bug.
- **Aldrig formulär-aktig self-report.** Inga "skala 1–10", inga weekly
  check-ins. Self-report är biprodukt av dialog/import — se DESIGN §4.
- **Aldrig dashboard-grafik.** Inga bar charts, inga trend-lines, inga
  ringar.
- **Käll-attribuering är obligatorisk** i all reflektions-text.

## Decisions already made

Se DESIGN.md. Höjdpunkter:

- Web responsivt först. Native iOS som Phase 2.
- Magic-link auth. Ej anonymous-first i v1.
- Terra som första (och enda v1) adapter.
- Reflektions-motor B-tunn i protokoll-lagret — inga domain-prompts än.
- Söndag som leverans-fallback. Per-intention rytm primärt.

## What's out of scope (v1)

- Vertikalerna (Stillra/Motiq/Elefant) — separat tråd
- Andra adapters än Terra
- iOS-native app
- Anonymous-first onboarding
- Public marketing-site (det är `selvra-landing`)

## Ask before doing

- Installera nya dependencies
- Ändra publik copy som inte härrör från DESIGN.md
- Force-push, branch-delete, eller annan destruktiv git
- Deploy till Railway
- Ändra adapter-interfacet när det är definierat
