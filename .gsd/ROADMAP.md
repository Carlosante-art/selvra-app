# ROADMAP.md — selvra-app

## North star

Carl öppnar selvra-app söndag morgon och får ett brev som speglar veckans
gap mellan vad han sa att han ville, vad han skrev under veckan, och vad
Dexcom/Garmin/Apple Health faktiskt visade. Han känner sig sedd — inte
övervakad. Han skriver tillbaka en mening. Det blir källa för nästa veckas
brev.

## Milestones

### M1 — Scaffolding + canonical doctrine
**Goal:** Repo finns, design är låst, framtida sessioner kan plocka upp
utan friction.
**Done when:** Repo på GitHub, DESIGN.md komplett, AGENTS.md fyller sitt
syfte, dev-server startar.
**Status:** done (2026-05-10)

### M2 — Onboarding-flow renderbar end-to-end
**Goal:** Alla 5 steg är klickbara, intentioner sparas (lokalt först),
"klart"-skärmen visas.
**Done when:** Carl kan gå igenom hela flödet i dev. Inget backend än —
state hålls i sessionStorage eller liknande.
**Status:** not started

### M3 — Protokoll-integration + persistent auth
**Goal:** Magic-link login funkar; intentioner sparas i Selvra-protokollet
via HTTP-fasaden; subject-tenant skapas vid första onboarding.
**Done when:** Carl loggar in från ny enhet och ser sina intentioner.
**Status:** not started

### M4 — TerraAdapter + första riktiga källa
**Goal:** Carl kan koppla Dexcom (eller Apple Health) via Terra och se att
events landar i protokollet.
**Done when:** En händelse från Carls riktiga CGM finns som event i
protokollet, attribueras till källan i en provenance-test.
**Status:** not started

### M5 — Första reflektion genererad mot riktig data
**Goal:** Reflektions-motorn i protokollet kan ta Carls intentioner +
self-report + Terra-events och producera en exempel-reflektion. Inte
prod-kvalitet — proof-of-loop.
**Done when:** Carl ser en riktig (om än grov) reflektion som inte är
hårdkodad.
**Status:** not started

### M6 — Söndag-leverans + dialog-yta
**Goal:** Reflektion genereras automatiskt söndag morgon. Tankar-yta är
alltid tillgänglig och kopplas till nästa reflektion.
**Done when:** Carl har dogfoodat två söndagar i rad utan handpåläggning.
**Status:** not started

## Rejected / parked

- Anonymous-first onboarding — doktrinärt skarpare men data-arkitektur-
  friktion. Parked till Phase 2.
- Native iOS + ambient korta reflektioner — Phase 2 efter web validerats.
- Lager 3 (AI-konversation-import) — power-user-feature, inte v1-beroende.
- Vertikal-orkestrering (Stillra-shell, etc.) — separat tråd, skippas i
  selvra-app-arkitekturen.
