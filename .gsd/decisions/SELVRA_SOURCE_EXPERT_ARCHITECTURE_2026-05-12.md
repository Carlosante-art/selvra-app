# Selvra Source Expert Architecture — Strategi C++

**Status:** Arkitektonisk pivot från nuvarande synthesis-pipeline (rådata-input) till expert-modul-orkestrering (destillerad input). Implementeras i tre faser parallellt med AB-väntan + wiring.

**Bakgrund:** Brev v0.3-läsning ikväll (vecka 19) avslöjade arkitektonisk lucka. Dexcom-data presenterades som punktmätningar (97.5%, 58.2%, 14.0, 12.6 mmol/L) istället för veckomönster (tid i intervall, variation, jämförelse mot tidigare). En T1-diabetiker läser inte sin vecka i punktmätningar — hen läser veckosnitt, tid i intervall, mönster över dygn. Synthesis-pipelinen sköt rådata in i LLM och bad LLM destillera + skriva prosa i samma anrop. Det är fel arkitektur.

**Insikt:** Selvra är inte AI-aggregator. Selvra är expertis-orkestrator. Per källa: kodifierad expertis (vad data mäter, hur det ska läsas, vad det aldrig ska säga). Per cross-source: kodifierade samspels-regler. LLM:n är författare i slutet av pipelinen, inte tänkare i mitten.

---

## Avsnitt 1: Arkitektonisk princip

### 1.1 Ny pipeline

```
Rådata-källa (Dexcom API / Garmin / Spotify / etc.)
    ↓
Source Expert Module (källspecifik bearbetning per vecka)
    ↓
Distilled Source Summary (strukturerad sammanfattning)
    ↓
Cross-Layer Orchestrator (identifierar samspels-mönster)
    ↓
Synthesis Pipeline (befintlig — författarskap i prosa)
    ↓
Brev
```

### 1.2 Gammal pipeline (ersätts)

```
Rådata-källa → Synthesis Pipeline (LLM gör allt) → Brev
```

### 1.3 Konstitutionell kontroll

Mot Selvras 10 canonical-fraser:

- **9:e (subtraktivt värde):** ✓ Expert-moduler destillerar rådata till meningsfulla mönster — adderar inte komplexitet, smalnar av till vad som har mening
- **10:e (pre-kategorisk):** ✓ Inte etablerad "AI-aggregator" eller "wellness-platform"-arkitektur. Egen filosofi — expertis i kod, författarskap i LLM
- **Lock-position 1 (aldrig coacha):** ✓ Per källa kodifieras specifika typer av övertramp (Dexcom får aldrig säga "du gjorde fel", Spotify får aldrig säga "du var ledsen")
- **Lock-position 6 (käll-attribuerat):** ✓ Per källa kodifieras exakt fraseologi för attribuering

---

## Avsnitt 2: Mall för Source Expert Module

Varje källa får en modul med fyra lager:

### Lager 1: Semantic Load — vad data faktiskt mäter

```yaml
source: <namn>
semantic_load:
  primary: "<vad källan mäter på domän-expert-nivå>"
  not: "<vanlig missuppfattning>"
  not: "<annan missuppfattning>"
```

### Lager 2: Distillation — hur rådata blir veckosammanfattning

```yaml
distillation:
  weekly_summary:
    - <strukturerade metrics som domänexperter använder>
  
  patterns:
    - <tidsmönster, frekvens-mönster, variation-mönster>
    
  noterbara_events:
    - <extremvärden eller signifikanta avvikelser>
  
  comparisons:
    - <jämförelse mot förra veckan, månadsnitt, etc.>
```

### Lager 3: Cross-Layer Hooks — hur källan interagerar med andra

```yaml
cross_layer_patterns:
  - mot_<annan_källa>: "<observation som blir möjlig genom kombinationen>"
  - mot_lager_1_intentioner: "<gap-observation-mönster>"
  - mot_lager_2_tankar: "<frekvens-mönster relaterat till tystnad/aktivitet>"
```

### Lager 4: Lock Positions — vad expert-modulen aldrig får producera

