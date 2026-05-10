# STATE.md — selvra-app

## Where I am

Protokoll-integration **fungerar end-to-end**. JWT-mint signering verifierad,
första intention-event live i prod-Selvra. selvra-app-sidans UI är inte
byggt än — det är nästa.

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

## Next up — selvra-app UI (Steg B-E från INTENTIONS-PLAN.md)

Protokoll-sidan är klar. Allt arbete ligger nu i selvra-app-repot.

- [ ] **Steg B — `src/lib/protocol/client.ts`** med JWT-signing helper
      (npm `jsonwebtoken` eller `jose`). Konsumerar `.env`-värden:
      `SELVRA_PROTOCOL_URL`, `SELVRA_PROTOCOL_JWT_SECRET`,
      `SELVRA_TENANT_ID`, `SELVRA_APP_SUB_UUID`, `SELVRA_SUBJECT_EXTERNAL_ID`.
      Exporterar `declareIntention(payload)` + `listIntentions()`.
- [ ] **Steg C — `app/onboarding/intentions/page.tsx`** (Client
      Component). Form: 5 textfält för `self_directed` + 4 radio-options
      för `delivery_rhythm`. Server Action submit.
- [ ] **Steg D — `app/onboarding/intentions/confirm/page.tsx`**
      Round-trip vy. *Problem flaggat:* snapshot returnerar tomt eftersom
      ProjectionEngine inte projicerar `selvra.intention.declared` till
      ProfileFacts. Två lösningar — se nedan.
- [ ] **Steg E — Uppdatera landings `Börja`-knapp** att peka till
      `/onboarding/intentions`.

### Reading-back-problemet

Snapshot returnerar tomt trots att event är skrivet, eftersom
ProjectionEngine inte har en projector för `selvra.intention.declared`.
Två vägar för att stänga loopen:

(a) **Lägg projection-regel i `~/selvra/src/selvra/representation/projections.py`.**
    `IntentionDeclared` → ProfileFact med `key: "intention.{intent_type}.{ord}"`,
    `value: text/value`, mutability/persistence per `temporal_validity`. ~1h +
    PR + redeploy. Doktrinärt rent.

(b) **Lägg `GET /v1/subjects/{id}/events?event_type=...` endpoint** för rå-
    events-läsning. Mer återanvändbart för framtida queries. ~1–2h + PR.

Min lutning (innan god natt): **(c) Defer reading helt i denna slice**.
Bygga write-flödet i selvra-app först. Carl kan verifiera writes via
direkt-DB-query eller curl mot events. Reading kommer i nästa parallell
mini-slice. **Beslutet är inte låst — re-bekräfta när du börjar Steg B.**

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
