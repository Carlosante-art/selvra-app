# Demo-onboarding: tre lager manifesterade

**Datum:** 2026-05-16
**Status:** Aktiv (reflektions-instrument, ej launch)
**Route:** `/demo?step=1|2|3`

## Vad demon är

Tre-skärmars webb-demo som manifesterar Selvras arkitektur som tre lager:

1. **Verktyget** — appen där data samlas, struktureras, käll-attribueras.
2. **Dagens kvitto** — mönsterigenkänning över källor och tid (visas som "Mönster"-sektion inom representationen).
3. **Morgondagens moat** — den strukturerade representationen är portabel (SREF v1) och följer användaren in i framtida LLM-ytor.

Konstitutionellt avgörande val: användaren ska se **REPRESENTATIONEN som strukturen** och MÖNSTRET som innehåll i strukturen. Sidan heter "Din representation. Just nu." — inte "Insikter" eller "Mönster". Det är vad ingen annan app i kategorin gör.

## Vad demon INTE är

- Inte launch. iOS-app är fortfarande primär leverans H2 2026.
- Inte signup-flow. Mailto-CTA matchar landing-sidans exakt.
- Inte auth. Demo är statisk syntetisk data.
- Inte backend-koppling. Inga API-anrop, inga server-side queries.
- Inte chat. Selvra är representation, inte konversation.
- Inte dashboard. Strukturen är ett dokument, inte en yta för interaktion.

## Varför den finns

Carl skickar `/demo`-länken till 3-5 personer (vänner, peer-founders, två potentiella users i nischen) och frågar:

> "Vad tror du Selvra gör?"

Utan att förklara först. Demon måste klara den frågan på egen hand. Värdetest för positioneringen, inte konvertering.

Reflektions-instrumentet är konstitutionellt linjerat med Väg B-pakten (`project_selvra_path_b_decision_2026-05-16`): slowburn, anti-engagement, kvalitet-för-nisch. Detta är insamling av kvalitativ signal, inte funnel-optimization.

## Vad sidan har (skärm-för-skärm)

### Skärm 1: Tesen

- Rubrik: "Du, sett."
- Underrubrik: "Av en motor som aldrig vet mer än du har gett den."
- Tre brödtext-stycken om vad Selvra gör (samlar källor → strukturerar → portabilitet)
- Expanderbar "För vem den är"-sektion med nischpositionering
- CTA: "Visa mig vad det betyder" → skärm 2

### Skärm 2: Representationen

Hjärtat. Visar BÅDE struktur OCH innehåll i en dokument-layout (inte dashboard, inte chat).

- **Kropp**: 3 data-rader (sömn, baseline, HRV) med källa-badges
- **Tid**: 2 rader (möten efter 17, tidigaste i morgon)
- **Ord**: 2 rader (senast skrivna, återkommande)
- **Mönster**: visuellt distinkt med oxblod-vänster-kant. "Selvra drar inga slutsatser. Du gör det."

Användarprinciper som footer-strof:
- "Käll-badge är klickbar — i appen öppnar den källans data."
- "Varje rad kan raderas. Hela representationen kan exporteras."
- "Selvra äger inget av detta."

Två symmetriska knappar (lika viktiga visuellt):
- **Exportera (SREF v1)** → modal: "I appen laddas en JSON-fil…"
- **Radera allt** → modal: "I appen raderas hela representationen…"

CTA: "Hur den byggs" → skärm 3

### Skärm 3: Hur den byggs

Tre numrerade punkter med Lucide-ikoner (link, layers, arrow-right-from-line):
1. Koppla in det du redan använder
2. Selvra strukturerar — käll-attribuerat
3. SREF v1-export från dag ett

Avslutande rad: "Det din kropp redan vet. Strukturerat så du kan se det. Portabelt så det följer dig."

CTA: mailto (samma som landing) + sekundär länk tillbaka till `/`.

## Tekniska val

- **URL-state via `?step=1|2|3`** — back/forward i webbläsaren fungerar
- **Suspense-wrapper för `useSearchParams`** — Next.js 16 App Router-krav
- **Subtil fade-in via `key`-prop** — reduced-motion respekteras via `globals.css`
- **Mobile-first 375px** — testad iPhone SE / 14 / desktop 1280
- **Återanvänder befintlig typografi-stack**: Source Serif 4 brödtext, Inter UI/meta
- **Inga nya design-tokens** — använder oxblod, paper, ink/soft/tertiary, hairline
- **Modal med focus-trap + Escape** — accessibility-spec uppfylld
- **`lucide-react` enda nya dep** — auktoriserad av spec, befintliga dependencies orörda

## Konstitutionella checks

- ✅ Ingen FOMO, ingen urgency, ingen "join X users"
- ✅ Inga personality-claims ("din assistent", "förstår dig")
- ✅ Inget "AI" som ord på sidan — säger vad den gör, inte vad den är (undantag: "andra AI-system" som contextualiserar moaten)
- ✅ Bekräftande språk genom hela flödet (negationer endast som klargöranden)
- ✅ Källa-badge på varje data-rad i skärm 2
- ✅ Export- och Radera-knappar symmetriska, inte primary/secondary
- ✅ Demo-data: "överväldigad", "tung", "sliten" — inga kliniska termer

## Vad som händer efter demon

Carl skickar `/demo` till 3-5 personer. Frågan: "vad tror du Selvra gör?"

Möjliga signaler:
- **"En självreflektions-app"** → räcker; representation-vinkeln går igenom
- **"En hälsa-app"** → räcker; käll-attribuering + portabilitet skiljer från Aura/Bearable
- **"Som en dagbok men strukturerad"** → räcker; "representation" har landat
- **"En AI-coach"** → fail; behöver hårdare anti-coaching-formulering på skärm 1
- **"En dashboard"** → fail; strukturen är för dashboard-aktig, behöver mer dokument-känsla
- **"Vad är det?"** → fail; demon förklarar inte vad den behöver förklara

Resultat dokumenteras i ny `.gsd/DEMO_FEEDBACK_*.md` när Carl samlat in.

## Relationer

- `project_selvra_path_b_decision_2026-05-16` — konstitutionellt rotat
- `project_selvra_consumer_track_2026-05-15` — strategi-styrning
- `SELVRA_PRODUCT_V1_DEFINITION_2026-05-16` — produkt-källa
- `project_selvra_idea_ceiling_2026-05-16` — varför demon är reflektion, inte hockey-stick-prep
