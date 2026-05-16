# Chat-pipelinens framtid — beslut 2026-05-16

**Datum:** 2026-05-16
**Status:** Beslut låst. Inte arbete för nu.
**Beslut:** Alt 3 — chat-pipelinen är DEPRECATED INTERNAL. Avvecklas vid iOS-port, inte tidigare.

---

## Vad detta är

Konstitutionellt beslut om vad selvra-app är. Inte en kod-fråga primärt — en positionerings-fråga.

Carl-analys 2026-05-16 efter inventering av selvra-app: *"Det är inte en kod-fråga primärt. Det är en konstitutionell fråga: är Selvra-app verktyget eller en chat-klient? Inventeringen visar att den just nu är både."*

---

## Bakgrund

Selvra-app har en chat-pipeline (`/api/chat/stream` + `process-streaming-user-turn-with-tools.ts` + tool-calling + NDJSON-streaming) som låter användaren prata med Selvra direkt i selvra-app. Den byggdes innan vi formulerade principen *"Selvra äger representationen, inte konversationen"* (CONVERSATION_SOURCE_ATTRIBUTION_2026-05-16.md i selvra-protocol) och Princip 11 *"Selvra är transkribering, inte tolkning"* (SELVRA_SPEC.md).

Pipelinen är **konstitutionellt felplacerad** i selvra-app om selvra-app är representations-yta. Den är **konstitutionellt OK** om selvra-app är chat-yta. Vi måste välja.

---

## Tre alternativ som övervägdes

### Alt 1 — Behåll + erkänn att Selvra-app är chat-yta

- Kod-arbete: noll
- Konstitutionell skada: hög — motsäger CONVERSATION_SOURCE_ATTRIBUTION explicit
- Långsiktig signal: "Selvra är AI-kompis-app som råkar ha protokoll-arkitektur"
- **Avvisat.** Bryter mot positioneringen som slowburn-pakten bygger på.

### Alt 2 — Ta bort chat-pipelinen nu

- Kod-arbete: radera ~1500 rader chat/streaming-kod (process-user-turn-varianter, chat/stream-route, tool-calling, UI-komponenter)
- Carl tappar daglig dogfood-yta tills iOS-port är klar (~12-18 månader enligt SELVRA_IOS_V1_BUILD_PLAN)
- Konstitutionell renhet: maximal
- **Avvisat.** För tidigt. Karl behöver dogfood-instrument under bootstrap-fasen.

### Alt 3 — Deprecated internt, dör vid iOS-port

- Kod-arbete: noll just nu (annotation + dokument). Tillkommande arbete = "ta bort selvra-app" vid iOS-port, vilket är ändå planerat.
- Konstitutionell skada: minimal. Pipelinen är inte exponerad till nya användare. Web-UI redan arkiverad till `archive/web-consumer-2026-05-15`.
- Långsiktig signal: ärlig — *"Vi byggde web-UI för att dogfooda protokollet under bootstrap. Sedan flyttade vi konsument-yta till iOS som per definition är en chat-klient utanför Selvra."*
- **Valt.** ✅

---

## Motivering till alt 3

### 1. iOS-pivot är aktiv

Per `CLAUDE.md` (selvra-app):
> *"Selvra konsument iOS v1 — primär aktiv utveckling. Repo: selvra-ios (skapas vecka 4 efter AB-aktivering). Backend bevaras i detta repo. Webb-UI arkiverad till branch archive/web-consumer-2026-05-15."*

Att rip:a chat-pipelinen nu = arbete på en kropp som ändå avvecklas inom 12-18 månader. Kostnaden är inte värd det när naturlig dödstid kommer.

### 2. Slowburn-pakten

Per `project_selvra_path_b_decision_2026-05-16` (Claude-memory):
> *"Gör rätt en gång, inte hastigt. 7-10 år mot 100k. Konstitution > scale."*

Alt 2 är hastigt — rip:a en intern dogfood-loop för konstitutionell-fidelity-signal som ingen extern ser idag. Det är inte hur slowburn arbetar.

### 3. Migration-planerna är redan synkade

`DUAL_FACT_EXTRACTION_MIGRATION_2026-05-16.md` (samma datum, samma `.gsd/`-katalog) säger explicit:
> *"Steg 3 påverkar selvra-app:s chat-pipeline. Om iOS-port deprekrerar selvra-app helt, är Steg 3 trivialt (allt försvinner)."*

Chat-pipelinens öde är redan kopplat till iOS-port-triggern. Beslutet idag bekräftar bara den kopplingen explicit.

---

## Vad detta beslut konkret innebär

### För kod

**Annotation överst i `src/app/api/chat/stream/route.ts`** (lagd som del av denna PR):

