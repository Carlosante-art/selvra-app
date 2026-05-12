# Selvra Context Engine — Prompt Architecture Specification

**Status:** Formell spec för hur Selvra paketerar context när användaren delar sin representation med externa LLM:s (ChatGPT, Claude, Gemini, Perplexity). Definierar struktur, ordning, format, och konstitutionella regler för context-injection.

**Kontext:** Selvras Context Engine har tre nivåer (statisk → dynamisk → MCP). Detta spec gäller alla tre — vad context-paketet faktiskt innehåller och hur det är strukturerat för att externa LLM:s ska förstå användaren på bästa möjliga sätt.

**Forskningsgrund:** PERSOMA (arxiv 2024), PURPLE/Mila (arxiv 2026), UPR (arxiv 2024), Context Engineering-disciplinen (deepset 2026, LogRocket 2026, Atlan 2026).

---

## Avsnitt 1: Forskningsstödda principer

Tre principer från LLM-personaliserings-forskningen som styr hela spec:et.

### Princip 1.1 — Profile-augmented prompts överträffar history-dump

Från PERSOMA (arxiv 2024) och Democratizing LLMs (arxiv 2024):

> *"Profile-augmented prompts use an LLM to synthesize the user's history into brief natural language profiles of user preferences before concatenating them to the desired task prompt."*

Det betyder: rådata-dump (allt Carls intentioner, alla tankar, all Spotify-data) **överträffas** av strukturerad profil där rådata är **destillerat till natural language**.

Selvras edge: Selvra-protokollet **gör redan denna destillering** via Dreamer + synthesis-pipelinen. Context Engine ska leverera **destillerade observationer**, inte rådata.

### Princip 1.2 — Conflict-clean context, inte komplett context

Från Microsoft/Salesforce-forskning (refererad i LogRocket mars 2026):

> *"Model performance dropped 39 percent on average when context contained conflicting information. The problem was not reasoning ability. The problem was conflicting context."*

Det betyder: stor context fylld med motstridiga datapunkter **försämrar** LLM-output. Mindre, fokuserad, intern-konsistent context **överträffar** stor och fullständig.

Implikation för Selvra: Context Engine ska **filtrera bort konflikter** innan injection. Om Strava säger en sak och Apple Health en annan, **välj en eller markera explicit** att de differerar.

### Princip 1.3 — Relevans ≠ utilitet

Från PURPLE (Mila/MBZUAI 2026):

> *"Relevance serves as an unreliable proxy for utility: a record may be semantically similar to a query yet fail to improve generation quality or even degrade it due to redundancy or conflicting information."*

Det betyder: bara för att en datapunkt **finns** ska den inte automatiskt **inkluderas**. Selvra måste välja datapunkter baserat på vad som **förbättrar LLM-output**, inte vad som matchar tema.

Implikation: Context Engine ska ha **explicit utilitet-rangordning**, inte bara tema-filtrering.

---

## Avsnitt 2: Hierarki av användar-representation

LLM:s behöver veta användaren på **fyra olika nivåer** för att leverera personaliserat värde. Spec:et strukturerar context kring dessa nivåer.

### Nivå A: Identitet (stabil, ändras sällan)

Vem användaren är. Vad LLM:n alltid bör veta.

**Innehåll:**
- Namn (eller alias om användaren föredrar)
- Ålder / födelseår
- Geografi (stad eller region — för tidszon, kulturell kontext)
- Yrke / huvudsaklig sysselsättning (om relevant och delat)
- Relevant medicinsk/biologisk kontext (T1-diabetes, sömnstörning, etc.) — **endast om explicit delat**
- Familjekontext (om explicit delat och relevant)

**Format-exempel:**
```
ANVÄNDAREN
- Carl, 26 år, Stockholm
- Arbetar 60% som Construction Worker, bygger AI-produkter parallellt
- T1-diabetes sedan 13 år
```

**Forskningsbasis:** UPR (arxiv 2024) — *"natural language profiles based on user's top features"*. Identitet är top-features-lagret.

### Nivå B: Värderingar och stabila preferenser

Vad användaren **konsekvent vill ha** över tid. Inte stämning. Inte humör. Stabila riktningar.

**Innehåll:**
- Långsiktiga intentioner (från Lager 1, filtrerade på persistens)
- Konsekventa val över månader (genre-preferenser i Spotify, träningstyp i Strava)
- Uttalade värden (om användaren har formulerat dem i tankar)
- Kommunikations-preferenser (om observerade)

