# Demo-onboarding: tre lager manifesterade

**Datum:** 2026-05-16 (iteration 2)
**Status:** Aktiv (reflektions-instrument, ej launch)
**Route:** `/demo?step=1|2|3`

## Vad demon är

Tre-skärmars manifestation av Selvras arkitektur som tre lager:

1. **Verktyget** — appen där data samlas, struktureras, käll-attribueras.
2. **Dagens kvitto** — mönsterigenkänning över källor och tid. Det användaren får värde av idag. Samma operation som Stillras doctor-brief, fast destillerad till användaren själv.
3. **Morgondagens moat** — representationen är portabel. Andra AI-system (Claude, ChatGPT, Cursor) kan läsa den via öppet protokoll när användaren ger tillgång.

**Kritiskt:** punkt 3 är INTE framtidsutsago. Selvra-protokollet är live på `selvra-production.up.railway.app`. MCP-servern (JSON-RPC 2.0) är publik. Det är leverans, inte löfte. Demon reflekterar detta i copy ("kan läsa via öppet protokoll", inte "kommer kunna läsa").

## Vad demon INTE är

- Inte launch. iOS-app är primär leverans H2 2026.
- Inte signup-flow. Mailto-CTA matchar landing.
- Inte auth. Demo är statisk syntetisk data.
- Inte backend-koppling. Inga API-anrop.
- Inte chat. Selvra är representation, inte konversation.
- Inte dashboard. Strukturen är ett dokument, inte en interaktionsyta.

## Vem den är för

Carl skickar `/demo` till 3-5 personer i nischen — vänner, peer-founders, två potentiella users som föredrar förståelse framför instruktion. Frågan:

> "Vad tror du Selvra gör?"

Utan förklaring först. Demon ska klara den frågan på egen hand.

## Vad som mäts

**Det enda som räknas:** plockar olika läsare oberoende av varandra upp samma 2-3 meningar som produktens kärna?

Praktiskt: efter att läsaren öppnat demon en gång, fråga muntligt eller via mail:

1. "Vad tror du Selvra gör?" (öppen fråga, ingen ledning)
2. "Vilken rad eller mening fastnade?" (vilken copy som faktiskt landade)
3. "Vad sägs det inte som du tror den borde säga?" (saknad)

Om 3 av 5 svarar samma sak på fråga 1 — vi har positionering. Om svaren spretar — copy behöver iteration.

Om 3 av 5 citerar samma rad spontant på fråga 2 — vi har värdeformulering. Den raden går in i landing-hero, pitch, allt copy.

Saknad-svar (fråga 3) styr nästa iteration: ny skärm, ny sektion, eller copy-omformulering där tomheten finns.

## Vad som INTE mäts i denna iteration

- Klick-tracking, scroll-depth, heatmaps — ingen analytics-kod i PR
- Konvertering till mailto — irrelevant, demon är värdetest inte funnel
- Time-on-page — slowburn-positionering är inte time-optimerad
- A/B mellan formuleringar — för få testpersoner för statistisk signal
- Bounce-rate — single-page-app med fade mellan skärmar är inte mätbart på samma vis

Demon är kvalitativ signal-insamling. Klick-data hade gett kvantitativ noise som inte styr nästa beslut.

## Skärm-för-skärm

### Skärm 1: Tesen

- Rubrik: "Du, sett."
- Underrubrik: "Av en motor som aldrig vet mer än du har gett den."
- Tre brödtext-stycken — sista nämner Claude, ChatGPT, Cursor + öppet protokoll konkret
- Expanderbar "Vem den är för"-sektion
- CTA: "Visa mig vad det betyder" → skärm 2

### Skärm 2: Representationen

Strukturerad dokument-layout. Underrubrik följs direkt av frihetsstrofen:
> "Varje rad kan raderas. Hela kan exporteras. Selvra äger inget av detta."

Fyra data-sektioner:
- **Kropp**: sömn, baseline, HRV
- **Tid**: möten, tidigaste i morgon
- **Ord**: senast skrivna, återkommande
- **Mönster**: oxblod-vänster-kant. "Selvra drar inga slutsatser. Du gör det."

