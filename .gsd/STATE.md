# STATE.md — selvra-app

## Where I am

**Full dogfood-loop levande:** intentions-input, tankar-yta, brev-rendering
(exempel) byggda och pushade. Carl har 5 intentioner + 1 tanke i prod-Selvra.
**Source Strategy Pivot Fas 1 klar** — Path C verifierad mot Carls 5095
glucose_readings via cross-DB readonly. Next-up: Open Wearables Fas 2
(deployment) för Garmin/Strava, eller dogfood-vecka för att samla substrat
inför synthesis-arbete.

## Last session, jag gjorde

### Tidigt i sessionen
- Lockat full produktdoktrin: gap-tesen, reflektions-format (10 designval),
  self-report-arkitektur (3 lager), onboarding-flow (5 steg),
  source-adapter-arkitektur, moat-positionering
- Lockat fyra canonical positionerings-fraser i DESIGN.md §1
- Scaffold:at Next.js 16 + TS + Tailwind v4 repo (`Carlosante-art/selvra-app`)
- Skrivit `INTENTIONS-PLAN.md` med implementation-spec

### Sent i sessionen (Steg A — JWT-acquisition + protokoll-verifiering)
- Seedat tenant i prod-Selvra:
  - Tenant ID: `312f157b-0f84-4ea4-a306-ef84640f4357` (individual, "Selvra App (Carl)")
  - Source ID: `selvra-app`
  - ScopeDeclaration: alla event-kategorier tillåtna
  - TrustRecord: 0.85 initialt (efter första event: 0.87)
- JWT-secret genererat och sparad i `~/selvra-app/.env` (gitignored):
  `b31d6179984a982c216dd2e36deaf6059e8f264013a62cb42a4531507996d53f`
- Selvras `MCP_JWT_SECRETS` uppdaterat på Railway (3 secrets nu: Stillra +
  rotations-key + selvra-app). Service redeployad utan downtime.
- Stable `sub`-UUID för selvra-app:s JWT-claims:
  `d4484381-6936-4c42-94ba-af515987ab53`
- Consent beviljat för (`tenant`, `subject`, `sub`, `resource_type`) över
  alla tre resource types: snapshot + divergences + provenance
- Carl's `subject_id` (UUID5): `2bfe0414-56c6-5692-8ef3-9c7d3991fe90`
  (derived från tenant + external "carl")
- **End-to-end verifierat:**
  - GET `/v1/subjects/{id}/snapshot` → 200 (tomt, förväntat)
  - POST `/v1/subjects/{id}/events` med
    `event_type: "selvra.intention.declared"` → 201, Moderator
    accepterade, event_id `bddd4eec-68ae-4738-8d50-34705a89bbad`

### Pushade commits (selvra-app)
- `d07c242` scaffold
- `b6eccf1` reflektion-ordval canonical
- `18939e1` reflektionen-är-produkten canonical
- `256a52f` STATE.md med locked next-session plan
- `b3a2536` INTENTIONS-PLAN.md från Steg 0 reading

## Last session — 2026-05-11 (eftermiddag)

- ✅ **Steg B**: `src/lib/protocol/client.ts` + types.ts. jose-JWT-signing,
  declareIntention() + recordThought() + getSnapshot(). Build + live
  smoke-test passade.
- ✅ **Steg C**: `app/onboarding/intentions/page.tsx` Server Action-form
  med 5 self_directed-rader + 4 delivery_rhythm-radios. Carl deklarerade
  3 intentions + sunday_morning live → 4 events i prod-Selvra (Moderator
  accept, trust 0.85→0.87).
- ✅ **Steg D**: `app/onboarding/intentions/confirm/page.tsx` Server
  Component som anropar getSnapshot. Snapshot tom p.g.a. projection-saknad
  — flaggat, defer:at per Carl-beslut.
- ✅ **Steg E**: Landing `Börja` → `/onboarding/intentions`.
- ✅ **Tankar-yta (Lager 2)**: `/thoughts`-route med textarea + Server
  Action. event_type `selvra.thought.recorded`. Carl skrev första tanke:
  *"Jag vill att det gör jag gör ska ha ett syfte..."* — bekräftad live.
- ✅ **Brev-rendering**: `/brev`-route med Carl-specifik exempel-brev
  baserad på hans riktiga intentioner + tanke. Brev-metafor, käll-
  attribuering, observation-grounded fråga, källor-footer, inbäddad
  tanke-yta. Designval 1-10 testbara i pixlar.
