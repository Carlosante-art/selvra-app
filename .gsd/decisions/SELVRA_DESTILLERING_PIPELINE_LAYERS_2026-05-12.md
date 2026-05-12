# Selvras destilleringspipeline — fem lager

**Status:** Arkitektonisk princip låst 2026-05-12 post-Fas-2.
**Bakgrund:** Strategi C++ (Source Expert Architecture) byggde Lager 1
(per källa) + 2 (cross-source). Den här principen artikulerar den
fullständiga lager-hierarkin så framtida sessions inte hoppar till
Lager 3 utan empirisk substrate i drift.

---

## Lager-hierarki

```
Lager 0:  Rådata-källor (Dexcom, Garmin, Spotify, Calendar, Gmail, ...)
              ↓
Lager 1:  Source Expert Modules
          (per källa, per vecka — fyra-lager-protokollet:
           semantic_load, distillation, cross_layer_hooks, lock_positions)
              ↓
Lager 2:  Cross-Source Orchestration
          (CrossLayerOrchestrator: data-bunden detect() per modul
           + template-kandidater från cross_layer_hooks)
              ↓
Lager 3:  Cross-Week Trend Destillering
          (månads-mönster: trender, säsongs-drift, återkommande mönster)
              ↓
Lager 4:  Big-Story Extrahering
          (kumulativa mönster över ramar: livs-skala-narrativ,
           identitets-mönster över månader/år)
              ↓
Synthesis: Brev-prosa (LLM som författare)
```

---

## Status per lager (2026-05-12)

| Lager | Status | Implementation |
|---|---|---|
| 0 | Aktiv för Dexcom; väntar adapter för Garmin/Spotify/Calendar/Gmail | Stillra Path C (Dexcom). Övriga gated på AB. |
| 1 | **Byggt och validerat** för Dexcom (full). Skelett för Garmin/Spotify/Calendar. | `selvra/source_experts/{dexcom,garmin,spotify,calendar}.py` |
| 2 | **Byggt och validerat** mot Dexcom × Lager 2-tankar (data-bunden detection). Skelett-stubs för Garmin/Spotify/Calendar (returnerar [] tills adapter wirad). | `selvra/source_experts/orchestrator.py` + `detect_cross_layer_observations()` per modul |
| 3 | **Inte byggt.** Gated på empirisk substrate. | Krav: 4+ veckors data över 6+ aktiva källor (≥3 wirade externa + Lager 1/2 + längre tids-serie) |
| 4 | **Inte byggt.** Gated på Lager 3 i empirisk drift. | Krav: Lager 3 har levererat månads-mönster i 3+ konsekutiva månader |

---

## Disciplin — gating-villkor

**Lager 3 får INTE byggas innan:**

1. Minst tre externa källor är wirade och har levererat data i 4+ veckor
2. Lager 1 + 2 har levererat brev som landar empiriskt (Imperativ 1
   validerad, ≥4/5 resonans, ≥50% retention vecka 6)
3. Faktiska återkommande mönster syns över tids-serie — inte gissade

**Lager 4 får INTE byggas innan:**

1. Lager 3 levererar månads-mönster i 3+ konsekutiva månader
2. Användaren har validerat månads-brev som "landar" (separat från
   vecko-brev-validering)
3. Big-story-mönster syns över ramar — inte projicerade från enskild
   månad

---

## Princip — samma disciplin som Strategi C++

Strategi C++ valdes över Strategi A (perfectionist, 50-80h upfront)
för att den **kräver empirisk substrate innan arkitektonisk gissning**.
Tillämpas iterativt över lagren:

- **Lager 1 + 2:** byggde mot Dexcom (känt schema, kodad domain-expertis
  i Stillras Path C). Garmin/Spotify/Calendar fick 80%-skelett mot
  dokumenterade API-strukturer; empirisk polering i Fas 3.

- **Lager 3:** kommer inte byggas mot gissade månads-mönster. Vi väntar
  tills 4+ veckors data syns över ≥3 källor; **läser vad som faktiskt
  återkommer**; kodifierar destillering baserat på empiri.

- **Lager 4:** kommer inte byggas mot gissade big-story-arketyper. Vi
  väntar tills Lager 3 har levererat månads-mönster i månader; **läser
  vad som faktiskt formar identitets-skala-narrativ**; kodifierar
  kumulativ-destillering baserat på empiri.

**Anti-pattern att undvika:** "Vi borde redan nu bygga Lager 3 för att
få månads-trender när första månadens data flödar in." Nej. Bygg det
*efter* första månadens data finns, mot vad som faktiskt syns, inte
mot vad vi tror kommer synas.

---

## Konsekvenser för Fas 3 + framtida arbete

- **Fas 3 (Strategi C++):** empirisk polering av Lager 1-moduler per
  källa post-wiring. **Detta är inte Lager 3 — det är Lager 1-iteration.**
  Namn-kollisionen är olycklig men semantiken är distinkt.

- **Post-Imperativ-1-validering:** när 5-10 beta-users har 4+ veckors
  data och Lager 1+2 är validerat extern → första kandidat för
  Lager 3-arbete. Inte tidigare.

- **Lager 4 är post-launch:** kommer inte aktualiseras under v1.
  Big-story-extraktion kräver minst 6+ månaders data per användare
  och flera segment validerade.

---

## Mot Selvras 10 canonical-fraser

| Fras | Kontroll |
|---|---|
| 9. Subtraktivt värde | ✓ Lager 3+4 förbjuder gissningar — adderar inte spekulativa månads-/big-story-mönster |
| 10. Pre-kategorisk | ✓ Vi kodifierar inte mönster vi inte ännu sett |
| Strategi C++ ethos | ✓ Empirisk substrate före arkitektonisk gissning på *varje* lager-nivå |

---

## Implementations-trigger

**Detta dokument blockerar INTE Fas 2.** Fas 2 (Garmin/Spotify/Calendar
80%-skelett) är klar (commit `58b17c3`).

**Trigger för Lager 3-arbete:** 4+ veckors data över ≥3 wirade källor
+ Imperativ 1 validerad. Tidigast Q3 2026 om AB + wiring + dogfood-
validering går enligt plan.

**Trigger för Lager 4-arbete:** Lager 3 levererar månads-mönster i
3+ konsekutiva månader. Tidigast 2027.