```yaml
never_produce:
  - "<specifik fras som bryter lock-position>"
  - "<annan specifik fras>"

attribution_phrasing:
  - "<exakt formulering för käll-attribuering>"
  - "<alternativ formulering>"
```

---

## Avsnitt 3: Fas-plan

### Fas 1: Fundament (3-5 dagar, FÖRE AB-aktivering)

**Mål:** Arkitektonisk mall + första referens-implementation + synthesis-pipeline-pivot.

**Leveranser:**

1. **Spec-dokument:** `~/selvra-app/.gsd/decisions/SELVRA_SOURCE_EXPERT_ARCHITECTURE_2026-05-12.md`
   - Fullständig specifikation av expert-modul-arkitektur
   - Mall-template (YAML-struktur per modul)
   - Synthesis-pipeline-integrations-spec

2. **Kod-arkitektur:** `selvra/source_experts/` ny mapp i protokollet
   - `base.py` — abstrakt SourceExpertModule-klass
   - `types.py` — strukturerade typer (DistilledSummary, CrossLayerHook, etc.)
   - `orchestrator.py` — Cross-Layer-Orchestrator som koordinerar moduler

3. **Dexcom-expert (referens-implementation):** `selvra/source_experts/dexcom.py`
   - **Refaktorera Path C från Stillra** som första expert-modul
   - Stillras Dexcom-beräkningar är **redan kodad expertis** — de generaliseras som mall
   - Implementera alla fyra lager (semantic load, distillation, cross-layer, lock positions)
   - Tester mot Carl-data

4. **Synthesis-pipeline-pivot:** `selvra/synthesis/letter_prompt.py` uppdateras
   - Tar input från expert-moduler (DistilledSummary), inte rådata
   - System-prompt anpassas: "Du får destillerade observationer från expert-moduler. Ditt jobb är prosa, inte tolkning."
   - Brev v0.4 genereras mot Carl-data och jämförs med v0.3.0

### Fas 2: 80%-skelett för dag-1-källor (parallellt med AB-väntan, 15-25 timmar)

**Mål:** Strukturella skelett för 2-3 prioriterade källor — distillation-logik + lock-positioner + cross-layer-regler implementerade, men inte fullständigt testade mot riktig data.

**Prioriterade källor (enligt Source Strategy V2 Fas 1):**

1. **Garmin** (`selvra/source_experts/garmin.py`)
   - Semantic load: "vad kroppen faktiskt gjorde, separat från vad användaren planerade"
   - Distillation: pass-frekvens, längd-snitt, puls-zoner, sömn-snitt
   - Cross-layer: mot Dexcom (glukos-rörelser kring pass), mot Lager 1 (intention vs loggning)
   - Lock-positioner: aldrig "du tränade" (säg "Garmin loggade"), aldrig "du missade träning"

2. **Spotify** (`selvra/source_experts/spotify.py`)
   - Semantic load: "stämnings-indikator över tid — vad användaren behöver i ögonblicket"
   - Distillation: dominerande spellistor, tids-mönster, genre-skiften, tystnad
   - Cross-layer: mot Dexcom (kvälls-lyssnande efter höga värden?), mot Calendar (tystnad korrelerar med tomma kalendrar?)
   - Lock-positioner: aldrig "du var ledsen", aldrig "du behövde X"

3. **Calendar** (`selvra/source_experts/calendar.py`)
   - Semantic load: "vad användaren planerade och vad som faktiskt fick uppmärksamhet"
   - Distillation: mötes-täthet per dag, tomma block, mönster över veckodagar, längd-fördelning
   - Cross-layer: mot Lager 1 (intention vs schemaläggning), mot Spotify (tystnad efter långa möten?)
   - Lock-positioner: aldrig "för många möten", aldrig "du borde blockera mer tid"

**Status efter Fas 2:** Mall fungerar för 4 källor (Dexcom + Garmin + Spotify + Calendar). Övriga dag-1-källor (Apple Health, Gmail, Strava) har inte expert-moduler ännu — de hanteras inkrementellt post-wiring.

### Fas 3: Empirisk polering (post-wiring, 2-5 timmar per källa)

