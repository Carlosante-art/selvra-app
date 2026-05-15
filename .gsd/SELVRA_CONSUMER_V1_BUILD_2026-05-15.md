# Selvra Konsument v1 — Refaktorering till "Ärlig AI-Kompanjon med Levd Minne"

Master-styrning till Claude Code för refaktorering av befintliga 28 routes till v1.
Spara denna fil som canonical referens. Återgå hit vid varje arkitektur-fråga
under v1-bygget. Avvikelser kräver explicit re-locking.

## 1. KÄRNBESLUT

Selvra konsument v1 är en **samtalsbaserad AI-kompanjon med multi-source levd minne**
byggd för EU-marknaden som anti-Replika-position.

Vi bygger inte vecko-brev. Vi bygger inte tracking-dashboard. Vi bygger inte
multi-vertikal-paraply.

Vi bygger ett samtal som börjar när användaren öppnar appen och fortsätter där
det senast slutade — informerat av användarens levda data, källa-attribuerat,
utan manipulation.

## 2. PARADIGM-BESLUT (icke-förhandlingsbart)

### Primärt paradigm: SAMTAL

`/samtal/*` är primär entry point efter login. Detta är vad användaren möter.
Detta är vad appen är.

### Sekundärt paradigm: TANKAR (inline i samtal)

`/thoughts` som separat sida rivs. Användaren skriver tankar i samtalet.
Selvra extraherar och taggar dem som "user-stated facts" i bakgrunden för
minnes-systemet.

### Tertiärt paradigm: BREV (rivs i v1)

`/brev/*` och alla brev-routes rivs. Vecko-brev-paradigmen är "förra Selvra".
Den bevaras inte. Detta är empirisk realitet från deep searchen: vecko-brev-
format har kall retention och fel feedback-loop för konsumentmarknaden 2026.

### Bakgrund/Dreamer (rivs i v1)

`/traces` och Dreamer-genererade insights rivs. Insights kommer via samtal när
användaren frågar — inte automatiskt genererade i bakgrundsvy.

### Minne (bevaras, omarbetas)

`/minne` bevaras som transparens-vy. Användaren ser exakt vad Selvra kommer
ihåg om hen. Detta är konstitutionellt krav (IF1) och EU Data Act-compliance.
Block 1-3 (reflection/thoughts/Dreamer) konsolideras till två kategorier:
"Vad du sagt" och "Vad dina källor visat". Block 4 (explicit fakta) bevaras.

### Export (bevaras)

`/export`, `/export/ai-context`, `/export/ai-context/quick`, `/api/export/sref`
bevaras alla. Detta är konstitutionell SREF v1-position och EU Data Act-
compliance från dag 1.

### Onboarding (omarbetas radikalt)

Nuvarande 4-stegs onboarding (intentions → signal → sources → done) rivs.
Ersätts med: **noll-friktion-onboarding**. Magic-link login → direkt till
samtal. Selvra hälsar med:

> "Jag kan läsa det du redan har. Vill du koppla något nu, eller börja prata
> först?"

Användaren kan välja att hoppa direkt till samtal utan att koppla något.
Källor kopplas opportunistiskt under samtal, inte som tvingande pre-step.

`/onboarding/*` routes raderas. Ersätts med `/welcome` (en sida, valbar
genväg till samtal).

## 3. ROUTE-PLAN FÖR v1

### Behålls och förbättras

```
/                             Landing (befintlig design enligt SELVRA_LANDING_DESIGN_SPEC)
/login                        Magic-link
/login/check-email            "Kolla mailen"
/privacy                      Integritetspolicy

/welcome                      NY — noll-friktion-introduktion, valbar källkoppling
/samtal                       PRIMÄR — tråd-lista, sök, ny tråd
/samtal/thread/[thread_id]    PRIMÄR — samtal-vy
/samtal/thread/[thread_id]/export   Export per tråd

/minne                        Transparens-vy ("vad Selvra kommer ihåg om dig")
/account                      Konto + delete
/goodbye                      Efter delete

/export                       Hub
/export/ai-context            Full-context JSON
/export/ai-context/quick      Quick-variant

/api/auth/[...nextauth]       Auth.js
/api/chat/stream              NDJSON-streaming
/api/oauth/google/init        Calendar + Gmail
/api/oauth/google/callback
/api/oauth/strava/init        Strava
/api/oauth/strava/callback
/api/export/ai-context        JSON-endpoint
/api/export/sref              SREF v1
```

