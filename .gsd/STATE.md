# STATE.md — selvra-app

## Where I am

Scaffold + canonical doctrine: **done**. Repo på `Carlosante-art/selvra-app`,
build verifierad, dev-server fungerar. Fyra canonical doktriner låsta i
DESIGN.md. Inget byggt funktionellt än utöver landing-sidan.

## Last session, I...

- Lockat full produktdoktrin: gap-tesen, reflektions-format (10 designval),
  self-report-arkitektur (3 lager), onboarding-flow (5 steg),
  source-adapter-arkitektur, moat-positionering
- Lockat fyra canonical positionerings-fraser i DESIGN.md §1:
  1. *"Hon journalar redan i huvudet eller till ChatGPT — Selvra erbjuder
     bara en yta som dubblar som self-report-källa."*
  2. Brev-metaforen för reflektions-asymmetri
  3. "Reflektion" som ordval — anti-positionering mot Engramme/Mem0/PLM
  4. *"Reflektionen är produkten"* — motor genererar rätt reflektion per
     kontext. Pitch-i-en-mening: *"Selvra ger dig rätt reflektion om dig
     själv när du behöver den."*
- Scaffold:at Next.js 16 + TS + Tailwind v4 repo
- Pushat tre commits: scaffold (d07c242), reflektion-ordval (b6eccf1),
  reflektionen-är-produkten (18939e1)
- Lockat plan för nästa session: **intentions-input end-to-end** (se Next up)

## Next up — intentions-input end-to-end

Minsta möjliga slice som ger gripbart result. ~1–1½ fokuserad session.

### Steg 0 — Pre-implementation reading (DONE 2026-05-10 sent)

Resultatet ligger i `.gsd/INTENTIONS-PLAN.md` — läs den i stället för
att rekonstruera från koden. Höjdpunkter:

- Selvra har redan en **canonical generisk events-endpoint**
  (`POST /v1/subjects/{id}/events`). Ingen ny endpoint behövs i v1.
- `event_type`-konvention: `"selvra.intention.declared"` med
  `category: "data_ingested"`.
- Inga hårdkodade event_type-listor i projection/validation →
  systemet accepterar nya event_types generiskt.
- Protokoll-sidans arbete reducerat från ~½–1 dag till **~1–2 timmar**
  (eller noll om vi skippar Pydantic-payload-schema i v1).
- Huvudarbetet är på selvra-app-sidan: JWT-acquisition, client,
  UI-form, round-trip-vy.

### Steg 1 + Steg 2 — implementation

Detaljerad spec i `.gsd/INTENTIONS-PLAN.md`. Sammanfattning:

**Protokoll-sidan (~/selvra/):** Sannolikt ingen kod-ändring krävs för
minimal slice. Använd generisk `/v1/subjects/{id}/events` med
`event_type: "selvra.intention.declared"` + `category: "data_ingested"`.
Eventuell Pydantic-payload-schema är opt-in polish.

**selvra-app-sidan (huvudarbetet):**
- Steg A: Acquire JWT för Carl-tenant (kolla `~/selvra/scripts/` för
  create-tenant + JWT-script; sannolikt 30 min).
- Steg B: `src/lib/protocol/client.ts` med `declareIntention()` +
  `listIntentions()` (skiss finns i plan-doc).
- Steg C: `app/onboarding/intentions/page.tsx` (Client Component) med
  form (5 self_directed-rader + 4 delivery_rhythm-radios).
- Steg D: `app/onboarding/intentions/confirm/page.tsx` som GETtar och
  visar back. **Round-trip sanity-check är hela testet.**
- Steg E: Uppdatera landings `Börja`-knapp att peka till
  `/onboarding/intentions` (just nu går den till `/onboarding` som inte
  finns).

Carl-refinement på `IntentionDeclared` (locked): två varianter via
`intent_type`-fält. Detaljer i plan-doc.

### Medvetet utelämnat denna slice

- Edit / delete / multi-version-hantering — kommer när det blockerar något
- Magic-link auth — hardcoded `subject_id` räcker för dogfood
- Onboarding Steg 4 (källor) + Steg 5 (signal/klart)
- Terra-integration
- Synthesis-pipeline
- Reflektions-rendering

## Blockers

- **Källa-fråga (parkerad)** — Apple Health är web-only-problematisk
  (HealthKit on-device). För single-source dogfood behövs cloud-side
  alternativ: Garmin Connect, Oura, Whoop, Strava, Fitbit, eller acceptera
  Dexcom trots T1D-doft. **Inte blockerande för intentions-input** —
  blockerar Terra-integration som kommer senare.

## Notes for future-me

- **DESIGN.md i repot är canonical lock-dokument.** Läs det innan
  kod-arbete. Pushback på något där kräver explicit re-locking i
  konversation.
- "kör bara" / "kör" = explicit verkställan-trigger från Carl. Default är
  advisor-mode (se memory `feedback_selvra_app_advisor_mode.md`).
- **Carl-refinement på `IntentionDeclared` (2026-05-10):** två varianter
  via `intent_type`-fält, inte separat metadata-fält. Detta är *inte*
  re-litigerbart — synthesis-pipeline behöver kunna observera
  `delivery_rhythm`-drift som intention, inte settings.
- Synthesis-pipeline (req #4 av dogfood-planen) lever i `~/selvra/`, inte
  selvra-app. Multi-repo-arbete när det startas.
- Vertikalerna (Stillra/Motiq/Elefant) är *inte* aktivt i denna repo.
  selvra-app är reflektions-väljar-ytan.