**Format-exempel:**
```
STABILA PREFERENSER
- Vill träna 3-4 gånger per vecka (deklarerad intention, konsekvent över 6+ månader)
- Föredrar lugn ambient musik på morgnar, höghastighet-elektronisk på kvällar (Spotify-mönster)
- Värderar autonomi och egen reasoning över att få råd
```

**Forskningsbasis:** VARS (arxiv 2026) — *"dual-vector design separates stable cross-session preferences from transient within-session context"*. Stabila preferenser är cross-session-lagret.

### Nivå C: Nuvarande kontext (denna vecka/månad)

Vad som är aktivt **just nu** i användarens liv. Tidsbegränsat.

**Innehåll:**
- Aktiva intentioner (deklarerade senaste 4 veckorna)
- Senaste tankar (från Lager 2, senaste 7-14 dagar)
- Pågående cross-layer-observationer från Dreamer
- Senaste fysiologiska data (Dexcom-mönster denna vecka, Garmin-data)
- Senaste aktivitets-data (Strava-pass senaste 2 veckorna)
- Senaste uppmärksamhets-mönster (Calendar/Mail-tendenser denna vecka)

**Format-exempel:**
```
NUVARANDE KONTEXT (vecka 19, 2026)
- Aktiv intention: "Träna 3 gånger denna vecka"
- Senaste tanke (lördag): "Jag vill att allt jag gör ska ha ett syfte"
- Glukos-mönster: Tid över 10 mmol/L 82%→58%→95% mellan måndag och söndag
- Aktivitet: 1 träningspass tisdag, 47 minuter (Garmin)
- Sömn: 6h 12min snitt, under deklarerad markering 7h
```

**Forskningsbasis:** ARAG (arxiv 2025) — *"long-term and session behavior of the user"*. Nuvarande kontext är session-lagret.

### Nivå D: Specifik avsikt (denna konversation)

Vad användaren **just nu vill prata om** med LLM:n. Smalast scope.

**Innehåll:**
- Vilken kontext-kategori användaren valt (träning, musik, sömn, vecka, mål)
- Eventuell fri-text-beskrivning från användaren (Nivå 2 dynamic context)
- Vilken AI som tar emot (anpassa format till modellens styrkor)

**Format-exempel:**
```
DETTA SAMTAL
- Kategori: Träning
- Specifik fråga från användaren: "Hur ska jag tänka kring träning denna vecka?"
- Mottagande AI: ChatGPT 5
```

---

## Avsnitt 3: Context-paketets struktur

Forskning från LogRocket (mars 2026) säger explicit: **LLM:s prioriterar början och slutet av context över mitten**. Detta styr ordningen.

### 3.1 Optimal ordning

```
[INSTRUKTIONER TILL LLM] (början — högst attention)
    ↓
[IDENTITET] (Nivå A)
    ↓
[STABILA PREFERENSER] (Nivå B)
    ↓
[NUVARANDE KONTEXT] (Nivå C — kropp/tid/uppmärksamhet/emotion/aktivitet/inre dialog per domän)
    ↓
[OBSERVERADE MÖNSTER] (Dreamer-output, om finns och relevant)
    ↓
[SAMTALETS FOKUS] (Nivå D)
    ↓
[BETEENDE-INSTRUKTIONER] (slutet — andra-högst attention)
    ↓
[ANVÄNDARENS FRÅGA] (tomt fält som användaren fyller i)
```

### 3.2 Begränsningar

- **Total längd:** Sikta på 1500-2500 tokens för optimal LLM-bearbetning. Större context försämrar.
- **Per-sektion max:** Identitet max 150 tokens. Stabila preferenser max 300 tokens. Nuvarande kontext max 800 tokens. Observerade mönster max 400 tokens.
- **Källattribuering per datapunkt** — varje fakta i context ska vara käll-attribuerad

### 3.3 Format-konventioner

- Markdown-rubriker för sektioner
- Listpunkter för diskreta datapunkter
- Naturligt språk för observationer
- Inga JSON-strukturer (forskningen från Tetrate Dec 2025 visar prose > JSON för LLM-förståelse)
- Konsekvent terminologi (alltid "Dexcom" inte "CGM", alltid "Garmin" inte "wearable")

