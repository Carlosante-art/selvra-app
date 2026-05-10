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

### Steg 0 — Pre-implementation reading (30–60 min, gör FÖRST)

- [ ] Läs `~/selvra/src/selvra/representation/schema.py` för att förstå
      event-struktur. `IntentionDeclared` ska följa befintligt mönster.
- [ ] Identifiera HTTP-routing-pattern i `~/selvra/`-fasaden (sannolikt
      FastAPI). Ny endpoint ska matcha konvention för `/v1/subjects/{id}/*`
      som redan finns (jfr `sref-export`-endpoint, PR #14 2026-05-10).

### Steg 1 — Protokoll-sidan (`~/selvra/`) — ~½–1 dag

- [ ] Definiera `IntentionDeclared`-event med **tre fält**
      (Carl-refinement 2026-05-10):
  - `intent_type`: `Literal["self_directed", "delivery_rhythm"]`
  - `text` (eller strukturerad payload för delivery_rhythm)
  - `temporal_validity` per event-sourced Princip 9

  Variant-fältet gör leverans-tajming till **observerbar intention som kan
  drifta**, inte settings-flagga. Doktrinärt konsistent med designval 6 +
  "reflektionen är produkten"-doktrinen. **Inte re-litigerbart.**

- [ ] Endpoints: `POST /v1/subjects/{id}/intentions` (skapar event) +
      `GET /v1/subjects/{id}/intentions` (returnerar aktuella per
      intent_type).
- [ ] Auth: hardcoded API-nyckel för dogfood, eller `selvra_app_writer`-roll
      likt Stillra-readonly-pattern. Magic-link senare.

### Steg 2 — selvra-app-sidan — ~½ dag

- [ ] Route `/onboarding/intentions` med klient-komponent. Formulär: upp
      till 5 free-text-rader för `self_directed` + 4 radio-options för
      `delivery_rhythm`.
- [ ] `src/lib/protocol/client.ts`-stub. Hardcoded `subject_id` (env-var) +
      protokoll-bas-URL från `.env`.
- [ ] Submit → POST → redirect till visnings-vy som GET:ar intentionerna
      tillbaka. **Round-trip sanity-check är hela testet.**

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
