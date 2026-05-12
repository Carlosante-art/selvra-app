# Selvra Context Engine — Strategiskt arkitektoniskt beslut

> **Konstitutionellt godkänt 2026-05-12.** Detta är **strategiskt fundament**,
> inte build-instruktion. Implementation gating:as av tesen-validering via
> brev v0.3 mot fullständig data.

**Status:** Strategi-dokument. Definierar Selvras position som context engineering-engine för externa AI-konversationer. Tre-nivåers implementation över v1, v1.1, v1.2.

**Kontext:** Selvra har redan generell export-funktion (Nivå 0, clickable på /export/ai-context). Selvra-protokollet har redan MCP-server med per-source_ai_id access-kontroll byggd. Marknadsvalidering är aktiv — AI memory portability är kategori som växer explosivt 2026. Konkurrenter (Plurality Network, AI Context Flow, AI Migrator, Anthropic claude.com/import-memory) är USA-baserade och baserar sig på ChatGPT-memory-export, inte multi-source livs-observation.

---

## Konstitutionellt fundament

Tre principer som styr hela Context Engine-implementationen:

### Princip 1: Selvras edge är källan, inte funktionen.

Konkurrenterna exporterar ChatGPT-memory. Det är **AI-konversation-historik** — fattig representation av användaren. Selvra exporterar **livet** — kropp, tid, uppmärksamhet, emotion, intention, aktivitet, observerade mönster.

Det betyder Context Engine-prompts från Selvra är **fundamentalt rikare** än vad konkurrenterna kan producera. Den distinktionen är inte teknisk. Den är **arkitektonisk** — kommer ur Selvras multi-source aggregation.

Implementationen ska göra detta synligt. Varje context-output ska visa **vilka källor som bidrog** så användaren förstår att detta inte är generic memory-dump.

### Princip 2: Selvra är context engineering-engine, inte prompt-generator.

Statiska prompt-mallar är begränsade. Selvra ska bygga **dynamisk context** som matchar exakt vad användaren försöker göra i sin AI-konversation.

Detta är **context engineering**-disciplinen som etablerades 2025-2026. Selvra-protokollets synthesis-pipeline är redan byggd för detta — bara prompt:ad för annan output.

Implementationen ska därför **återanvända synthesis-pipelinen** istället för att bygga separat prompt-generation-system. Brevgenerering och context-generation är samma underliggande operation med olika output-format.

### Princip 3: MCP-yta är slutpositionen.

Kopiera-och-klistra (Nivå 1-2) är **inkörsport**. Riktig långsiktig position är att Selvra **läser av andra AI:s direkt** via MCP — utan att användaren behöver hantera context manuellt.

Selvra-protokollet har redan MCP-server. Per-source_ai_id är redan implementerat. UI saknas. Den implementationen ska prioriteras när tidpunkten är rätt.

---

## Tre-nivåers implementation

### Nivå 1: Statiska kontextuella prompts (v1-implementation)

**Vad:** Användaren ser kort på /export-sida (eller ny /context-sida) med fem-sju basscontext-kategorier. Klick genererar färdig prompt med relevant data för specifik konversation-typ.

**Användarflöde:**
1. Användaren öppnar /context (eller /export/ai-context)
2. Ser kort: "Prata med AI om min träning" / "...min musik och stämning" / "...min sömn" / "...min vecka" / "...min kreativitet" / "...mina mål" / "Egen kontext"
3. Klickar valt kort
4. Selvra paketerar relevant data + framing för den kontexten
5. Användaren kopierar och klistrar in i ChatGPT/Claude/Gemini

**Teknisk implementation:**
- Backend: ny endpoint `/v1/subjects/{id}/context/{kategori}` som returnerar strukturerad text-prompt
- Synthesis-pipelinen återanvänds — samma Claude Opus-anrop som genererar brev, men med annan system-prompt som outputtar context-format
- Kategorier definieras som data-filter + framing-mall: "träning" = senaste 4 veckorna Strava + Dexcom-mönster vid pass + intentioner om träning + tankar som nämner rörelse
- Frontend: kort-baserad UI på /context med preview + copy-button per genererad prompt

