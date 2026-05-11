# STATE.md — selvra-app

## Where I am

**selvra-app live på prod: https://selvra-app-production.up.railway.app**

Streamlined-v1 efter 2026-05-11-session:

- ✓ **Slice 4** (Subject-aliasing) — full + prod-deploy
- ✓ **Slice 6** (Visual design grundnivå) — nav + footer + typography
- ✓ **Slice 7** (Signal-opt-in + 5-step onboarding-flow) — full wiring
- ✓ **Slice 9** (SREF-export UX) — full, verifierad mot prod
- 🟡 **Slice 1** (Magic-link) — scaffold, väntar Resend/DB/AUTH_SECRET
- 🟡 **Slice 2** (Google OAuth) — scaffold, väntar GOOGLE_CLIENT_ID/SECRET
- 🟡 **Slice 3** (Strava OAuth) — scaffold, väntar STRAVA_CLIENT_ID/SECRET
- ⬜ **Slice 5** (Synthesis v0.3 mot full data) — AB-blocked
- ⬜ **Slice 8** (Open Wearables deploy) — AB-blocked

Plus public deploy av selvra-app till Railway: ny tjänst i
distinguished-simplicity-projektet, 9 env-vars satta (alla utom
AB-deferred), URL genererad. All 9 routes svarar 200 från prod-URL.

AB-registrering startad 2026-05-11. Pending: alla externa OAuth-providers
+ Resend + Postgres-provision (per APPLICATIONS_PENDING_AB-doc).

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

## 2026-05-11 (eftermiddag) — synthesis-pipeline-skiss levererad

**Stor milstolpe: första riktiga reflektionen från Claude Opus, genererad
mot Carls verkliga data, renderad i `/brev`.**

### Protokoll-sidan (`~/selvra/`, commits f266ad9 + 8b15506 + 6c8614a)

- `src/selvra/representation/reflection_synthesis.py` — synthesis-logik
  som plats:ar på existerande infrastruktur (call_layer3 via multi-provider
  router, EventStore.append, ProjectionEngine). Data-gathering från tre
  källor: intentions (Selvra event-log), tankar (samma), glucose (Stillra-
  Supabase via Path C). Prompt med 10 designval-positionerna inbakade.
  Output persisteras som `selvra.reflection.generated`-event och
  projiceras till `synthesis_snapshots`-tabellen.
- `scripts/synthesize_carl_reflection.py` — CLI-trigger för proof-of-loop.
  Run via `railway run -- ./.venv/bin/python scripts/synthesize_carl_reflection.py`.
- `GET /v1/subjects/{id}/reflections/latest` läs-endpoint för senaste
  projicerade SynthesisSnapshot. Optional ?synthesis_type-filter.

### selvra-app-sidan (commits b87d545)

- `getLatestReflection()` i protocol-client.ts (JWT-signerad GET).
- `/brev/page.tsx` byter ut hardcoded exempel mot live fetch. Rendrar
  vecka-nr + genereringstid + model + paragrafer (sista får källor-styling).
  Empty-state om 404. Error-state om annan failure. Tankar-input behåller
  designval 10 (alltid tillgänglig).

### Bevisat live

- **Inputs:** 5 intentions + 2 thoughts + 1735 glucose readings
- **Model:** claude-opus-4-20250514
- **Output:** 1299 chars svensk brev-form
- **Designval respekterade:** käll-attribuering, andra-person-passiv,
  mönster-OK-prescription-INTE, max-1-fråga, källor-i-footer, brev-form,
  ingen klinisk tolkning, svenska prosa
- **Gap-detektering bekräftad:** LLM noterade självt eko mellan intention
  "Ha intention när jag gör något" och Carls lördags-tanke om syfte. Det
  är doktrinens hjärta i kod.

### Tidigare i sessionen (2026-05-11 eftermiddag)

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

C levererad. Naturliga next-slices:

### Polish & auto-trigger
- **Söndag-cron** i `~/selvra/`: scheduled Celery-task som triggar
  `synthesize_carl_reflection` veckovis enligt user-deklarerad
  delivery_rhythm. Stillra-cron-pattern finns redan att kopiera.
- **HTTP-route plats:as in:** ersätt synthesize-route-stubben i
  `~/selvra/src/selvra/http/routes/synthesis.py` med riktig anrop till
  `reflection_synthesis.synthesize_for_subject()`. Generaliseras från
  hardcoded Carl till alla subjects.
- **selvra-app: trigger-knapp** för manuellt generera brev när Carl vill
  (utöver scheduled). Anropar POST /v1/subjects/{id}/synthesize.

### B (dogfood-vecka) — pågående, Carls del
Carl skriver tankar via `/thoughts`, lever med intentionerna. Substrat
ackumuleras. Varje gång han kör `synthesize_carl_reflection`-scriptet
genereras ett nytt brev med uppdaterad data. Empiriskt-grundad
prompt-iteration baserat på vad som faktiskt landar.

### Subject-aliasing formalisering
Alt 4 hardcoded fungerar för Carl-v0 men måste ersättas innan multi-user.
Beslut mellan Alt 1 (alias-tabell), Alt 2 (SREF-as-input), Alt 3 (external
identity som primär). Se `decisions/SUBJECT_ALIASING_OPEN_QUESTION_2026-05-11.md`.
Tas innan synthesize-route generaliseras.

### A (Open Wearables Fas 2-5) — fortfarande parkerat
Per pivot-doc. Garmin/Strava via self-hosted Open Wearables. Inte i
kritisk väg för dogfood — Dexcom + intentions + tankar räcker för loop-
validering. Återupptas när tesen är bevisad eller motbevisad.

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
