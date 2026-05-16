# Selvra Product Definition v1

**Status:** Canonical. Källan av sanningen om vad Selvra ÄR.
Ersätter splittrad förståelse i många separata dokument.

> "Spegling och lättnad. På mätdata och ord. Det är framtiden."

---

## 1. Vad Selvra ÄR

En iOS-native AI som ger **spegling** och **lättnad** — på **mätdata** och **ord**.

Källa-attribuerad. Patient-ägd. EU-suverän. Aldrig manipulerande.

Fjärde kategorin efter Aura, Apple Health och Replika. Existerar inte ännu.

## 2. Vad Selvra INTE är

- Inte mindfulness-app (Aura, Calm, Headspace)
- Inte tracking-dashboard (Apple Health, Strava, Whoop)
- Inte AI-vän som låtsas (Replika, Character.AI, Pi)
- Inte coachande wellness-verktyg
- Inte content-bibliotek
- Inte habit-tracker
- Inte multi-vertikal-paraply

## 3. Fyra-axligt operativt definierat

| Axis | Beskrivning | Exempel |
|---|---|---|
| **Spegling på mätdata** | Säger vad sensorer visar käll-attribuerat | "Garmin visar 5h 40min sömn senaste 4 dagarna. Baseline 7h 15min." |
| **Spegling på ord** | Säger vad användaren själv skrivit tidigare | "Du skrev 'överväldigad' i tisdags. Samma ord förra månaden runt 18-tiden." |
| **Lättnad på mätdata** | Erbjuder handling som svar på observerat tillstånd | "Puls och HRV pekar mot att du är slut. Vill du att jag startar något lugnt i Spotify?" |
| **Lättnad på ord** | Möter användaren där hen är utan att coacha | "Du bär något du inte hunnit säga. Vill du formulera det här, eller bara sitta tyst en stund?" |

## 4. Konstitutionella principer (icke-förhandlingsbara)

### IF1: Selvra ska aldrig veta mer än användaren

Implementerat genom:
- Varje data-claim käll-attribuerad inline med `[source:NAME]`-markup
- Källa-attribuering valideras av `consumer-lock-validate.ts` (rule: `fabricated_source`)
- Vid otillräcklig data: säg "jag vet inte" eller "jag har bara X dagar data"

### Aldrig manipulation (EU AI Act-compliance)

Enforced i kod via `consumer-lock-validate.ts` — 11 forbidden patterns:
- `love_bombing`, `fomo_hook`, `guilt_appeal`
- `pretend_personhood`, `sycophantic_validation`
- `prescriptive_coaching`, `fake_emotion`
- `future_prediction`, `diagnosis`
- `unsourced_observation`, `fabricated_source`

Validering körs server-side på varje LLM-output. Vid violation: retry med hint, fallback om upprepad.

### EU-suverän infrastruktur

- LLM: Mistral (Paris) primär, Anthropic EU-tier fallback. **Aldrig OpenAI consumer-tier.**
- Backend: Railway (Hetzner Frankfurt-region) eller Hetzner/Scaleway direkt
- Frontend: Vercel (Function Region måste verifieras EU)
- Error-tracking: Sentry EU-region (Frankfurt)
- Sub-processors dokumenterade i `EU_HOSTING_VERIFICATION_2026-05-16.md`

### Patient-ägd portabilitet

- SREF v1 export från dag 1 — komplett representation som JSON
- Användaren ser exakt vad Selvra minns via `/minne`-vy
- Användaren kan radera fakta, källor, samtal, hela kontot
- Inga dark patterns för att försvåra avregistrering
- 30-dagars retention-fönster för restore vid soft-delete

### Empirisk substrate-kompass

- Inga nya features utan Carl-dogfood först
- Inga marketing-claims utan empirisk grund
- Inga design-val baserade på "vackert" istället för "fungerar"

## 5. Tekniska beslut (canonical)

### Plattform
- **iOS-native** primärt (Swift 5.10+ / SwiftUI / iOS 17+)
- Webb-version PARKERAD per `SELVRA_CONSUMER_IOS_PIVOT_2026-05-16.md`
- Backend bevaras (60% iOS-portbar), arkitektur stabil

### Auth
- Apple Sign-in primärt på iOS
- Magic-link (Resend) bevaras för web-fallback om aktiverad
- JWT/Bearer-token för iOS-klient
- Session-cookie för web

### Data-källor v1
- **Fas 1 (vecka 4-12):** HealthKit, EventKit, användarens ord
- **Fas 2 (vecka 13-20):** Garmin, Strava, Spotify (via befintlig OAuth-backend)
- **Fas 3 (post-launch):** Apple Music, Oura, Whoop (vid efterfrågan)