### Raderas

```
/brev                         RIVS
/brev/arkiv                   RIVS
/brev/arkiv/[event_id]        RIVS
/thoughts                     RIVS (funktionalitet flyttas inline i samtal)
/traces                       RIVS (Dreamer-paradigm överges)
/onboarding/intentions        RIVS
/onboarding/signal            RIVS
/onboarding/sources           RIVS
/onboarding/done              RIVS
```

### Server Actions som rivs

```
regenerateBrev                RIVS
submitThought                 RIVS som standalone (extraheras från samtals-turns)
regenerateDreamer             RIVS
```

### Server Actions som behålls/läggs till

```
sendChatMessage               Befintlig — fortsatt primär
extractFactsFromTurn          NY — extraherar user-stated facts från samtals-turn till memory_facts
archiveThread                 Befintlig
deleteAccount                 Befintlig
exportSref                    Befintlig
```

### Total route-räkning efter refaktor

```
Före:  19 page-routes + 9 API-routes = 28 routes
Efter: 12 page-routes + 9 API-routes = 21 routes
```

Sju routes raderas. Konsumtion-yta reduceras med 25%. Klarhet ökar
substantielt.

## 4. SAMTAL — KÄRNUPPLEVELSEN

### Vad Selvra gör i samtal

Användaren öppnar `/samtal`. Skapar ny tråd eller fortsätter befintlig.
Skriver något — fråga, tanke, känsla, observation.

Selvra svarar med:

**1. Käll-attribuerad observation där relevant**
Om användaren frågar "hur är jag denna vecka?" — Selvra svarar med konkret
data från kopplade källor (Garmin, Calendar density, Spotify-mönster,
tidigare egna ord från samtal) och säger exakt vilken källa varje
observation kommer från.

**2. Reflekterande frågor**
Inte instruktioner. Inte coaching. Frågor som låter användaren tänka.

Exempel: "Du nämnde i april att stress kommer från oklara förväntningar.
Du har 23 möten denna vecka (Calendar) mot ditt snitt 12. Är förväntningarna
tydliga?"

**3. Konversations-minne**
Selvra minns vad användaren sagt tidigare i denna och tidigare trådar.
Använder det naturligt: "Senast vi pratade om sömn sade du...".

**4. Erkänner gränser**
Om data är otillräcklig: säg det. "Jag har bara 3 dagars Garmin-data ännu.
Kan inte se mönster."

Om användaren frågar något Selvra inte kan svara på från sina källor: säg
det. "Jag har ingen källa för det. Det är något bara du vet."

### Vad Selvra ALDRIG gör i samtal

Detta är konstitutionellt enforcement i kod via `lock-validate`, inte hopp
på prompt-engineering.

- Aldrig sycophantic-validering ("Du är så otrolig!")
- Aldrig love bombing vid första samtal
- Aldrig FOMO-krokar ("Jag oroar mig när du inte loggat in")
- Aldrig skuld-appeller vid hejdå
- Aldrig påstå sig vara mer än verktyg ("Jag är din vän" → förbjudet)
- Aldrig låtsas ha känslor
- Aldrig coacha mot mål användaren inte satt själv
- Aldrig förutsäga framtid
- Aldrig diagnostisera

### Tekniskt: lock-validate utökas för konsument-context

Befintlig `lock_validate.py` har constitutional rules för clinical brief.
Utöka med `consumer_conversation_rules.py`:

```python
FORBIDDEN_PATTERNS = [
    "i_love_you", "miss_you", "worried_about_you",
    "you_are_amazing", "you_can_do_it", "i_believe_in_you",
    "dont_leave", "come_back_tomorrow",
    "you_should", "you_must", "you_need_to",
    "next_week_will_be", "you_will_feel",
    "you_have_X_diagnosis"
]

REQUIRED_PATTERNS_WHEN_OBSERVATION = [
    "source_attribution"  # varje data-claim måste ange källa
]
```

Validera mot output innan användaren ser det. Om brott: regenerera. Om
regenerering fortsätter bryta: visa fallback-text och logga incident.

## 5. MINNE — TVÅ-KATEGORI-MODELL

`/minne` visas så här:

### Vad du sagt

Alla user-stated facts extraherade från samtals-turns över tid. Användaren ser:

- Datum sagt
- Vad de sade (citerat exakt eller parafraserat med citerings-källa)
- Vilken tråd det kommer från (klickbar referens)
- Knapp: "ta bort detta minne"

### Vad dina källor visat

Alla observationer från kopplade källor (Garmin, Strava, Calendar, Gmail,
Dexcom om kopplad). Användaren ser:

- Källa-namn
- Vad källan rapporterat
- När det rapporterades
- Knapp: "koppla från källa" (förrätter GDPR-rätt till radering)

### Block 4 (explicit fakta) bevaras som tredje sektion

User-skrivna explicita minnen som "jag heter Carl", "jag är T1-diabetiker",
"min mamma heter [namn]". Användaren skapar dessa explicit. Selvra kan inte
skapa dem utan användarens bekräftelse.

## 6. ONBOARDING — VAD ANVÄNDAREN MÖTER

Login via magic-link. Sen `/welcome`:

```
Selvra
Ett samtal som vet vad du har levt, inte bara vad du har sagt.

Du behöver inte koppla något nu. Du kan börja prata direkt.

[Börja prata]  [Koppla källor först]
```

Klick "Börja prata" → direkt till `/samtal` → ny tråd öppnas → Selvra hälsar:

> "Hej. Jag är en AI som kan läsa det du redan har — kalender, träning,
> sömn, dina egna ord — och hjälpa dig se mönster. Just nu har jag inga
> källor kopplade och vet ingenting om dig. Vill du skriva något? Eller
> koppla något? Båda fungerar."

Klick "Koppla källor först" → enkel sida med toggles för Google Calendar,
Gmail, Strava → "Klart" → till `/samtal`.

Ingen tvingande intention-skrivning. Ingen "signal"-preferenssida. Inget
"klart"-firande.

## 7. TEKNISKA KRAV

### LLM-providers

EU-suverän infrastruktur är konstitutionellt krav. Använd:

- **Primär:** Mistral (Paris) via API
- **Fallback:** Anthropic EU-tier med DPA + no-training-commitment
- **Aldrig:** OpenAI consumer-tier (tränings-policy oklart)

Environment-variabel `LLM_PROVIDER=mistral` med fallback-konfiguration.

### Hosting

Vercel för frontend är OK om EU-region tvingas. Verifiera Vercel deployment
använder EU-region.

Backend (Selvra-protokoll-API) måste vara på Hetzner/Scaleway/OVHcloud.
Inte AWS us-*.

### Konversations-minne i DB

Lägg till tabell `conversation_facts`:

```sql
CREATE TABLE conversation_facts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  turn_id UUID NOT NULL REFERENCES turns(id) ON DELETE CASCADE,
  fact_text TEXT NOT NULL,
  fact_type TEXT NOT NULL CHECK (fact_type IN ('user_stated', 'source_observed')),
  source_name TEXT,
  extracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_deleted_at TIMESTAMPTZ,
  INDEX idx_facts_user (user_id),
  INDEX idx_facts_thread (thread_id)
);
```

Selvra kör `extractFactsFromTurn` efter varje user-turn. Extraherar 0-N
facts som kan vara värdefulla för framtida samtal. Användaren ser dem i
`/minne`. Kan radera när som helst.

### Source-attribution i samtal

Varje samtal-turn från Selvra som refererar till data måste inkludera
källa-attribuering i strukturerat format. Inte fri text. Strukturerade
källa-citat som UI:t kan visa som klickbara referenser.

Exempel turn-output:

```json
{
  "text": "Du har sovit 5h 40min i snitt senaste 5 dagarna [source:garmin]. Din baseline är 7h 15min [source:garmin_baseline]. Det är ovanligt för dig.",
  "sources_cited": [
    {"name": "garmin", "claim": "5h 40min snitt senaste 5 dagarna"},
    {"name": "garmin_baseline", "claim": "7h 15min baseline"}
  ]
}
```

UI renderar `[source:X]` som klickbara badges som öppnar `/minne` filtrerat
på den källan.

## 8. RIVNINGS-SEKVENS (i ordning)

### Steg 1: Skapa branch `refactor/v1-consolidation`

Allt riv-arbete sker här. Master rörs inte förrän hela refaktorn är klar
och testad.

### Steg 2: Radera brev-paradigm

- Radera `app/brev/*` directory
- Radera `regenerateBrev` server action
- Radera brev-tabeller från DB-schema (migration)
- Radera brev-relaterade tester
- Sök through codebase för "brev"-referenser och rensa

