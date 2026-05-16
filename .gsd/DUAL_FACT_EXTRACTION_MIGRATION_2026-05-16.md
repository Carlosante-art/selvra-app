# Dual fact-extraction → singular via selvra-protocol

**Datum:** 2026-05-16
**Status:** Teknisk skuld dokumenterad. Migrationsplan, ej påbörjat arbete.
**Estimering:** 3-5 dagar fokus-arbete fördelat över 4-6 veckor (för att vi inte ska tappa data eller bryta dogfood-flödet).
**Trigger:** Beslut att börja: när conversation_facts-tabellen rör sig mot 10k+ rader, eller när andra-användare-läge aktiveras, eller när divergens-detection ska visas i UI:t.

---

## Vad detta dokument är

Plan för att avveckla selvra-app:s lokala fact-extraction-pipeline och migrera all fact-lagring till selvra-protocols events-arkitektur.

Detta är **teknisk skuld från innan protokoll-arkitekturen var komplett**. Det är inte buggig kod — det fungerar — men det är två system som gör samma sak parallellt. Skulden växer linjärt med varje conversation-turn som processas.

Carl-analys (2026-05-16): *"På sikt ska selvra-app inte ha sin egen fact-extraction — den ska bara läsa från selvra-protocol via MCP eller HTTP. Det är vad arkitekturen säger att den är, men inte vad den gör än."*

---

## Nuläge: vad som faktiskt kör

### selvra-app — lokal fact-extraction-pipeline

**Pipeline-filer** (`src/lib/observability/`, ~2300 rader):