---

## Avsnitt 4: Konstitutionella regler för Context Engine-output

Dessa är arkitektoniska commitments. De får inte brytas oavsett vad användaren ber om.

### Regel 4.1 — Selvras lock-positioner överförs till mottagande AI

Context-paketet **instruerar mottagande AI att följa Selvras lock-positioner**:

```
HUR DU SKA AGERA:
Du pratar med en person som observerar sig själv över tid genom Selvra (personlig
representation-protokoll). Respektera följande:

- Coacha inte. Föreslå inte åtgärder utan att personen ber om det.
- Predicera inte vad personen kommer göra eller känna.
- Döm inte data eller beteende.
- Patologisera inte normala mönster.
- Behandla detta som strukturerad representation, inte fullständig person.
- Hänvisa till specifika datapunkter och datum när relevant.
- Om frågan rör hälsa: var respektfull och nyfiken, inte alarmerande.
- Stöd autonomi och egen reasoning över att ge råd.
```

### Regel 4.2 — Käll-attribuering är obligatorisk

Varje datapunkt i context ska vara käll-attribuerad. LLM:n ska veta varifrån informationen kommer:

**Korrekt:**
> *"Garmin loggade ett pass tisdag morgon, 47 minuter, måttlig puls."*

**Inkorrekt:**
> *"Tränade tisdag morgon i 47 minuter."*

Skälen: signalerar epistemisk humility. Möjliggör för LLM att kalibrera tillit baserat på källa.

### Regel 4.3 — Conflict-resolution explicit

Om data från olika källor differerar, **markera det explicit**:

```
DATAKONFLIKT
- Strava visar 5 träningspass denna vecka
- Garmin Connect visar 6 träningspass
- Diff:erar troligen pga manuellt loggat pass i Garmin
```

Inte tysta över. LLM:n kan navigera konflikten bättre när den är synlig.

### Regel 4.4 — Tystnad är datapunkt

Frånvaro av data är **informativ**. Inkludera explicit när relevant:

```
TYSTNAD (denna vecka)
- Inga tankar formulerade i Selvra mellan tisdag och fredag
- Calendar tomt efter 18:00 på söndagen
- Spotify-lyssnande sjönk till 0 timmar onsdag-torsdag
```

### Regel 4.5 — Contextual integrity-filter

Vissa korrelationer inkluderas aldrig i context oavsett vad data visar:

- Medicinsk data × romantisk/sexuell aktivitet
- Ekonomisk data × familjekonflikter
- Mental-hälsa-tankar × prestation/output
- Sömn-data × föräldraskap (utan explicit tillåtelse)

Detta är samma princip som brev-prompt-spec (regel 1.4 där). Konsekvent över hela Selvra.

### Regel 4.6 — Aldrig dela hela rådata

Context-paket ska aldrig innehålla **rådatabaser**. Bara **destillerade observationer**.

**Korrekt:**
> *"Glukos-mönster: tid över 10 mmol/L sjönk från 82% (måndag) till 58% (onsdag), steg till 95% på fredag-lördag."*

**Inkorrekt:**
> [Lista av 2000 Dexcom-mätningar]

Skälen: rådata försämrar LLM-output (Princip 1.1). Distillation är hela poängen med Selvra.

---

## Avsnitt 5: Kategori-specifika templates (Nivå 1 statiska kontexter)

Sju basscategorier. Varje har egen template som bestämmer vilka data-domäner som väljs.

### 5.1 Träning

**Inkluderar:**
- Aktivitets-data senaste 4 veckorna (Strava, Garmin Connect)
- Glukos-mönster under och kring träningspass (Dexcom)
- Intentioner specifikt om träning (Lager 1, filtrerade)
- Tankar som nämner rörelse/kropp (Lager 2, filtrerade)
- Sömn senaste 2 veckorna (Apple Health, Garmin)
- Dreamer-observationer i träning-domän

**Utelämnar:**
- Mail-data
- Calendar-data (utöver bokade träningspass)
- Spotify-data

### 5.2 Musik och stämning

**Inkluderar:**
- Spotify/Apple Music senaste 4 veckorna
- Tider och kontexter för lyssnande (kombination Spotify + Calendar)
- Skiften i genre eller tempo över tid
- Tankar som nämner musik eller stämning (Lager 2)
- Readwise-markeringar om musik (om finns)