### Steg 3: Radera Dreamer-paradigm

- Radera `app/traces/*` directory
- Radera Dreamer-genereringskod
- Radera Dreamer-relaterade tester
- Behåll Dreamer-output i memory om det redan finns (migration: konvertera
  till `conversation_facts` med `fact_type=source_observed`,
  `source_name=dreamer_legacy`)

### Steg 4: Radera standalone thoughts

- Radera `app/thoughts/*` directory
- Radera `submitThought` som standalone server action
- Behåll befintliga thoughts i DB (migration: konvertera till
  `conversation_facts` med `fact_type=user_stated`)
- Ny path för thoughts: extraheras från samtals-turns via
  `extractFactsFromTurn`

### Steg 5: Radera tvingande onboarding

- Radera `app/onboarding/*` directory (4 sidor)
- Skapa `app/welcome/page.tsx` (enkel)
- Login redirect efter magic-link verification → `/welcome` istället för
  `/onboarding/intentions`

### Steg 6: Refaktorera `/minne` till två-kategori-modell

- Konsolidera 4 block till 3: "Vad du sagt", "Vad dina källor visat",
  "Explicita minnen"
- Båda första kategorier läser från `conversation_facts` med olika
  `fact_type`-filter
- Tredje kategori (explicita minnen) bevaras som befintlig

### Steg 7: Bygg constitutional enforcement i chat-stream

- Skapa `lib/consumer_conversation_rules.py` (eller TS-motsvarighet)
- Hook in i `/api/chat/stream` så varje turn valideras innan stream
- Vid violation: regenerera. Vid upprepad violation: fallback-text + logg.

### Steg 8: Bygg `extractFactsFromTurn`

- Efter varje user-turn anropas LLM med specifik fact-extraction prompt
- Output sparas till `conversation_facts`-tabellen
- Användaren får notifikation i `/minne` om nya extraktioner

### Steg 9: Bygg source-attribution-strukturen

- Strukturerad JSON-output från LLM som listar källa-citat
- UI renderar `[source:X]` som klickbara badges
- Klick öppnar `/minne` filtrerat på källan

### Steg 10: Verifiera end-to-end

- Sätt env-vars i Vercel (DATABASE_URL, MISTRAL_API_KEY, RESEND_API_KEY,
  OAUTH-credentials)
- Kör end-to-end-flöde: magic-link → welcome → samtal → fact-extraction →
  minne-vy → export
- Dokumentera vad som fungerar, vad som inte gör det

### Steg 11: Merge till master

Endast när Steg 10 visar fungerande flöde. Inte före.

## 9. KONSTITUTIONELLA KONTROLL-POSTER

Efter varje större commit, granska:

**1. Manipulerar Selvra på något sätt?**
Granska senaste 20 turns mot FORBIDDEN_PATTERNS-listan. Om någon träff:
regression.

**2. Är all data inom EU?**
Verifiera Vercel-region, backend-host, LLM-provider, sub-processors.

**3. Är source-attribution konsekvent?**
Granska samtal-output: varje data-claim måste ha källa. Granska tester.

**4. Kan användaren ta bort allt?**
Verifiera delete-account, delete-thread, delete-fact, source-disconnect
fungerar end-to-end.

**5. Är SREF-export komplett?**
Verifiera att export inkluderar all `conversation_facts`, alla threads,
alla turns, all metadata. Användaren ska kunna ge JSON till annan AI och
få samma representation.

## 10. AVSLUTANDE KONSTITUTIONELL ANKARSPUNKT

Detta är vad vi bygger:

> En samtals-baserad AI med multi-source levd minne, käll-attribuerad
> reflektion, EU-suverän infrastruktur, patient-ägd portabilitet,
> konstitutionellt enforced anti-manipulation.

Detta är vad vi INTE bygger:

> Vecko-brev. Tracking-dashboard. Multi-vertikal-paraply. Engagement-
> maximerande companion. Mainstream emotional friend. Coaching-app.

Om någon under bygget föreslår tillägg som divergerar från första stycket
eller läggs till från andra: stopp. Re-granska mot detta dokument.

Selvra v1 ska kunna pitchas i en mening:

> "Den ärliga AI-kompanjonen — som vet vad du har levt, inte bara vad du
> har sagt, och som aldrig manipulerar dig för att stanna."

Det är linjen. Allt annat tjänar den eller rivs.