| Fil | Roll |
|---|---|
| `process-user-turn.ts` (169 rader) | Sync user-turn pipeline |
| `process-user-turn-with-tools.ts` (288 rader) | Sync user-turn + tool-calling |
| `process-streaming-user-turn.ts` (205 rader) | Streaming user-turn |
| `process-streaming-user-turn-with-tools.ts` (238 rader) | Streaming + tool-calling |
| `extract-facts-from-turn.ts` (271 rader) | Mistral function-calling för fact-extraction |
| `extract-facts-batch.ts` (278 rader) | Batch via Vercel Cron |
| `memory-fact-detector.ts` (81 rader) | Detekterar om turn innehåller fakta-värt-extrahera-info |
| `consumer-lock-validate.ts` (284 rader) | Anti-hallucination — låser LLM-output mot extracted facts |
| `fetch-relevant-events.ts` (101 rader) | Hämtar context från selvra-protocol (existing read) |
| `conversation-context.ts` (132 rader) | Bygger system-prompt context från lokala fakta + protocol-snapshot |
| `source-markup.ts` (107 rader) | Käll-attributerings-syntax `[source:X]` |
| `scrub.ts` (69 rader) | PII-scrub (samma helper som selvra-protocol fick i PR #33) |

**Lagring** (`drizzle/0002_conversation_facts.sql`):

```sql
CREATE TABLE conversation_fact (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  thread_id text NOT NULL,
  turn_id text NOT NULL,
  fact_text text NOT NULL,
  fact_type text NOT NULL,  -- CHECK: 'user_stated' | 'source_observed'
  source_name text,
  extracted_at timestamp NOT NULL,
  user_deleted_at timestamp
);
```

**Observation:** `fact_type` använder samma epistemic taxonomy som Princip 11 (user_stated, source_observed). Det är ingen tillfällighet — det är samma modell, bara två separata DB:n.

### selvra-protocol — sofistikerad event-pipeline

| Modul | Roll |
|---|---|
| `representation/moderator/` | Trust scoring + consistency-policy + scope-enforcement på write-events |
| `representation/validation/` | Fem detektorer (drift, motsägelse, tvärs-subjekt, schema, provenance) |
| `representation/dreamer/` | Bakgrunds-resonering via pgvector random walk |
| `representation/divergence.py` | Konflikt-detektion mellan källor |
| `events` (DB-tabell) | Append-only event-log, källan till sanning |
| `profile_facts` (DB-tabell) | Materialiserad projektion av nuvarande tillstånd |

**Pipeline:** Events kommer in via `POST /v1/subjects/{id}/events` (multi-source skriv-endpoint) eller `POST /v1/observations/propose` (write-scope för LLM-källor — kommer i framtida PR). Moderator validerar. Profile_facts projiceras.

---

## Varför detta är skuld

### 1. Dubbel taxonomi-implementation

Båda system har samma `user_stated` / `source_observed`-distinktion implementerad oberoende. Om vi ändrar epistemic-modellen (lägger till tredje typ, ändrar validering) måste vi ändra på två ställen. Risk: divergens när vi glömmer ena sidan.

### 2. Divergerande validerings-logik

selvra-app:s `consumer-lock-validate` (284 rader) gör anti-hallucination-check klient-sidan. selvra-protocols `ValidationEngine` har fem detektorer som är mer sofistikerade. Vi kör BÅDA på samma data, med olika resultat. Användaren ser bara selvra-app:s verdict — protocolens validering går förlorad.

### 3. Käll-attribuering bryts vid skala

selvra-app skriver till sin egen `conversation_fact`-tabell. När andra källor (Garmin via Stillra, Dexcom, mobile-app) skickar events till selvra-protocol, blir de inte synliga i selvra-app:s flow. Användaren får en delad värld — chat-fakta lever i selvra-app, sensor-fakta i selvra-protocol.

### 4. Divergens-detection fungerar inte

selvra-protocols `divergence.py` jämför signaler från olika källor och skapar `DIVERGENCE_DETECTED`-events. Men det kan bara jämföra det som ligger i protokollet. Chat-uttalanden i `conversation_fact` är osynliga för divergens-detektorn. Vi tappar exakt den signal som Princip 10 säger är "den mest värdefulla insikten."

### 5. Audit-trail är splittrad

selvra-protocols `MCPAuditLog` registrerar varje MCP-anrop. selvra-app:s fact-extraction loggas i Sentry men inte i någon strukturerad audit. Användaren kan inte se "hur kom Selvra fram till detta?" för chat-extraherade fakta — provenance-kedjan bryts vid lokal-pipeline-gränsen.

### 6. Cost & onödig compute

Två LLM-anrop per turn där ett räcker: selvra-app kör Mistral för extraction, selvra-protocol skulle (vid migration) köra Moderator med Layer-1-modell på samma input. Direkt cost-besparing när migrationen är klar.

---

## Slut-state

selvra-app blir **ren konsument** av selvra-protocols representation:

```
USER → selvra-app chat (UI + streaming) → selvra-protocol events-endpoint
                                                ↓
                                          Moderator + Dreamer
                                                ↓
                                          events → profile_facts
                                                ↓
selvra-app läser ←─ /v1/subjects/{id}/snapshot ←┘
                ←─ /v1/connections/{id}/audit
                ←─ /api/connections/stream (SSE)
```

selvra-app:s lokala observability-pipeline är borta. `conversation_fact`-tabellen är borta. Allt fact-extraction sker via selvra-protocols Moderator. selvra-app kör fortfarande chat-UI (separat fråga — se "Chat-pipelinens framtid" i status-memory) men fakta-flödet är enkelriktad ström: chat → events → protocol.

---

## Migrationsplan — 4 steg

### Steg 1 — Förbered: shadow-write till protocol

**Mål:** Varje conversation-turn skrivs både till `conversation_fact` (befintligt) OCH som event till selvra-protocols `/v1/subjects/{id}/events` (nytt). Båda pipelines kör parallellt. Inga UI-ändringar.

**Arbete:**
- Ny funktion `writeFactsToProtocol(turn, extractedFacts)` i `src/lib/observability/`
- Anropas i samma transaction som befintliga `insertConversationFacts`
- Mappar `conversation_fact`-rader till protocol-events:
  - `fact_type=user_stated` + `raw_utterance` (turn-text) + `extracted_value` → POST events med `epistemic_type=user_stated`
  - `fact_type=source_observed` (manuell import etc.) → POST events med `epistemic_type=source_observed`
- Failure-safe: protocol-skrivning kan misslyckas utan att blocka conversation_fact-skrivning. Logga divergens i Sentry för att kunna jämföra.

**Mätbarhet:** dashboard-query "rader i conversation_fact senaste 24h" vs "events med category=PROFILE_SIGNAL från selvra-app-källan senaste 24h". Skillnad → bug i shadow-write.

**Estimering:** 1 dag inkl. tester. Risk: låg (skriver bara extra, ändrar inget existerande).

**Rollback:** kommentera ut `await writeFactsToProtocol(...)`-anrop. conversation_fact-pipelinen fortsätter oförändrad.

---

### Steg 2 — Verifiera: jämför utdata 30 dagar

**Mål:** Köra parallella pipelines i 30 dagar (eller motsv. ~500+ conversation-turns) och verifiera att protocol-versionen producerar samma eller bättre fakta-set.

**Arbete:**
- Daily Vercel Cron som anropar selvra-protocol `/v1/subjects/{id}/snapshot` för Carls subject
- Jämför mot lokal `conversation_fact`-query för samma user
- Rapporterar diff till Sentry:
  - Fakta som finns i protocol men inte lokalt (förväntat: 0 — protocol har samma input)
  - Fakta som finns lokalt men inte i protocol (rött flagga — shadow-write misslyckades)
  - Fakta med olika `fact_type` mellan systemen (kritiskt: validering är olika)
- Manuell granskning varje vecka: Carl tittar på Sentry-rapporten

**Mätbarhet:** Vid slut av perioden ska diff vara <2% rader och 0% fact_type-divergens. Vid större diff → fix logiken innan vi går till Steg 3.

**Estimering:** 0.5 dag att bygga cron + diff-rapport, sedan 30 dagars vänteperiod (parallellt med annat arbete).

**Rollback:** stäng av cron, fortsätt parallella pipelines tills problem är lösta.

---

### Steg 3 — Switch: stäng av lokal extraction

**Mål:** Avveckla observability-pipelinens fact-extraction. Behåll bara conversation-context-injection (som hämtar context från selvra-protocol via snapshot).

**Arbete:**

| Fil | Action |
|---|---|
| `extract-facts-from-turn.ts` | DELETE (271 rader) |
| `extract-facts-batch.ts` | DELETE (278 rader) — Vercel Cron `/api/cron/extract-facts` avregistreras |
| `memory-fact-detector.ts` | DELETE (81 rader) — protocol-side Moderator gör samma check |
| `consumer-lock-validate.ts` | DELETE (284 rader) — ValidationEngine ersätter |
| `process-user-turn{,-with-tools}.ts` | Behåll men ta bort `extractFacts`-anrop |
| `process-streaming-user-turn{,-with-tools}.ts` | Samma |
| `conversation-context.ts` | Behåll — använder snapshot för context-injection (redan korrekt) |
| `fetch-relevant-events.ts` | Behåll — hämtar från selvra-protocol (redan korrekt) |
| `source-markup.ts` | Behåll — käll-attributerings-syntax används i UI |
| `scrub.ts` | Behåll i selvra-app också (defense-in-depth — PII-scrub klient-sidan innan något sänds till protocol) |
| `/api/cron/extract-facts/route.ts` | DELETE |
| `vercel.json` | Ta bort `extract-facts`-cron-entry |

**Total radering:** ~1200 rader observability-kod + 1 route + 1 cron-entry.

**Behåller:**
- Hela chat-UI (separat scope)
- `conversation_fact`-tabellen (för historik — drop sker i Steg 4)
- Conversation-context-injection som läser från protocol-snapshot
- Källattribuerings-syntax `[source:X]` i system-prompts

**Mätbarhet:**
- Före: ~2300 rader observability-kod
- Efter: ~510 rader (bara kvarvarande filer)
- Inga conversation-fact-rader skapas efter deploy
- selvra-protocol events-volym ökar (förväntat)

**Estimering:** 1 dag inkl. tester (ta bort 12 test-filer som testar borttagen kod).

**Rollback:** revertera commit. conversation_fact-tabellen och tidigare data är intakt — bara nya rader kommer från protocol.

---

### Steg 4 — Cleanup: drop conversation_fact-tabellen

**Mål:** Ta bort dual-DB-läget helt. Migrera historisk data till selvra-protocol-events. Drop lokala tabellen.

**Arbete:**
1. **Migrations-script** (`scripts/migrate-facts-to-protocol.ts`):
   - Hämta alla `conversation_fact`-rader (paginerat per 1000)
   - För varje rad: POST till `/v1/subjects/{id}/events` med:
     - `event_type: 'consumer.fact.migrated_from_conversation'`
     - `payload: { original_id, fact_text, fact_type, extracted_at, thread_id, turn_id, source_name }`
     - `provenance: { source: 'selvra_app_migration_2026-XX-XX', original_table: 'conversation_fact' }`
   - Verifiera success per batch
   - Logga progress i strukturerad form
2. Drizzle migration `0007_drop_conversation_facts.sql`:
   - `DROP TABLE conversation_fact` (med IF EXISTS)
   - Inga FK:s pekar in i den efter Steg 3 (foreign keys var till user, thread, turn — inte från andra tabeller)
3. TypeScript cleanup:
   - Ta bort `conversationFacts` från `src/lib/db/conversation-schema.ts`
   - Ta bort `insertConversationFacts`, `listFactsForUser`, etc. från `conversation-queries.ts`
   - `/api/memory/facts`-endpoint omdirigeras till selvra-protocol-snapshot (eller raderas om ingen konsument finns)

**Mätbarhet:**
- 100% av historisk data migrerad (verifierat via count-check före och efter)
- 0 rader i `conversation_fact` (om drop lyckats)
- selvra-protocol events-tabellen har +N rader där N = historiska facts-antal
- selvra-app-bundle minskar med ~300-500 rader DB-kod

**Estimering:** 1.5 dagar (migrations-script + tester + körning + verifiering + drop + cleanup).

**Rollback:** complicerat efter drop. Migrations-scriptet är reversibelt INNAN drop. Efter drop: data finns i protocol-events men ingen `conversation_fact`-tabell. Inverse-migration skulle kräva att vi recreate:ar tabellen och hämtar events tillbaka — möjligt men dyrt. **Rekommendation:** vänta minst 7 dagar mellan Steg 3 och Steg 4 så att vi är säkra på att inget bryts.

---

## Blockers / förutsättningar

| Blocker | Påverkan | Status |
|---|---|---|
| Write-scope på selvra-protocol | Steg 1+ kräver att vi kan skriva user_stated-events. Befintlig `/v1/subjects/{id}/events`-endpoint stödjer det. | ✅ Klart |
| Princip 11 / WRITE_SCOPE_PRINCIPLES | Steg 1+ måste respektera regler om epistemic_type, raw_utterance, source_ai_id. selvra-app som källa = source_ai_id "selvra-app-internal" eller liknande. | ✅ Dokumenterat (PR #35 selvra-protocol) |
| Multi-user-mode aktiverat | Steg 1 kräver att varje user har egen tenant_id + subject_id i selvra-protocol. AB-deferred tills iOS-port. | ⏳ Carl-beslut |
| Connect-flow + token-issuance live | Steg 1 kräver att selvra-app kan skriva till protocol som autentiserad användare. Token-issuance finns i PR #34. | ⏳ Beror på connect-flow-merge |
| iOS-pivot-beslut | Steg 3 påverkar selvra-app:s chat-pipeline. Om iOS-port deprekrerar selvra-app helt, är Steg 3 trivialt (allt försvinner). | ⏳ Carl-beslut |

---

## Trigger för att börja

Detta arbete är inte brännande. Skuld växer linjärt med trafic, inte exponentiellt. Triggers att börja:

1. **conversation_fact-tabellen rör sig mot 10k+ rader** — då blir migration dyr men inte ohanterlig. Vid 100k+ börjar det bli problem.
2. **Multi-user-mode aktiveras** — då duplicerar vi skulden per användare och hindret att förenkla växer.
3. **Divergens-detection ska visas i UI** — kräver att fakta finns på protocol-sidan. Då är Steg 1+2 förutsättning.
4. **iOS-port-arbete påbörjas** — bra tillfälle att avveckla web-pipelinen samtidigt.

Innan dessa triggers: dokumenterad skuld räcker. Ingen aktiv åtgärd.

---

## Risker

### Hög: Verifierings-perioden i Steg 2 är otillräcklig

Om vi inte ser divergens på 30 dagars Carl-dogfood betyder inte att den inte finns. När andra användare börjar (olika språk, olika konversations-mönster, edge-cases) kan systemen plötsligt skilja sig.

**Mitigering:** vid första 5 andra-användare → tillfälligt återaktivera parallella pipelines för dem och jämför i 2 veckor innan vi switch:ar deras pipeline.

### Medium: PII-scrub är på olika lager

selvra-app scrubbar PII innan write till protocol. Men protocol kör också sin egen scrub. Risk: vi scrubbar samma data två gånger och tappar information.

**Mitigering:** dokumentera scrub-konventioner. selvra-app scrubbar headers + obvious-PII. Protocol scrubbar enligt strikta regler. Test att dubbel-scrub är idempotent (samma input → samma output efter 1 eller 2 körningar).

### Låg: Drizzle-migration 0007 bryter äldre clients

Om någon klient cachar `conversation_fact`-tabell-shape (knappast — det är intern tabell) → fel. Risk: extremt låg eftersom tabellen är intern.

### Medium: Migrations-scriptet kan inte mappar gamla fact_type korrekt

`conversation_fact.fact_type` är `'user_stated' | 'source_observed'`. Protocol-events har bredare modell. Hur mappa `source_name` (string) → protocol `source_ai_id` (UUID)?

**Mitigering:** Steg 4-migrations-scriptet behöver mapping-tabell: `source_name → source_ai_id`. För själv-extraherade fakta (utan `source_name`): använd selvra-app-system-source. Detta är konkret design som behöver göras vid Steg 4-startup, inte nu.

---

## Vad detta dokument inte gör

- Definierar inte exakt event_type-värden för migrerade fakta. Det är design-beslut vid Steg 4-startup.
- Specificerar inte vilka observability-tester som måste behållas. Kontextuellt vid Steg 3.
- Adresserar inte chat-pipelinens framtid (separat fråga — se `project_status_2026-05-16_session_end.md` i Claude-memory).
- Föreslår ingen exakt deadline. Trigger-baserad start, inte tidssatt.

---

## Refs

- Carl-analys 2026-05-16: dual fact-extraction som teknisk skuld (problem #3 av 4 i selvra-app-inventeringen)
- `drizzle/0002_conversation_facts.sql` — lokal fakta-tabell
- `src/lib/observability/` — 12 filer, ~2300 rader pipeline-kod
- `src/lib/protocol/client.ts` — befintlig protocol-klient (har redan `listEvents`, kan utökas med `appendEvent`)
- selvra-protocol: `representation/moderator/`, `representation/validation/`, `representation/dreamer/`
- Princip 9 (Temporal modeling), Princip 10 (Conflict and provenance), Princip 11 (Transcription) — alla pekar mot samma slut-state