**Mål:** När en källa wiringas in och data flödar — finishing av expert-modul mot empirisk substrate.

**Process per källa:**

1. Wiring sker (OAuth, datasynk, etc. — separat arbete)
2. Första vecka av data flödar in
3. Generera brev v0.4 mot källan (kombinerat med befintliga)
4. **Läs brevet kritiskt** — vad landar? vad är "lite löjligt"? vad är fel granularitet?
5. Iterera expert-modulen baserat på empirisk feedback
6. Generera om brev v0.4 — jämför sida vid sida
7. Lås expert-modul-version när brevet faktiskt landar

**Per ny källa post-Fas 2 (Apple Health, Gmail, Strava, senare Notion/Readwise/AI-export):**

- Inte 80%-skelett upfront — bygg från empirisk grund
- 10-20 timmar per källa baserat på riktig data
- Process: läs Carl-brev → vad behövs? → bygg expert-modul → testa → iterera

---

## Avsnitt 4: Tekniska detaljer

### 4.1 SourceExpertModule abstrakt klass

```python
from abc import ABC, abstractmethod
from typing import Optional
from dataclasses import dataclass
from datetime import date

@dataclass
class DistilledSummary:
    source: str
    week_start: date
    week_end: date
    semantic_load: str  # vad källan mäter på domännivå
    metrics: dict  # strukturerade weekly metrics
    patterns: list[str]  # tidsmönster, frekvensmönster
    noterbara_events: list[dict]  # extremvärden, avvikelser
    comparisons: dict  # mot förra veckan, månadsnitt
    attribution_phrases: list[str]  # exakta formuleringar för käll-attribuering
    
@dataclass
class CrossLayerHook:
    other_source: str
    pattern_description: str
    requires_both: bool  # observation kräver båda källor
    
@dataclass
class LockPosition:
    never_say: list[str]
    why_forbidden: str

class SourceExpertModule(ABC):
    """Bas-klass för alla källspecifika expert-moduler."""
    
    @property
    @abstractmethod
    def source_name(self) -> str:
        """Namn på källan (t.ex. 'dexcom', 'garmin')."""
        ...
    
    @property
    @abstractmethod
    def semantic_load(self) -> dict:
        """Vad källan mäter på domän-expert-nivå."""
        ...
    
    @abstractmethod
    def distill(self, raw_data, week_start: date, week_end: date) -> DistilledSummary:
        """Bearbeta rådata till strukturerad veckosammanfattning."""
        ...
    
    @abstractmethod
    def cross_layer_hooks(self) -> list[CrossLayerHook]:
        """Vilka cross-source-observationer denna modul möjliggör."""
        ...
    
    @abstractmethod
    def lock_positions(self) -> list[LockPosition]:
        """Vad expert-modulen aldrig får producera."""
        ...
    
    @abstractmethod
    def validate_output(self, prose_from_synthesis: str) -> list[str]:
        """Kontrollera att synthesis-output respekterar denna modulens lock-positioner.
        Returnerar lista av regelbrott (tom om allt OK)."""
        ...
```

### 4.2 Cross-Layer Orchestrator

```python
class CrossLayerOrchestrator:
    """Koordinerar expert-moduler för en användare för en vecka.
    Identifierar cross-source-observationer som möjliggörs av aktiva källor."""
    
    def __init__(self, active_modules: list[SourceExpertModule]):
        self.modules = active_modules
    
    def collect_summaries(self, user_id: str, week_start: date) -> list[DistilledSummary]:
        """Hämta destillerade summaries från alla aktiva moduler."""
        ...
    
    def identify_cross_layer_patterns(
        self, summaries: list[DistilledSummary]
    ) -> list[CrossLayerObservation]:
        """Identifiera samspels-mönster mellan källor som har båda data."""
        ...
    
    def prepare_synthesis_input(
        self, summaries: list[DistilledSummary], 
        cross_layer: list[CrossLayerObservation]
    ) -> SynthesisInput:
        """Förbered strukturerad input till synthesis-pipelinen."""
        ...
```

### 4.3 Synthesis-pipeline-pivot

