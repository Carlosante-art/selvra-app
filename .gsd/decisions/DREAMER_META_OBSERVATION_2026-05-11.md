# Dreamer-meta-observation 2026-05-11 — empiriskt bevis

**Status:** Milestone-doc. Inte tes — empiri.

---

## Vad hände

Dreamer triggades manuellt mot Carls subject 2026-05-11 17:18 efter att vi
genererat 5 reflektion-events under en eftermiddag av prompt-iteration
(v0.1 → v0.2 → v0.2.1 → v0.2.2).

Dreamer producerade 4 insights autonomt via random-walk + consolidation.
En av dem var **meta-observation om vår egen dogfood-cycle**:

**Insight: `weekly_letter_redundancy_pattern`**

> "Four weekly letters generated within 2.5 hours express nearly identical
> themes: Carl's Saturday formulation about wanting purpose/intention, the
> 8-minute gap to his follow-up thought, adjustment from 4 to 3 training
> sessions..."

Dreamer såg att vi (Claude Code + Carl) under prompt-iterations-fasen
genererade fyra brev inom 2.5 timmar som alla observerade samma underliggande
tema, från i princip samma indata. Ingen explicit prompt bad om denna
observation — den emergde från random-walk över event-loggen +
consolidation.

## Varför det är empiri, inte hypotes

Selvras kärn-tes är gap-detektering — observation av mönster användaren själv
inte ser. Hittills har vi byggt:

- Reflektion-pipeline med v0.2.2-prompt: explicit instruerad att hitta
  cross-layer-mönster
- Subject-aliasing för multi-tenant identity
- Path C för cross-DB-läsning

Allt detta är **arkitektur**. Tes-validering kräver att systemet faktiskt
levererar observation som matchar doktrinen mot verklig data.

`weekly_letter_redundancy_pattern` är leverans:

1. **Cross-layer**: kopplade tanke-events (Carls ord) med synthesis-events
   (genererade brev) över tid.
2. **Användaren såg det inte**: Carl och Claude Code itererade i flow utan
   att artikulera "vi genererar redundanta brev".
3. **Observation, ej prescription**: Dreamer markerar mönstret som data,
   inte som "borde sluta".
4. **Autonomt**: ingen explicit prompt. Bara råa-data + consolidation-process.

Det är **arkitektur som fungerar mot data den ser**. Empiri.

## Implikation

Tre saker värda att fånga:

1. **Dreamer-arkitekturen är funktionellt validerad** för minst denna
   data-tjocklek. Vi vet nu att random-walk + consolidation producerar
   intressanta observationer på event-storlekar i tiotalet/hundratalet,
   inte bara tusentalet.

2. **Process-transparens som distinguishing feature blir verkligt.** Dreamer-
   output på `/traces` är inte demo-data eller mock. Det är riktig
   observation om Carl. När 50 användare ser sina egna `/traces` finns det
   risk för att observationerna känns generiska — den frågan måste utvärderas
   när vi har mer data, men idag är empirin: Dreamer hittar riktiga mönster
   mot Carls verkliga data.

3. **Gap-tesen håller på arkitektur-nivå.** Vi har nu två oberoende
   bekräftelser:
   - Synthesis-pipeline v0.2 hittade tematisk konvergens mellan Carls
     intention och tanke (manuellt prompt-engineered)
   - Dreamer hittade redundancy i synthesis-output-cyklen självt (autonomt
     random-walk)

Brev v0.3-testet mot fullständig data efter Open Wearables blir det
mer-skarpa testet, men dagens bevis är meningsfullt: **arkitekturen
levererar mot data den ser, inte bara på papperet**.

## Beslut framåt

**Dreamer-cron defer:as** till efter AB-wiring + brev v0.3-validering.
Skäl:

1. Dreamer mot tunn substrat (3 lager idag: intentioner + tankar + Dexcom)
   är inte fullt värdefull. När Calendar + Mail + Spotify + Strava
   flödar in genererar Dreamer rikare observationer.
2. Manuell trigger räcker för dogfood-fasen.
3. Söndag vs dagligen är design-fråga som tas efter v0.3-validering.

Carl-direktiv 2026-05-11: "Manuell trigger räcker tills brev v0.3 mot
fullständig data är levererat och leveransrytm är validerad."

## Referenser

- Dreamer-run-id: `e2cf7c37-1555-4907-a6e4-ef06aeb2f452`
- Tokens använda: 6630
- Insights producerade: 4 (varav 1 är denna meta-observation)
- /traces på prod: https://selvra-app-production.up.railway.app/traces