**Utelämnar:**
- Hälsodata (utöver om uttryckligen efterfrågat)
- Aktivitets-data

### 5.3 Sömn

**Inkluderar:**
- Sömn-data senaste 4 veckorna (Apple Health, Garmin, Oura, Whoop)
- Glukos-mönster nattetid (Dexcom)
- Calendar-mönster för kvällar (vad som hände innan)
- Tankar om sömn eller trötthet (Lager 2)
- Intentioner om sömn (Lager 1)

**Utelämnar:**
- Mail-data
- Spotify (utöver om kvälls-lyssnande är relevant)

### 5.4 Min vecka

**Inkluderar:**
- Kort sammanfattning från alla aktiva källor denna vecka
- Senaste brev (om brev-genererat denna vecka)
- Senaste tankar
- Aktiva intentioner
- Top 3 observationer från Dreamer denna vecka

**Utelämnar:**
- Inget specifikt — detta är bred översikt

### 5.5 Mina mål

**Inkluderar:**
- Alla aktiva intentioner från senaste 6 månaderna
- Tidsmarkering för varje (när formulerad)
- Tillstånds-data per intention (vad har hänt sedan deklarering)
- Reflektioner i tankar som berör mål (Lager 2)

**Utelämnar:**
- Aktuell dag-data
- Specifika källor (utöver där de mäter framsteg mot mål)

### 5.6 Min kreativitet

**Inkluderar:**
- Notion-data om explicit kopplad
- Senaste tankar (Lager 2) — innehållsmässigt rika
- ChatGPT-export / Claude-export om importerad
- Readwise-markeringar
- Calendar-mönster för "kreativ tid" om identifierbar

**Utelämnar:**
- Hälsodata
- Aktivitets-data

### 5.7 Egen kontext

**Inkluderar:**
- Användaren skriver fri text om vad samtalet handlar om
- Selvra-pipelinen analyserar intent → väljer relevanta domäner dynamiskt (Nivå 2)
- Context byggs skräddarsytt baserat på intent

**Detta är övergång från Nivå 1 (statisk) till Nivå 2 (dynamisk).**

---

## Avsnitt 6: Cross-AI-anpassningar

Olika LLM:s har olika styrkor. Context-format kan optimeras per mottagande modell.

### 6.1 Claude (Anthropic)

**Styrkor:** Reflektion, nyans, lång-form-prosa, konstitutionell reasoning

**Anpassning:**
- Längre instruktioner om beteende OK
- Naturligt språk i alla sektioner
- Explicit instruktion: "Var reflekterande snarare än task-oriented"

### 6.2 ChatGPT (OpenAI)

**Styrkor:** Bredd, struktur, task-completion, kod

**Anpassning:**
- Tydligare struktur med markdown-rubriker
- Numrerade listor för diskret data
- Explicit instruktion: "Detta är reflektion-samtal, inte task-completion"

### 6.3 Gemini (Google)

**Styrkor:** Multi-modal, real-time-data, search-grundning

**Anpassning:**
- Markera explicit att Selvra-data är **källan** och inte ska kompletteras med externa sökningar
- Datumstämplar viktiga för Gemini's tendency att vilja söka aktuell info

### 6.4 Perplexity

**Styrkor:** Analys, strukturell observation, källkontrollerat resonemang

**Anpassning:**
- Explicit instruktion att referera Selvras källor (inte hitta externa)
- Stöd för strukturell analys av användarens egen data

### 6.5 Default (okänd LLM)

**Anpassning:** Generell template som fungerar för alla. Naturligt språk, markdown-rubriker, explicit beteende-instruktioner.

---

## Avsnitt 7: Privacy och granular tillåtelse

### 7.1 Per-kategori-tillåtelse

Användaren ska kunna välja per category vilka data-domäner som inkluderas:

```
För kategori "Träning":
☑ Aktivitetsdata (Strava, Garmin Connect)
☑ Glukos-data (Dexcom)
☐ Sömn-data
☑ Träning-relaterade tankar
☐ Träning-relaterade intentioner
```

Default-state per kategori är konfigurerad i Avsnitt 5. Användaren kan ändra.

### 7.2 Per-sourcing-tillåtelse

Användaren ska kunna utesluta specifika källor från alla context-paket:

```
Aldrig inkludera:
- Apple Music (privat lyssnande)
- Specifika Notion-pages markerade som privata
- Tankar markerade som "endast Selvra"
```