```
DEPRECATED INTERNAL — beslut 2026-05-16

Denna pipeline lever som Carl-dogfood-instrument under bootstrap.
Den är INTE exponerad till nya användare. Selvra-app:s konsument-yta
är pre-launch och web-UI är arkiverad till
archive/web-consumer-2026-05-15.

Konstitutionell positionering (per CONVERSATION_SOURCE_ATTRIBUTION i
selvra-protocol/docs/ och Princip 11 i SELVRA_SPEC):
  "Selvra äger representationen, inte konversationen.
   En LLM är en kanal, inte en sensor."

Denna pipeline motsäger den positioneringen genom att göra Selvra-app
till en chat-yta. Beslutet 2026-05-16: behåll tills iOS-port avvecklar
selvra-app helt — då försvinner chat-pipelinen med kroppen.

Regler under deprecation-perioden:
  - INGA nya features får byggas på denna pipeline
  - Bug-fixes endast om de blockerar dogfood
  - Ingen marknadsföring av endpointet till externa konsumenter
  - När iOS-pipelinen är produktions-redo: radera hela pipelinen i
    samma PR som arkiverar web-UI-trådar permanent
```

### För produkt-positionering

- **Marknadsföring:** Inga nämnanden av chat-funktionalitet i selvra-app i pitch-material, hemsida, eller partner-konversationer. Om frågan kommer upp: *"Selvra-app:s chat-funktion är intern dogfood-yta. Konsument-flödet är iOS-app + MCP-anslutningar till Claude, ChatGPT, Cursor, Goose."*
- **Investor/partner-pitch:** Selvra är representations-protokoll. Web-UI är arkiverad. iOS-app + MCP-ekosystem är konsument-flödet. Detta är konsistent med Princip 11 + CONVERSATION_SOURCE_ATTRIBUTION.

### För nya features

- Inga nya features på `/api/chat/stream` eller dess pipeline.
- Nya features på conversation-context-injection (som hämtar från selvra-protocol) är OK — det är representations-läsning, inte chat-yta.
- Nya features på connect-flow (`/connect`, `/connections`) är OK — det är representations-management, inte chat-yta.

### För bug-fixes

- Endast om bug:en blockerar Carls dogfood. Annars: skip, dokumentera, fix vid iOS-port-cleanup.
- Sentry-alerts på chat-pipelinen ska fortfarande gå till Carl (dogfood-värde), men inte triggar prioriterad åtgärd.

---

## Triggers för slut-avveckling

Chat-pipelinen raderas i samma PR som någon av följande sker:

1. **iOS-pipelinen är produktions-redo** för Carls primära dogfood (TestFlight eller App Store-release). Då har web-UI:s syfte upphört.
2. **iOS-pivot avbryts** och vi går tillbaka till web. Då måste beslutet revideras (kommer kräva ny konstitutionell review).
3. **selvra-app deprekreras helt** av annan anledning (t.ex. iOS + native-app blir den enda konsument-ytan, web blir bara landing).

Vid trigger: PR-titel *"chore: avveckla chat-pipeline + web-UI (iOS-port-slutförande)"*. Innehåll: radera `/api/chat/stream`, `process-streaming-user-turn-*`, chat-relaterade DB-tabeller (`consumer_conversation`, `conversation_turn`), associerade tester. Plus aktualisering av `DUAL_FACT_EXTRACTION_MIGRATION` Steg 3.

---

## Vad detta beslut inte gör

- Adresserar inte iOS-port-arbetets exakta timing eller specifikationer (det lever i `SELVRA_IOS_V1_BUILD_PLAN_2026-05-16.md`).
- Specificerar inte hur Carls dogfood-flöde ser ut efter iOS-port-avveckling (förmodligen via iOS-app + direkt MCP-anslutning, men det är design-fråga vid den tidpunkten).
- Tar inte ställning till om `/api/chat/stream`-tabellerna ska bevaras eller raderas vid avveckling (förmodligen drop, men det är data-arkiverings-fråga).
- Påverkar inte selvra-app-backend som platform-agnostic (per `feedback_backend_focus_2026-05-16.md` i Claude-memory). Backend kvarstår för framtida iOS-konsument.

---

## Refs

- Carl-analys 2026-05-16 (problem #2 av 4 i selvra-app-inventeringen)
- `CLAUDE.md` — iOS-pivot är primär aktiv utveckling
- `CONVERSATION_SOURCE_ATTRIBUTION_2026-05-16.md` (selvra-protocol/docs/) — "En LLM är en kanal, inte en sensor"
- `WRITE_SCOPE_PRINCIPLES_2026-05-16.md` (selvra-protocol/docs/) — fyra konstitutionella regler
- Princip 11 i `SELVRA_SPEC.md` — Transkribering, inte tolkning
- `DUAL_FACT_EXTRACTION_MIGRATION_2026-05-16.md` (samma `.gsd/`) — chat-pipelinens öde är kopplat till samma iOS-port-trigger
- `SELVRA_IOS_V1_BUILD_PLAN_2026-05-16.md` (samma `.gsd/`) — iOS-port master-styrning
- `archive/web-consumer-2026-05-15` (git branch) — där web-UI redan är arkiverat
- `feedback_backend_focus_2026-05-16` (Claude-memory) — backend = platform-agnostic + iOS-redo
- `project_selvra_path_b_decision_2026-05-16` (Claude-memory) — slowburn-pakten, konstitution > scale