**Format på output (exempel "träning"):**

```
Detta är min kontext från Selvra (personlig representation-protokoll).

OM ANVÄNDAREN (Carl):
- 26 år, T1-diabetiker sedan 13 år
- Använder Garmin/Strava för aktivitet, Dexcom för glukos
- Observerar sig själv över tid genom Selvra

AKTIVA INTENTIONER OM TRÄNING:
[från Lager 1, filtrerat på träning-tema]

SENASTE AKTIVITETSDATA (Strava, senaste 4 veckorna):
[summerad statistik + specifika pass av intresse]

GLUKOS-MÖNSTER UNDER OCH KRING TRÄNINGSPASS (Dexcom):
[Path C-data filtrerat på pass-tidpunkter ± 4 timmar]

TANKAR OM RÖRELSE/SYFTE (senaste 30 dagarna):
[från Lager 2, filtrerat på relevant tema]

OBSERVERADE MÖNSTER:
[Dreamer-output filtrerat på träning-domän]

HUR DU SKA AGERA:
Var respektfull och nyfiken. Carl observerar sig själv över tid genom Selvra.
Hjälp honom tänka klarare — inte coacha honom. Ställ frågor som öppnar, inte
som driver mot åtgärd. Hänvisa till specifika datapunkter och datum när
relevant. Behandla detta som strukturerad representation, inte fullständig
person.

KÄLLOR ATT NÄMNA OM RELEVANT:
- Strava (rörelse), Dexcom (kropp), Selvra-tankar (vad Carl själv formulerat),
  Selvra-intentioner (vad Carl sagt han vill)

[Plats för Carl att skriva sin fråga:]
```

**Lock-position-överensstämmelse:**
- Lock 5 (käll-attribuering): varje sektion namnger källan
- Lock 1 (käll-attribuerade observationer, aldrig judgement): mönster-sektionen citerar Dreamer-output utan tolkning
- Brev-metaforen: prompten är inte chat — det är **introduktion** till annan AI-konversation
- Agency-position: användaren väljer kontext, väljer vilken AI, behåller kontroll

**Estimat:** 2-3 dagar för fem grundkategorier + UX + copy-flow. Förutsätter att grundläggande synthesis-pipeline är stabil (är det idag efter v0.2.2-iteration).

**Trigger för bygge:** Efter brev v0.3 mot fullständig data (Calendar + Mail + Spotify + Strava + Dexcom) har validerat tesen. Inte före — annars bygger vi mot ofullständig data och kategorier kan visa sig fel.

---

### Nivå 2: Dynamisk context engineering (v1.1-implementation)

**Vad:** Användaren beskriver kort vad hen tänker prata med AI om. Selvra-pipelinen genererar **skräddarsydd** context på 5-15 sekunder. Mer kraftfull än statiska kategorier eftersom den matchar exakt vad användaren faktiskt försöker göra.

**Användarflöde:**
1. Användaren öppnar /context
2. Ser även **fri text-input**: "Beskriv vad du tänker prata med AI om..."
3. Skriver: "Jag vill prata med ChatGPT om hur jag ska strukturera nästa vecka, med tanke på att jag haft hög glukos och inte sovit bra."
4. Selvra-pipelinen analyserar avsikten, väljer relevanta källor och tidsperioder, genererar skräddarsydd context
5. Output: prompt med exakt rätt data för exakt den konversationen
6. Användaren kopierar och klistrar in

**Teknisk implementation:**
- Backend: ny endpoint `/v1/subjects/{id}/context/dynamic` som tar `intent_description` som body
- Synthesis-pipelinen körs i två steg:
  - **Steg 1:** Claude Opus analyserar `intent_description` → identifierar relevanta källor + tidsperiod + tema
  - **Steg 2:** Claude Opus genererar context-prompt baserat på identifierad selection (samma pipeline som brev-generering men med context-system-prompt)