- ✅ **Source Strategy Pivot beslutat och Fas 1 genomförd**:
  - Terra → Open Wearables för Garmin/Strava (self-hosted, MIT, EU)
  - Path C för Dexcom via cross-DB readonly mot Stillra-Supabase
  - K2-bred GRANT exekverad — 27 tabeller läsbara
  - `StillraGlucoseReading` Pattern-1-modell byggd (selvra-repo commit
    `b0af34b`). Verifierat mot Carls 5095 readings.
- ✅ **Subject-aliasing-fråga** dokumenterad i
  `.gsd/decisions/SUBJECT_ALIASING_OPEN_QUESTION_2026-05-11.md`. Blocker
  innan synthesis-pipeline.

## Next up

Tre kandidater:

### A) Open Wearables Fas 2-5 (deployment)
Per pivot-doc. Clone, deploya på Railway, webhook-receiver i Selvra,
källtoggling-vy i selvra-app, Carl kopplar Garmin. **Tids-estimat: 3-5
dagar fokuserat.** Stort men avgränsat. Levererar fullt source-flöde
för aktivitets-data.

### B) Dogfood-vecka utan ytterligare bygg
Carl skriver tankar dagligen, ackumulerar substrat. Kollar /brev-formatet
i praktiken. När veckan är slut har vi material för synthesis och
empiriskt-grundad design-iteration. **Tids-estimat: 0 kod-arbete, 7
dagars data-ackumulering.**

### C) Synthesis-pipeline-skiss
Med Carls data redan i Selvra + Path C för CGM, kan första riktiga
synthesis-prototypen byggas. Reads intentions + tankar + senaste 7 dagars
glukos från Stillra → Anthropic API → reflektions-prosa. Bygger på
Subject-aliasing-fråga som måste lösas (Alt 4 hardcoded mapping för v0).
**Tids-estimat: 1-2 dagar för proof-of-loop, mer för polish.**

Min lutning: **B först (parallell med inget annat krävande), sen C när
substrat finns**. A kan komma efter eller parallellt om Open Wearables-
self-hosting känns aptitligt. Men inget brådskar — du har redan tre lager
av input klart (intention + tanke + Dexcom via Path C).

## Blockers

- **Källa-fråga (parkerad)** — Apple Health är web-only-problematisk.
  Cloud-side alternativ: Garmin Connect, Oura, Whoop, Strava, Fitbit,
  eller Dexcom. Inte blockerande för intentions-input — blockerar
  Terra-integration som kommer senare.
- **Reading-projection** — se Reading-back-problemet ovan.

## Notes for future-me

- **`.env` i `~/selvra-app/`** innehåller JWT-secret + tenant_id +
  sub_uuid + external_id. Gitignored. **Tappa inte det här filet** — om
  secret förloras måste seed_vertical_tenant.py köras om och Railway
  uppdateras manuellt.
- JWT-shape som funkar (verifierat 2026-05-10 sent):
  ```json
  {
    "sub": "d4484381-6936-4c42-94ba-af515987ab53",
    "tid": "312f157b-0f84-4ea4-a306-ef84640f4357",
    "subjects": ["2bfe0414-56c6-5692-8ef3-9c7d3991fe90"],
    "scopes": ["read", "write"],
    "iss": "selvra",
    "exp": <unix-time, max +900s>
  }
  ```
  Algoritm: HS256. Token max-age 900s (15 min) — implementera refresh-
  logik i client.ts.
- **DESIGN.md i repot är canonical lock-dokument.**
- "kör bara" / "kör" = explicit verkställan-trigger.
- **Carl-refinement på `IntentionDeclared`:** `intent_type` med två
  varianter (`self_directed`, `delivery_rhythm`). Inte re-litigerbart.
- **Consent-gotcha (lärdom 2026-05-10):** Selvra har consent-lager
  ovanpå JWT-auth. Reads (snapshot/divergences/provenance) kräver
  ConsentGrant. Writes (events) gör inte. `sub` i JWT måste vara stabilt
  UUID + grantad för att reads ska fungera.
- Synthesis-pipeline (req #4 av dogfood-planen) lever i `~/selvra/`,
  inte selvra-app. Multi-repo-arbete när det startas.
- Vertikalerna (Stillra/Motiq/Elefant) är *inte* aktivt i denna repo.