`selvra/synthesis/letter_prompt.py` system-prompt uppdateras:

```
Du genererar Selvras veckobrev. Du får INTE rådata.

Du får destillerade observationer från Source Expert Modules (en per aktiv källa)
och cross-layer-observationer från orkestratorn.

Din uppgift är AUTHORSHIP — väva dessa observationer till prosa enligt
Selvras brev-spec v0.3.

Du gör INTE tolkning av rådata. Den tolkningen har redan gjorts av expert-moduler
som kodifierar domain-expertis (klinisk för Dexcom, fysiologisk för Garmin,
musikalisk för Spotify, etc.).

Din källattribuering måste exakt matcha de attribution_phrases som varje
expert-modul tillhandahåller. Du får INTE uppfinna egna formuleringar.

Lock-positioner per källa enforce:as av expert-moduler. Om din output bryter
mot någon, valideringen kommer fånga det och kräva regenerering.

INPUT: strukturerad SynthesisInput med distilled summaries + cross_layer observations
OUTPUT: brev enligt SELVRA_PROMPT_DESIGN_PRINCIPLES v0.3
```

### 4.4 Dexcom-expert som referens-implementation

```python
class DexcomExpert(SourceExpertModule):
    source_name = "dexcom"
    
    semantic_load = {
        "primary": "kroppens svar på multipla faktorer över tid",
        "not": "blodsocker" ,  # för enkel framing
        "not_2": "diabeteskontroll",  # värdeladdat
    }
    
    def distill(self, raw_data, week_start, week_end) -> DistilledSummary:
        # Återanvänd Path C-beräkningar från Stillra
        from stillra.path_c import calculate_metrics
        
        metrics = calculate_metrics(raw_data, week_start, week_end)
        
        return DistilledSummary(
            source="dexcom",
            week_start=week_start,
            week_end=week_end,
            semantic_load=self.semantic_load["primary"],
            metrics={
                "tid_i_intervall_3_9_10_0": metrics.time_in_range,
                "tid_over_10": metrics.time_above,
                "tid_under_3_9": metrics.time_below,
                "snitt_mmol_l": metrics.mean,
                "variation_stdev": metrics.stdev,
            },
            patterns=[
                f"Höga värden tenderade {metrics.dominant_high_pattern}" if metrics.has_pattern else "",
                f"Variation {metrics.variability_description}",
            ],
            noterbara_events=[
                {"type": "hypo", "value": event.value, "time": event.timestamp}
                for event in metrics.hypo_events
            ] + [
                {"type": "hyper", "value": event.value, "time": event.timestamp}
                for event in metrics.hyper_events
            ],
            comparisons={
                "vs_forra_veckan": {
                    "tid_i_intervall_delta": metrics.tir_delta,
                    "snitt_delta": metrics.mean_delta,
                }
            },
            attribution_phrases=[
                "Dexcom visade",
                "Tid i intervall var",
                "Värdena rörde sig från X till Y",
                "Lägsta punkten",
                "Högsta punkten",
            ],
        )
    
    def cross_layer_hooks(self) -> list[CrossLayerHook]:
        return [
            CrossLayerHook(
                other_source="garmin",
                pattern_description="Glukos-rörelser kring träningspass",
                requires_both=True,
            ),
            CrossLayerHook(
                other_source="calendar",
                pattern_description="Kontroll-mönster på stressiga möte-dagar",
                requires_both=True,
            ),
            CrossLayerHook(
                other_source="lager_2_tankar",
                pattern_description="Frekvens av tankar relaterade till diabetes",
                requires_both=False,  # tystnad är också observation
            ),
        ]
    
    def lock_positions(self) -> list[LockPosition]:
        return [
            LockPosition(
                never_say=["Du gjorde fel", "Du borde ha", "Det här är farligt"],
                why_forbidden="Selvra är inte läkare. Värdeladdade omdömen om kontroll bryter mot lock-position 1 (aldrig döma).",
            ),
            LockPosition(
                never_say=["Du borde äta mindre", "Du borde äta mer", "Justera insulinet"],
                why_forbidden="Kostråd är medicinskt. Insulinråd är medicinskt. Selvra observerar, lämnar tolkning till läsaren och deras vårdteam.",
            ),
            LockPosition(
                never_say=["Bra vecka", "Dålig vecka", "Bättre/sämre kontroll"],
                why_forbidden="Värdeomdömen om vecka är dom. Selvra namnger mönster, läsaren tolkar.",
            ),
            LockPosition(
                never_say=["Normalt blodsocker är", "Som en frisk person"],
                why_forbidden="Jämförelse med 'normala' är paternalism. T1-diabetiker har sin egen baseline.",
            ),
        ]
    
    def validate_output(self, prose: str) -> list[str]:
        violations = []
        for lock in self.lock_positions():
            for phrase in lock.never_say:
                if phrase.lower() in prose.lower():
                    violations.append(f"Bryter mot: '{phrase}' — {lock.why_forbidden}")
        return violations
```