- Frontend: text-input på /context + loading-state + preview + copy-button
- Caching: 30 minuters cache per `intent_description` för att undvika dubbel-generation

**Output-format:** Samma struktur som Nivå 1, men med dynamiskt vald data baserat på intent. Källor + tidsperiod + tema väljs automatiskt av synthesis-pipelinen.

**Lock-position-överensstämmelse:** Samma som Nivå 1, plus:
- Användarens egna ord (intent_description) styr selection — agency förstärks
- Selvra förklarar **varför** den valde dessa källor — transparens
- Output visar identified intent som första block — användaren ser hur Selvra tolkade

**Estimat:** 3-5 dagar. Mer komplex än Nivå 1 men återanvänder synthesis-pipelinen. Mer arbete på UX (preview, transparens, edit-flow för att justera).

**Trigger för bygge:** Efter Nivå 1 har körts i dogfood-veckor och Selvra-pipelinen har itererats för context-generation specifikt.

---

### Nivå 3: MCP-yta för externa AI-klienter (v1.2-implementation)

**Vad:** Selvra-protokollets befintliga MCP-server exponeras för externa AI-klienter som stöder MCP (Claude Desktop, ChatGPT Pro med MCP). Användaren konfigurerar sin AI-klient en gång — sedan läser den Selvra direkt under konversationer **utan att användaren behöver kopiera/klistra**.

**Användarflöde:**
1. Användaren går till /context/mcp på selvra-app
2. Ser instruktioner för Claude Desktop / ChatGPT Pro / annan MCP-kompatibel klient
3. Genererar **per-source_ai_id-nyckel** med specifik scope (vilka domäner får läsas) och TTL (hur länge nyckeln giltig)
4. Klistrar in konfiguration i sin AI-klient
5. Pratar med AI:n som vanligt — den **läser Selvra direkt** under konversationen baserat på vad samtalet handlar om

**Teknisk implementation:**
- Backend: MCP-server existerar redan i Selvra-protokollet — bara UI för nyckel-management + dokumentation saknas
- Per-source_ai_id-system är redan implementerat — Selvra vet vilken AI-klient som frågar
- Frontend:
  - /context/mcp-sida med klient-specifika instruktioner (Claude Desktop config, ChatGPT Pro MCP-setup)
  - Nyckel-management-UX: skapa, namnge, scope:a, sätt TTL, revoke
  - Audit-trail: se vilka AI:s som läst vilka domäner när
- Constitutional reasoning: Moderator-skiktet kontrollerar att MCP-anrop respekterar scope och TTL — om Claude Desktop ber om data utanför scope, returnerar Selvra avvisning med förklaring

**Output:** Inte text-prompt. **Live access** för AI:n att hämta strukturerad Selvra-data direkt under konversationen. AI:n kan ställa följdfrågor, dra fler observationer, korsreferera över tid — allt baserat på riktig Selvra-data i realtid.

**Lock-position-överensstämmelse:**
- Agency-position fullt enforcad: användaren genererar nycklar, sätter scope, kan revoke
- Constitutional reasoning enforce:ad av Moderator vid varje MCP-anrop
- Provenance: varje datapunkt som AI:n läser kommer med källattribuering
- Lock 5 (käll-attribuering) blir automatisk via MCP-protokollets metadata

**Estimat:** 4-7 dagar (mest UX-arbete eftersom backend existerar). Power-user-feature så perfekt UX är inte krav — funktionell UX räcker för v1.2.

**Trigger för bygge:** Efter Nivå 2 har validerats och Selvra har minst 50-100 användare som dogfoodat Nivå 1-2. MCP är niche idag (Claude Desktop + ChatGPT Pro), men växande snabbt 2026-2027.

---

## Det större strategiska värdet

### Position mot konkurrenterna