Ny **Tillgångs-sektion** efter sektionerna (manifesterar MCP-portabilitet):
> "Inga AI-system har just nu läsåtkomst till denna representation. I appen kan du ge tillgång per AI-system och per datatyp. Tillgång kan återkallas när som helst."

Två symmetriska knappar (lika viktiga):
- **Exportera (SREF v1)** → modal: "signerad JSON-fil … andra system som stöder Selvra-protokollet kan läsa den"
- **Radera allt** → modal: "raderas omedelbart. Inga kopior."

CTA: "Hur den byggs"

### Skärm 3: Hur den byggs

Tre numrerade punkter med Lucide-ikoner:
1. **link** — koppla in befintlig data
2. **layers** — struktureras med källa per rad, mönster räknas automatiskt
3. **arrow-right-from-line** — Claude/ChatGPT/Cursor kan läsa via öppet protokoll

Avslutande: "Det din kropp redan vet. Strukturerat så du kan se det. Portabelt så det följer dig."

CTA: mailto + sekundär länk tillbaka till `/`.

## Tekniska val

- URL-state via `?step=1|2|3` — back/forward fungerar
- Suspense-wrapper för `useSearchParams` (Next 16 App Router-krav)
- Subtil fade-in via `key`-prop, reduced-motion respekteras
- Mobile-first 375px, max-w-[58ch] per skärm
- Återanvänder befintlig typografi-stack (Source Serif 4 + Inter)
- Inga nya design-tokens
- Modal med focus-trap, Escape, aria-modal
- **Ingen progress-indicator** (spec uppdaterad iteration 2)
- `lucide-react` enda nya dep

## Konstitutionella checks

- ✅ Inga "AI"-claims om Selvra själv (nämner andra AI-system kontextuellt)
- ✅ Inga personality-claims (assistent, vän, coach)
- ✅ Säger "öppet protokoll" inte "MCP" eller "API"
- ✅ Säger "representation" inte "minne" eller "AI som minns dig"
- ✅ Inga kliniska termer (depression, ångest, diagnos)
- ✅ Inga FOMO, urgency, "join X users"
- ✅ Bekräftande språk; negationer endast efter bekräftande sats
- ✅ Käll-badge på varje data-rad i skärm 2
- ✅ Export- och Radera-knappar visuellt symmetriska
- ✅ Demo-data: "överväldigad", "tung", "sliten" — vanliga ord
- ✅ Repetitions-disciplin: "representation", "käll-attribuerad", "du äger den" sägs varje koncept en gång på sin starkaste plats

## Pass/fail-signaler från testläsare

**Pass:**
- "Självreflektions-app" / "strukturerad dagbok" → representation-vinkeln går igenom
- "Hälsa-app men annorlunda" → käll-attribuering + portabilitet skiljer från Aura/Bearable
- "Mitt-eget-data-i-AI" → moaten landar
- Citat tillbaka av "Selvra drar inga slutsatser. Du gör det." → mönster-stroffen fungerar

**Fail:**
- "AI-coach" → coaching-vägg behöver hårdare formulering på skärm 1
- "Dashboard" → strukturen är för dashboard-aktig, behöver mer dokument-känsla
- "Vad är det?" → demon förklarar inte vad den behöver förklara
- Ingen nämner portabiliteten → moaten är osynlig, skärm 1 punkt 3 behöver vikt

## Iterationsplan

Feedback dokumenteras i ny `.gsd/DEMO_FEEDBACK_*.md` när insamlad. Nästa iteration kan vara:
- Copy-justering där sammanlöpande feedback finns
- Annan demo-data om läsare ifrågasätter realism
- Ny sektion om tomhet rapporteras konsekvent
- INTE ny analytics, INTE A/B-tests, INTE conversion-optimization

## Relationer

- `project_selvra_path_b_decision_2026-05-16` — konstitutionellt rotat (slowburn, anti-engagement)
- `project_selvra_consumer_track_2026-05-15` — strategi-styrning
- `SELVRA_PRODUCT_V1_DEFINITION_2026-05-16` — produkt-källa
- `project_selvra_idea_ceiling_2026-05-16` — demon är reflektion, inte hockey-stick-prep