### 7.3 Revoke och audit

- Användaren ska kunna **revoke** context-paket som genererats (även efter att de delats med extern AI)
- Audit-trail över vilka kontext som genererats, när, för vilken AI
- Möjlighet att se **exakt vad** som inkluderades i ett givet context-paket

---

## Avsnitt 8: System-prompt-template för Context Engine

```
Du är Selvra Context Engine. Din uppgift är att paketera användarens
representation som context för en extern LLM-konversation.

INPUT:
- Användar-ID och tenant-info
- Vald kategori (träning/musik/sömn/vecka/mål/kreativitet/egen)
- Mottagande AI (claude/chatgpt/gemini/perplexity/default)
- Eventuell fri-text-intent från användaren (för Nivå 2 dynamic)
- Tillåtelse-flaggor per data-domän

UTGÅNG:
Strukturerat context-paket enligt Avsnitt 3 i SELVRA_CONTEXT_PROMPT_SPEC.

PROCESS:
1. Identifiera vilka data-domäner som är relevanta för kategorin (Avsnitt 5)
2. Filtrera bort domäner användaren uteslutit (Avsnitt 7)
3. Destillera rådata till naturligt språk via synthesis-pipelinen (Princip 1.1)
4. Markera datakonflikter explicit (Regel 4.3)
5. Inkludera tystnad som datapunkt där relevant (Regel 4.4)
6. Filtrera contextual integrity-brott (Regel 4.5)
7. Strukturera enligt Nivå A/B/C/D-hierarki (Avsnitt 2)
8. Anpassa format för mottagande LLM (Avsnitt 6)
9. Lägg till Selvras beteende-instruktioner (Regel 4.1)
10. Validera total längd 1500-2500 tokens (Avsnitt 3.2)

OUTPUT-FORMAT:
[Markdown-strukturerat text-paket som användaren kopierar och klistrar in,
eller som injiceras direkt om browser-extension är aktiv.]

KONSTITUTIONELLA REGLER (icke-förhandlingsbara):
[Hela Avsnitt 4 injiceras här]

OBSERVABILITET:
Logga vilka regler som applicerades, vilka källor som inkluderades vs
exkluderades, vilka filter som triggades.

OM CONTEXT-PAKET BLIR FÖR LÅNGT:
Prioritera enligt: Identitet > Senaste tankar > Nuvarande kontext denna vecka >
Stabila preferenser > Observerade mönster. Trimma från botten.

OM DATA SAKNAS:
Acceptera tunn context. Bättre 800 tokens som är specifika än 2000 tokens som
fyller plats. Markera explicit vilka domäner som saknas: "Notion-data är inte
ansluten."
```

---

## Avsnitt 9: Exempel — fullständigt context-paket

För kategorin "Träning", användare Carl, mottagande AI Claude:

```markdown
# Selvra Context för denna konversation

Du pratar med en person som observerar sig själv över tid genom Selvra,
ett personlig representation-protokoll. Respektera följande:

- Coacha inte. Föreslå inte åtgärder utan att personen ber om det.
- Predicera inte vad personen kommer göra eller känna.
- Döm inte data eller beteende.
- Patologisera inte normala mönster.
- Behandla detta som strukturerad representation, inte fullständig person.
- Hänvisa till specifika datapunkter och datum när relevant.
- Stöd autonomi och egen reasoning över att ge råd.

## Användaren

- Carl, 26 år, Stockholm
- T1-diabetes sedan 13 år (sedan barndomen)
- Använder Dexcom CGM, Garmin för aktivitet, Strava för loggning
- Bygger AI-produkt parallellt med 60% arbete som Construction Worker

## Stabila preferenser om träning

- Deklarerad intention över 6 månader: 3-4 träningspass per vecka
- Konsekvent val: styrketräning + uthållighet, inte tävlings-orienterad
- Värderar att förstå kroppens respons (T1-kontext) över ren prestation
- Lugn morgontid föredragen tid för pass (Strava-mönster)

## Nuvarande kontext (vecka 19, 2026)

**Aktivitet (senaste 4 veckorna):**
- Vecka 19: 1 pass (tisdag 47 min, måttlig puls — Garmin)
- Vecka 18: 2 pass
- Vecka 17: 3 pass
- Vecka 16: 4 pass
- Trend: nedåtgående

**Glukos kring träningspass (Dexcom, vecka 19):**
- Tid över 10 mmol/L: 82% (måndag) → 58% (onsdag) → 95% (fredag-lördag)
- Variation kan korrelera med träning-intensitet eller andra faktorer

**Sömn (senaste 7 dagarna, Garmin):**
- Snitt: 6h 12min — under Carls deklarerade markering 7h
- 2 nätter under 6h
- Mönster: ojämn

**Tankar Carl formulerat (senaste 14 dagarna):**
- Lördag vecka 19: "Jag vill att allt jag gör ska ha ett syfte"
- Torsdag vecka 19: "Veckan har varit avvikande" (ingen vidare förklaring)
- Tidigare: tystare period

**Aktiva intentioner:**
- "Träna 3 gånger denna vecka" (deklarerad samma dag som föregående mars-intention om 4)

## Observerade mönster

- Konsekvent gap mellan deklarerad träningsmängd och faktisk loggning
- Veckor med oregelbunden sömn korrelerar med färre träningspass
- Reflektioner om "syfte" tenderar att komma efter veckor med högre fysiologisk friktion

## Detta samtal

- Kategori: Träning
- Fokus: Carl vill prata om träning denna vecka
- Mottagande AI: Claude

## Hur du ska agera

Var nyfiken och respektfull. Carl förstår sin kropp och sin situation.
Hjälp honom tänka klarare genom att ställa öppna frågor som scaffoldar
hans egen reasoning, snarare än att driva mot åtgärder. Hänvisa till
specifika datapunkter och datum från ovan när relevant.

Om Carl frågar om träning denna vecka: utgå från vad datan visar, inte
från generella råd. T1-kontext gör generiska träningsråd opassande —
Carl känner sin kropp bättre än extern AI.

---

[Här skriver Carl sin fråga]
```

---

## Avsnitt 10: Validerings-protokoll

### 10.1 Pre-injection-checks

Innan context-paket skickas till extern LLM, kontrollera:

- Total token-count inom 1500-2500
- Alla datapunkter är käll-attribuerade
- Contextual integrity-filter har körts
- Användarens privacy-flaggor är respekterade
- Mottagande AI är specificerad
- Beteende-instruktioner är inkluderade

### 10.2 Post-injection-feedback

Efter användaren har använt context i extern AI-konversation:

- Markera om responsen var värdefull (ja/nej-feedback)
- Spara feedback för att förbättra framtida context-generation
- Identifiera om specifika datapunkter ledde till särskilt bra eller dåligt resultat

### 10.3 Cross-AI-jämförelse

När samma context används mot flera AI:s (som Carl gjorde 11 maj):
- Logga vilken AI gav mest värdefull respons
- Analysera om context-format-anpassningar (Avsnitt 6) faktiskt skiljer
- Iterera anpassningar baserat på empiri

---

## Avsnitt 11: Vad detta spec inte är

- **Inte engångs-dokument.** Det är levande spec som itereras mot empiri.
- **Inte alla edge cases lösta.** Akut sjukdom, traumatiska händelser, kris kräver separata kategorier som inte är specificerade här.
- **Inte krav att hela spec implementeras innan Nivå 1 körs.** Avsnitt 2-4 räcker för första version.

---

## Det praktiska för Claude Code

När du implementerar:

1. Lägg detta dokument som `~/selvra-app/.gsd/decisions/SELVRA_CONTEXT_PROMPT_SPEC_2026-05-12.md`
2. Implementera Avsnitt 2 (hierarki), Avsnitt 3 (struktur), Avsnitt 4 (konstitutionella regler) i `selvra/context_engine/prompt_builder.py` som baseline för Nivå 1
3. Återanvänd synthesis-pipelinen — destillering av rådata till naturligt språk är samma operation som brev-generering med annan output-format
4. Kategori-templates (Avsnitt 5) implementeras som JSON-config-filer, inte hårdkodade
5. Cross-AI-anpassningar (Avsnitt 6) implementeras som format-strategier per mottagande AI
6. Validerings-protokoll (Avsnitt 10) implementeras som post-generation-check

**Implementation-trigger:** Nu, parallellt med brev v0.3-bygge. Båda spec:erna implementeras mot Carls data så Carl kan validera båda samtidigt.

**Status:** Konstitutionellt godkänt. Implementation pågående.