### 4.5 Garmin-, Spotify-, Calendar-skelett

För Fas 2 implementeras motsvarande struktur för Garmin, Spotify, Calendar. Skelett betyder:

- Klass-struktur klar
- `semantic_load`, `cross_layer_hooks`, `lock_positions` fullständigt definierade
- `distill()` har **hypotetisk implementation** baserad på dokumenterade API-strukturer (Garmin Connect API, Spotify API, Google Calendar API)
- Tester **inte körda mot riktig data** ännu — placeholder-tester med syntetisk data
- Empirisk polering sker i Fas 3 när källan faktiskt wiras in

---

## Avsnitt 5: Validerings-protokoll

### 5.1 Per expert-modul

Innan en modul markeras "klar":

- [ ] `semantic_load` artikulerad och kontrollerad mot domän-expertis (forskning eller praktiker)
- [ ] `distill()` implementerad och testad mot minst 4 veckor av riktig data
- [ ] `cross_layer_hooks` kompletta för alla källor som realistiskt kan vara aktiva samtidigt
- [ ] `lock_positions` fullständiga — minst 4 specifika fraser per källa
- [ ] `validate_output()` fungerar mot syntetiska "bad output"-exempel
- [ ] Cross-verifiering mot Selvras 10 canonical-fraser

### 5.2 Per cross-layer-observation

När en observation möjliggörs av kombination av källor:

- [ ] Observationen är kausal-neutral ("samma vecka som X, även Y" — inte "eftersom X, därför Y")
- [ ] Båda källor är käll-attribuerade i prosan
- [ ] Observationen tillför mening utöver vad enskild källa ger
- [ ] Inte privacy-känslig korrelation (regel 4.5 från brev-spec)

### 5.3 Per brev v0.4 mot expert-modul-arkitektur

Innan brev v0.4 markeras "fungerar":

- [ ] Inga förbjudna språkformer (regel 1.1 från brev-spec)
- [ ] Käll-attribuering exakt enligt expert-modulers `attribution_phrases`
- [ ] Tids-skala-vävning (small/medium/big story) levererad
- [ ] Datapunkt-täthet inom spec (5-7 specifika observationer, inte 15)
- [ ] Subtraktiv mekanism levererad — brevet smalnar av möjliga sanningar, adderar inte
- [ ] Carl-läsning: "det landar" på samma nivå som brev v0.3.0 mot Dexcom-data

---

## Avsnitt 6: Risk-analys

### 6.1 Risker med Strategi C++

**Risk 1: Skelett-moduler i Fas 2 är fel-arkitekturerade när riktig data flödar in.**

Sannolikhet: medel. Mitigation: skelett byggs mot **dokumenterade API-strukturer**, inte ren spekulation. När källan wiras in är finishing 2-5 timmar, inte omfattande omarbetning.

**Risk 2: Synthesis-pipeline-pivoten bryter brev v0.3 mot Dexcom + Lager 1/2.**

Sannolikhet: låg. Mitigation: brev v0.3.0 fungerar idag med rådata-input. Den koden bevaras som fallback under Fas 1. Brev v0.4 körs parallellt mot Carl-data tills v0.4 bevisat sig.

**Risk 3: 4-7 dagars investering distraherar från andra Imperativ.**