### LLM-pipeline
- Mistral Large via API (EU-hostat)
- Streaming via NDJSON
- Två varianter: med och utan tool-call (`search_events`)
- `extractFactsFromTurn` extraherar facts efter varje turn till `conversation_facts`-tabell
- `[source:X]`-markup renderas som klickbara badges → öppnar minnesvy

### DB
- PostgreSQL (Railway, EU)
- Tabeller: `user`, `consumer_conversation`, `conversation_turn`,
  `conversation_memory_fact`, `conversation_fact`, `system_prompt_version`
- Soft-delete via `user_deleted_at`-fält där applicerbart
- FK CASCADE för account-radering (GDPR Art. 17)

### Constitutional enforcement
- `consumer-lock-validate.ts` — 11 forbidden patterns
- Post-LLM-validering på varje output
- Retry med hint vid violation, fallback om upprepad
- Sentry capture för audit på fallback

### Säkerhet
- Säkerhets-headers (CSP, HSTS, X-Frame-Options) i `next.config.ts`
- PII-scrub via `lib/observability/scrub.ts` recursive object-scrubbing
- Sentry beforeSend hook för defense-in-depth
- Auth-gate via `await auth()` på alla privata routes

## 6. Affärsmodell

**Understanding-subscription, inte content-subscription:**

| Tier | Pris (intervall) | Innehåll |
|---|---|---|
| Gratis | 0 | Grundläggande HealthKit + 1-2 källor, samtal med begränsad minne |
| Premium | €9-15/månad eller €69-99/år | Alla källor, fullt minne, SREF-export, Apple Watch-integration |

- Inga in-app-köp för "voice packs" eller "personality"
- Familje-plan möjligen senare
- Pris-intervall, exakt bestäms vid launch baserat på TestFlight-feedback

## 7. Produkt-flöde (iOS-app)

### Onboarding (noll-friktion)
1. Apple Sign-in — en tap
2. Välkomstskärm: "Selvra. Spegling och lättnad. På mätdata och ord."
3. HealthKit + Kalender permissions
4. Frivilliga källor (Garmin/Strava/Spotify) — kan vänta
5. Direkt till samtal

### Samtal
Användaren möts av senaste tråd eller ny. Selvra svarar med:
1. Käll-attribuerad observation där relevant
2. Reflekterande frågor (inte instruktioner)
3. Erbjudande av lättnads-handling när data + kontext motiverar
4. Erkänner gränser vid otillräcklig data

### Minne (transparens)
- **Vad du sagt** — user-stated facts från samtal
- **Vad dina källor visat** — observationer från kopplade källor
- **Explicita minnen** — user-skrivna fakta ("jag heter Carl")

### Lättnads-handlingar
Aktiverar befintliga källor, levererar inte själv innehåll:
- Lugnande musik via Spotify (kontextuell spellista)
- Naturljud via Spotify
- Tystnad (Selvra pausar samtal)
- Privat-mode-samtal (extraheras inte till facts)
- Andning via Apple Watch Breathe
- "Lägg telefonen. Sätt på Sleep Focus."

### Export
- SREF v1 JSON (komplett representation)
- AI-context export (för annan AI)
- Per-tråd-markdown

## 8. Backend-tjänster (befintliga + nya)

### Implementerat (befintliga)
- `processUserTurn` — non-streaming orchestrator
- `processStreamingUserTurn` — NDJSON-streaming
- `processUserTurnWithTools` + streaming-variant — tool-call-mode med `search_events`
- `extractFactsFromTurn` — Mistral json_schema-mode för fact-extraction
- `validateConsumerOutput` — 11 forbidden patterns
- `parseSourceMarkup` — `[source:X]`-renderer
- DB-queries via Drizzle
- `/api/chat/stream` — NDJSON-streaming POST

### Nya REST-endpoints (denna PR)
- `POST /api/auth/apple` — Apple Sign-in token-exchange
- `GET /api/threads` — list trådar (paginering + filter)
- `POST /api/threads` — create
- `GET /api/threads/[id]` — single (ägar-validerat)
- `PATCH /api/threads/[id]` — update (title, archived)
- `DELETE /api/threads/[id]` — hard-delete
- `GET /api/threads/[id]/turns` — list turns kronologiskt
- `GET /api/memory/facts` — list conversation_facts (filter per type + source)
- `DELETE /api/memory/facts/[id]` — soft-delete
- `GET /api/memory/explicit` — list explicit memory facts
- `DELETE /api/memory/explicit/[id]` — soft-delete
- `GET /api/sources` — list connected sources
- `POST /api/sources/healthkit/sync` — receive HealthKit-data från iOS
- `DELETE /api/sources/[id]` — disconnect källa
- `GET /api/account` — info + lifecycle-status
- `POST /api/account/delete` — soft-delete med 30-dagar
- `POST /api/account/restore` — restore pending-delete

### Server Actions (Next.js webb-specifika)
- `sendMessage` — bevarad för webb-fallback om aktiveras

## 9. Roadmap