| Aktör | Källa | Position | Geografisk |
|-------|-------|----------|------------|
| Plurality Network (OCL) | Vector embeddings + user-input | Decentralized identity-protokoll | USA |
| AI Context Flow | Browser-extension + manual setup | Productivity tool | USA |
| AI Migrator | ChatGPT memory export | One-time migration | USA |
| Anthropic claude.com/import-memory | ChatGPT memory via prompt | Customer acquisition tool | USA |
| **Selvra** | **Multi-source livsobservation** | **Context engineering-engine** | **EU (Frankfurt)** |

Selvras edge:
- **Källa:** Inte chat-historik utan kropp + tid + uppmärksamhet + emotion + intention. Fundamentalt rikare.
- **Position:** Inte tool, inte protocol — **engine**. Genererar färsk context per konversation, inte statisk dump.
- **Geografisk:** EU-deployed, EU AI Act-compliant. USA-konkurrenterna har CLOUD Act-exponering.
- **Arkitektur:** MCP redan inbyggd. Konkurrenterna kommer behöva retrofit:a den.

### Pitch-formulering att låsa

> *"Andra säger din ChatGPT-memory kan flyttas. Selvra säger att din ChatGPT-memory är fattig representation av dig — den vet vad du sagt till ChatGPT, inte vad ditt liv visar. Selvra är riktig representation: kropp, tid, uppmärksamhet, emotion, intention. Den följer med dig till varje AI-konversation. Den växer med dig."*

Detta är **distinkt pitch som ingen konkurrent kan kopiera** utan att bygga om hela sin arkitektur.

### Konstitutionell konsekvens — Selvra blir "lagret över AI:s"

Selvras canonical-fras: *"Selvra är lagret över allt annat. Garmin, Spotify, Calendar, Mail kräver något av dig. Selvra är det enda som inte kräver något."*

Med Context Engine utvidgas detta: **Selvra är även lagret över alla AI-konversationer du har.** ChatGPT, Claude, Gemini — alla blir rikare när Selvra föreslår kontext. Du behöver inte vara bra på prompting. Selvra gör det åt dig.

Det är inte feature. Det är **strukturell position**: Selvra är **infrastruktur över AI-användning**, inte konkurrent inom AI-användning.

---

## Det dokumentet inte är

Detta är **inte build-instruktion**. Det är **strategiskt fundament**.

Det Claude Code ska göra **just nu**:
1. Spara dokumentet på rätt plats ✓
2. Lägga in auto-memory så framtida sessions inte börjar bygga prematurt ✓
3. Spara åttonde canonical-frasen ✓
4. Bekräfta att Selvra-protokollets MCP-server fortfarande är intakt (verify, ingen kod-ändring) ✓ — bekräftat 2026-05-12: `src/selvra/mcp/server.py` (FastMCP factory), tools/query.py + propose.py + synthesis.py, prompts/dialectic_aware.py + with_user_context.py, resources/snapshot.py + divergences.py + provenance.py, MCPScope + TokenClaims.source_ai_id i `mcp/types.py` — allt på plats.

Det Claude Code **inte ska göra**:
- Bygga Nivå 1 nu
- Skriva endpoint-stubs
- Skapa /context-sida
- Lägga till context-kategorier i nav

Allt det väntar tills tesen-validering är klar via brev v0.3 mot fullständig data.

---

## Det större målet

Det här är **inte feature-tillägg**. Det är **position-cementering**.

Selvras tre canonical positionerings-poäng efter denna strategi:

1. **Lagret över livets källor** (Garmin, Calendar, Spotify, Mail, etc.)
2. **Lagret över AI-konversationer** (ChatGPT, Claude, Gemini via Context Engine)
3. **EU-sovereignty och constitutional reasoning** (regulatorisk + arkitektonisk edge)

Det är tre lager position. Var och en distinkt mot konkurrenter. Tillsammans **strukturellt försvarbar mot stora aktörer 2027-2028** (Google Personal Intelligence, Apple Personal Intelligence) och **bättre än AI-memory-portability-konkurrenter** (Plurality, AI Context Flow, Migrator).

Det är vad denna strategi cementerar.