Sannolikhet: medel. Mitigation: arbete sker **parallellt med AB-väntan**. Mejlet till Kari är inte blockerat av detta. Imperativ 2 (distribution-arbete via selvra.ai/journal) kan fortsätta sektionvis.

**Risk 4: Domain-expertis-gissningar för Garmin/Spotify/Calendar är fel.**

Sannolikhet: medel-hög. Mitigation: skelett-moduler är medvetet 80% klara, inte 100%. Empirisk polering i Fas 3 fångar gissnings-fel.

**Risk 5: Cross-Layer Orchestrator över-konstruerar samspels-mönster.**

Sannolikhet: medel. Mitigation: orchestrator markerar cross-layer-observationer som **valbara**, inte krävda. Synthesis-LLM kan välja vilka som väver in baserat på vad som faktiskt tillför mening.

### 6.2 Risker med alternativen

**Strategi A (perfectionist):** 50-80 timmars upfront-investering utan empirisk validering. 30-50% av modulerna gissar fel saker. Stor refaktorering post-wiring.

**Strategi B (pragmatist):** Brev v0.4 mot rådata fortsätter "lite löjligt"-problemet. Skadar Imperativ 1 (icke-Carl-validering) — testanvändare läser sub-optimal Selvra.

**Strategi C (minimal):** Endast fundament + Dexcom-expert. Garmin/Spotify/Calendar måste byggas från scratch post-wiring — 10-20 timmar per källa. Längre total tid till brev v0.4 mot full data.

---

## Avsnitt 7: Validering mot Selvras canonical-fraser

Detta arkitektur-skift kontrolleras mot alla 10 canonical-fraser:

| Fras | Kontroll |
|------|----------|
| 1. Spegel, inte coach | ✓ Lock-positions enforce:as per källa |
| 2. Aldrig predicera | ✓ Distillation rapporterar mönster, inte prognoser |
| 3. Aldrig döma | ✓ Värdeomdömen ("bra vecka") explicit förbjudna |
| 4. Käll-attribuerad | ✓ Attribution_phrases obligatorisk per källa |
| 5. EU-sovereign | ✓ Expert-moduler kör på samma infrastruktur, inga externa anrop |
| 6. Constitutional reasoning | ✓ Lock-positions enforce:as i kod, inte hoppas på i prompt |
| 7. Du äger representationen | ✓ Distilled summaries är portabla via SREF |
| 8. En reflektion aktiv åt gången | ✓ Brev-format oförändrat — endast pipelinen pivoteras |
| 9. Subtraktivt värde | ✓ Destillering smalnar av rådata till meningsfulla mönster |
| 10. Pre-kategorisk | ✓ Arkitekturen är egen filosofi, inte "AI-aggregator"-mall |

---

## Avsnitt 8: Implementation-ordning

### Dag 1-2 (Fas 1 — fundament)

1. Skapa `~/selvra-app/.gsd/decisions/SELVRA_SOURCE_EXPERT_ARCHITECTURE_2026-05-12.md` med komplett spec
2. Skapa `selvra/source_experts/` mapp med `base.py`, `types.py`, `orchestrator.py`
3. Implementera `SourceExpertModule` abstrakt klass + strukturerade typer

### Dag 2-3 (Fas 1 — Dexcom-referens)

4. Refaktorera Path C från Stillra som `selvra/source_experts/dexcom.py`
5. Implementera alla fyra lager för Dexcom-expert
6. Skriv tester mot Carl-data (minst 4 veckor)
7. Verifiera att Dexcom-expert producerar samma kvalitet av destillering som Stillras nuvarande Path C

### Dag 3-4 (Fas 1 — synthesis-pivot)

8. Uppdatera `selvra/synthesis/letter_prompt.py` att ta input från expert-moduler
9. Bevara brev v0.3.0-pipeline som fallback
10. Generera brev v0.4 mot Carl-data (Dexcom-expert + Lager 1/2)
11. Jämför brev v0.4 sida vid sida med v0.3.0 — verifiera att kvaliteten är bättre, inte sämre
12. Lock brev v0.4-version om läsning bekräftar