| Period | Milstolpe |
|---|---|
| Maj 2026 | Backend REST-endpoints klara (denna PR). Vila + AB-väntan |
| Maj-juni 2026 | AB-aktivering. Apple Developer Program enrollment |
| Juli 2026 | iOS-projekt setup, Swift-första-iteration |
| Augusti-november 2026 | iOS-bygget mot backend |
| December 2026 | TestFlight Internal (Carl + 3-5 testare) |
| Januari 2027 | TestFlight External (~50) |
| Vintern 2026/27 | Stillra klinisk validations-utvärdering (Carls läkarbesök) |
| Februari 2027 | App Store Review + launch (GO/NO-GO-beslut) |
| 2027 | YH-besked: pausa eller launcha pre-utbildning |

## 10. Aktiva sidospår

### Stillra v2
Klinisk-grade pipeline för T1-diabetes B2B. **Nästa-steg-läge** —
Carls eget läkarbesök är klinisk validations-event. Inte parking, inte
aktiv pilot.

Doc: `~/stillra-server-master/STILLRA_NEXT_STEP_STATUS_2026-05-16.md`

### Selvra-protokoll (~/selvra)
Carl utvecklar själv — central-scrub-helper, context-layer, clinical-brief.
Pausat per backend-fokus-direktiv för selvra-app från min sida.

## 11. Open Questions

| # | Fråga | Beslutas när |
|---|---|---|
| 1 | Pris exakt (€9-15/mån) | TestFlight feedback |
| 2 | Apple Music vs bara Spotify | Post-launch om efterfrågan |
| 3 | Apple Watch v1 eller v2 | Post-iOS-launch |
| 4 | Engelsk version timing | Post-svenska-launch + 10k MAU |
| 5 | Push-notifikationer (constitutional risk) | Post-launch om empirisk grund |
| 6 | YH-utbildning aug 2027 | Vinter 2026/27 (besked) |
| 7 | Stillra-pilot-aktivering | Post-Carls läkarbesök-validation |
| 8 | Vinnova-ansökan-timing | Post-Stillra-validation |

## 12. Glossary

| Term | Definition |
|---|---|
| **Spegling** | Säger vad sensor/källa visar utan tolkning. "Garmin visar X" inte "Du är trött" |
| **Lättnad** | Erbjuder operationell handling som möter användaren där hen är. Aktiverar Spotify/Apple Watch/tystnad — levererar inte själv innehåll |
| **Mätdata** | HealthKit, EventKit, Garmin, Strava, Spotify, Dexcom — datasignaler |
| **Ord** | Användarens chat-input + extraherade user_stated-facts från samtal |
| **Käll-attribuering** | Inline `[source:NAME]`-markup som UI:t renderar som klickbara badges |
| **SREF v1** | Selvra Representation Exchange Format — komplett JSON-export av allt Selvra minns |
| **conversation_facts** | DB-tabell med extracted facts från samtal (user_stated + source_observed) |
| **conversation_memory_facts** | DB-tabell med user-skrivna explicita minnen ("Kom ihåg X") |
| **lock-validate** | `consumer-lock-validate.ts` — post-LLM-output validering mot forbidden patterns |
| **IF1** | "Selvra ska aldrig veta mer än användaren" — konstitutionell princip |
| **Substrate** | Empirisk grund. Carl-dogfood + faktisk användning. Inte hypotes. |
| **Nästa-steg-läge** | Mellan "parking" och "aktiv". Stillra-läge för Carls eget läkarbesök som validations-event |

## 13. Referens-dokument (operativa)

| Doc | Innehåll |
|---|---|
| `SELVRA_IOS_V1_BUILD_PLAN_2026-05-16.md` | Vecka-för-vecka iOS-bygge-plan |
| `IOS_API_SPEC_2026-05-16.md` | REST-endpoints för iOS-konsumtion |
| `EU_HOSTING_VERIFICATION_2026-05-16.md` | Sub-processor-lista + EU-regions |
| `APPLE_DEV_PREP_2026-05-16.md` | Apple Developer Program registrering |
| `IOS_API_READINESS_2026-05-16.md` | Audit av befintliga + saknade endpoints |
| `BACKEND_AUDIT_2026-05-16.md` | Säkerhets-headers + bundle-baseline |
| `V1_E2E_VERIFICATION_2026-05-16.md` | Backend-verifierings-procedur |
| `SELVRA_CONSUMER_IOS_PIVOT_2026-05-16.md` | Pivot-beslut (historik) |

## 14. Avslutande konstitutionell ankarspunkt

Om något under bygget föreslår tillägg som divergerar från fjärde-kategori-positionen: stopp. Re-granska mot detta dokument.

Selvra v1 pitchad i en mening:

> "Spegling och lättnad. På mätdata och ord. Det är framtiden."

Det är linjen. Allt annat tjänar den eller rivs.