### Dag 4-6 (Fas 2 — skelett för dag-1-källor)

13. Implementera 80%-skelett för Garmin
14. Implementera 80%-skelett för Spotify
15. Implementera 80%-skelett för Calendar
16. Skriv hypotetiska tester (syntetisk data, inte riktig)
17. Dokumentera vilka antaganden om API-strukturer som gjorts (för Fas 3-verifiering)

### Post-AB-aktivering + wiring (Fas 3 — empirisk polering)

18. Per källa när den wiras in: 2-5 timmar finishing
19. Generera brev v0.4 mot källan kombinerat med befintliga
20. Iterera expert-modul baserat på empirisk feedback
21. Lock expert-modul-version när brevet landar

---

## Avsnitt 9: Vad detta spec inte är

- **Inte komplett designsystem.** Detta är arkitektur-spec. Specifika algoritmer för cross-layer-pattern-detektion utvecklas inkrementellt.
- **Inte engångs-leverans.** Spec:et itereras mot empiri. Edge cases (akut sjukdom, traumatiska veckor, datakällor som lägger ner) hanteras post-empiriskt.
- **Inte krav att alla 22 källor från Source Strategy V2 byggs.** Endast aktiva källor får expert-moduler. Inaktiverade källor som Whoop, Polar, Oura får moduler först om/när användare wirar in dem.
- **Inte ersättning för brev v0.3-spec.** Det spec:et styr fortfarande prosan. Detta spec:et styr **pipelinen som föder spec:et**.

---

## Avsnitt 10: Status och slutkontroll

**Konstitutionellt godkänt:** Ja, mot alla 10 canonical-fraser (Avsnitt 7).

**Implementation-trigger:** Nu, parallellt med AB-väntan. Fas 1 (3-4 dagar) levereras innan AB-aktivering möjligen sker. Fas 2 (15-25 timmar) levereras parallellt med wiring-arbete. Fas 3 sker per källa post-wiring.

**Bandwidth-kontroll:** 4-7 dagar arbete före AB. Mejlet till Kari blockeras INTE av detta — det är parallell prioritet. Imperativ 2 (selvra.ai/journal editorial newsletter) kan ske sektionvis när bandwidth tillåter.

**Bevarad funktionalitet:** Brev v0.3.0-pipeline bevaras som fallback under Fas 1. Brev v0.4 körs parallellt tills det bevisat sig mot Carl-läsning.

**Risk-mitigation:** Per Avsnitt 6. Skelett-arkitektur i Fas 2 möjliggör snabb empirisk polering i Fas 3 utan att gissa allt upfront.

---

## Det praktiska — vad Claude Code gör

1. **Skapa** `~/selvra-app/.gsd/decisions/SELVRA_SOURCE_EXPERT_ARCHITECTURE_2026-05-12.md` med detta dokuments fullständiga innehåll
2. **Implementera** Fas 1 enligt Avsnitt 8 dag 1-4
3. **Pausa** efter Fas 1 — visa brev v0.4 mot Carl-data sida vid sida med v0.3.0 för validering
4. **Vänta** på Carl-bekräftelse att brev v0.4 levererar bättre (eller vi itererar arkitekturen)
5. **Fortsätt** med Fas 2 endast efter Carl-godkännande
6. **Fas 3** triggas per källa post-wiring, inte automatiskt

**Inga avvikelser från detta spec utan att uppdatera spec-dokumentet först.** Detta är arkitektonisk pivot som måste hålla över månader, inte impulsivt implementeras.

**Lägg också som memory:**

> *"Selvra är inte AI-aggregator. Selvra är expertis-orkestrator. Per källa: kodifierad expertis. Per cross-source: kodifierade samspels-regler. LLM:n är författare i slutet av pipelinen, inte tänkare i mitten. Detta är arkitektonisk självförståelse som styr alla framtida pipeline-beslut. Brev-kvalitet kommer från expertis-modul-destillering, inte från LLM-tolkning av rådata."*

**Status:** Konstitutionellt godkänt. Implementation kan börja Fas 1 omedelbart.
