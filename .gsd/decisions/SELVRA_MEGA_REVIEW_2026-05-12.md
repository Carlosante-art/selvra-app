# Selvra Mega-Review — 2026-05-12

**Status:** Strategisk granskning av Selvra-idén mot världens tester. Genomförd
i HOLD SCOPE-mod via Garry Tans Mega-Plan-Review-skill. Skeptisk recensent-
posture, inte cheerleader.

**Användning:** Referens-dokument. Revisitas var 4-6 vecka för att tracka
vilka kritiska gap som är adresserade och vilka som kvarstår. Carls
kalibreringar + tre locked-imperativ är inkluderade i tillägg-sektionen.

---

## TL;DR — verdict före alla sektioner

**Selvra-idén håller — men inte automatiskt.** Två-tre arkitektoniska beslut
är på riktigt försvarbara mot världen. Två-tre är hypoteser som världen
inte ännu testat. Och en handfull dödsrisker är inte aktivt mitigerade.

Den ärliga sammanfattningen i en mening: **Selvra är ett *vackert system*
som inte än har bevisat att *någon utöver Carl bryr sig*.** Det är inte
fail-läge — det är pre-validerings-läge. Men det är där tyngsta arbetet
ligger.

---

## Pre-review system audit

**Vad finns artikulerat:**
- 10 lock-positioner för reflektions-format
- 8 canonical positionerings-fraser
- 3 principer för Context Engine
- Source Strategy V2 (3-fas-prioritering, 5 livsdomäner, 22 källor)
- Editorial design-doktrin (Kinfolk-tradition lockad, mood-board kvar)
- Mobil-arkitektur (B + senare, gated på v0.3-validering)
- 8-stegs AB-checklist
- Soft-delete G1-G9 + agency-position via SREF

**Vad finns byggt och bevisat tekniskt:**
- Selvra-protokoll v0.2.4 live
- Brev v0.2 har cross-layer-observation som FAKTISKT fångar mönster Carl
  inte själv såg (Dreamer-meta-observation 2026-05-11)
- Multi-source-aggregation fungerar (Dexcom via Path C + intentioner + tankar)
- Per-user-tenant provisioning klar
- 4 vertikaler designade (Stillra live på TestFlight)

**Vad finns inte än:**
- Icke-Carl-användare som testat
- Magic-link auth live (AB-deferred)
- Brev mot full data (Calendar/Mail/Spotify/Strava saknas, AB-deferred)
- Mood-board (Carls eget arbete, 1-2 dagar)
- Distribution/marknadsföring överhuvudtaget
- Pricing-validering (99-149 kr/månad har ingen testat betala)

---

## Step 0 — Premise challenge

### 0A. Är detta rätt problem att lösa?

**Gap-tesen:** "Människor lever i gapet mellan vad de säger att de vill,
vad de säger att de gör, och vad datan visar att de faktiskt gör."

**Test:** Är detta ett *problem människor känner*, eller ett intellektuellt-
elegant *observerat* problem?

**Brutal observation:** Människor som *känner* gapet är redan i terapi,
läser självhjälpslitteratur, mediterar, eller har gått i existentiell kris.
De är *medvetna*. Selvra adresserar bara dem som *vill se* gapet — inte
dem som lever omedvetna i det.

Det är **medvetna självobservatörer** — segment 1 i positioneringen. De
finns. De är inte massmarknad. Estimat: kanske 2-5% av vuxna i tech-
engaged västländer. För Sverige + Norden: ~50-150k människor som ens
kunde vilja ha Selvra.

**Implikation:** Selvra är inte ett massmarknads-företag. Det är ett
**specialist-företag mot självmedvetna-segmentet**. 99-149 kr/månad ×
5-10k betalande = 500k-1.5M kr/månad om man tar några procent av segmentet.
Det är försörjbart för solo-founder. Det är inte unicorn.

**Verdict på premissen:** Problemet är reellt för segmentet. Men du måste
vara ärlig om segmentets storlek. Selvra som mass-konsument-produkt är
fel framing. Selvra som specialist-tool för medvetna självobservatörer
är rätt framing.

### 0B. Existerande lösningar (vad konkurrerar?)

Inte AI-memory-portability (det är fel kategori). Den **verkliga konkurrensen** är:

| Kategori | Aktör | Vad de gör | Selvras edge |
|---|---|---|---|
| Reflective journaling | Day One, Roam, Reflect.app | Strukturerad själv-skrivning | Selvra läser passivt; journaling kräver disciplin |
| Quantified self | Exist.io (RIP), Gyroscope, Wellnote | Multi-source-aggregation | Selvra prosa-output, inte dashboard |
| Coaching | BetterUp, Modern Health, mindbody-apps | Mänsklig + algoritm | Selvra coachar inte — observation only |
| Insight-AI | Replika, Pi, Personal AI | AI-vän-relation | Selvra är inte vän; den är spegel |
| Mental health | Calm, Headspace, Mindspace | Beteendeförändring | Selvra ändrar inte; bara visar |

**Konkurrent-trio som mest sannolikt absorberar Selvras yta:**
1. **Apple Intelligence + HealthKit + Journal-app** — om Apple bygger gap-
   detektering native med på-enheten-AI, är Selvras "lagret över Apple"
   obsolet för Apple-användare (70% av segment 1 i västländer)
2. **ChatGPT/Claude memory-feature + connectors** — när Anthropic/OpenAI
   bygger native multi-source-connectors blir Selvras Context Engine
   just-en-feature
3. **Notion AI + Personal Database** — för medvetna självobservatörer som
   redan är Notion-användare blir Notion AI som läser deras egna sidor +
   integrationer ett naturligt drag

**Existerande Selvra utnyttjar inte (men borde):** segment 1:s vana att
skriva i Notion (Source Strategy V2 Fas 2 har Notion-import — kritiskt,
inte nice-to-have).

### 0C. Dream state-mapping (12 månader)

```
NUVARANDE (2026-05-12)              12-MÅN-IDEAL
Carl själv dogfoodar                 → 500-1500 betalande users
Brev v0.2 mot 3 källor              → Brev v0.4 mot 8-10 källor
4 vertikaler designade              → 2-3 vertikaler live, en validerad
EU-deployment                       → EU-deployment + KJ Labs etablerat
Inget marketing-arbete              → Editorial newsletter + indie-author-bygge
Inga betalande                      → 5-10% conversion från waitlist
```

Distansen är **stor**. Inte oövervinnerlig — men inte fri.

### 0D. Komplexitetscheck — Selvras strategi-yta

Selvra har idag:
- 1 protokoll
- 1 konsument-app (selvra-app)
- 4 vertikaler (Stillra, Motiq, Forsyne, Elefant)
- 3 positioneringslager
- 3 strategiska tids-faser (Fas 1/2/3 i Source Strategy + nivå 1/2/3 i Context Engine)

Det är **mycket** för en solo-founder. Per Garrys-skillens komplexitets-
test: "om planen rör fler än 8 filer eller introducerar fler än 2 nya
klasser/services, behandla det som smell".

Selvras strategi-yta är *mycket* mer än det. Klassificering: **EXPANSION-
läge utan att medvetet ha valt EXPANSION**.

Min push: REDUCE. Inte i feature-mening (det är låst). I **fokus-mening**.
Vad är *minsta* publika launch som kan validera tesen?

**Förslag:** Selvra-app + Stillra som *enda* två vertikaler initialt.
Motiq, Forsyne, Elefant nedfryses tills tesen valideras. De finns som
architektoniska bevis (protokoll skalar) men inga av dem byggs aktivt.

---

## Section 1 — Idé-arkitektur (strategiska lager)

### Selvras tre positionerings-lager analyserade

**Lager 1: "Lagret över livets källor" — OK**

**Försvarbarhet:** Hög teknisk. Selvra är källagnostik, har portabilitet
(SREF), constitutional reasoning. Det är *byggt på rätt sätt*.

**Risk:** Apple Intelligence när det landar gör samma sak native för
Apple-användare. Med bättre UX, ingen OAuth-fatigue, ingen kostnad. För
70% av segment 1 (iOS-användare i västländer) försvinner motivationen
att betala Selvra om Apple gör det gratis.

**Mitigering (artikulerad):** EU-sovereignty + cross-AI-portability.
Apple-data låst till Apple. Det är *real* edge, men endast om
regulatorisk skillnad bibehålls. EU AI Act kan ändras 2027-2028; om
Apple får compliance, försvinner edge:n.

**Verdict:** Lager 1 är hållbart men inte permanent. Försprånget är 2-4 år.

**Lager 2: "Lagret över AI-konversationer" — STARK**

**Försvarbarhet:** Mycket hög. Context Engine via MCP är arkitektoniskt
elegant, byggs på existerande Selvra-pipeline. Inga konkurrenter har
detta byggt.

**Risk:** Anthropic, OpenAI bygger native multi-source-connectors. När
Claude/ChatGPT lägger till "läs min Spotify direkt", är externt Context
Engine inte längre nödvändigt.

**Tidsfönster för försprång:** 6-18 månader. När någon av Anthropic/OpenAI
släpper detta som feature, blir Selvra Context Engine just-en-broker,
inte essential.

**Mitigering:** Selvra-protokoll är *cross-AI*. Anthropic kommer aldrig
läsa OpenAI-konversation, och vice versa. Selvra blir den enda neutrala
mellanhanden. Det är reell long-term-position OM Selvra hinner etablera
sig som standard innan AI-giganterna konsoliderar.

**Verdict:** Lager 2 är Selvras starkaste position — men tidskänslig.

**Lager 3: "EU-sovereignty + constitutional reasoning" — DELVIS**

**Försvarbarhet i EU-marknad:** Hög. CLOUD Act-exponering är real för
USA-konkurrenter. EU-AI-Act compliance är fördel.

**Försvarbarhet utanför EU-marknad:** Låg. För USA, Asien, Latin-America
är "EU-deployed" snarare nackdel (latens, regulatorisk osäkerhet,
datalokalisering).

**Constitutional reasoning är genuin USP:** Lock-positionerna (aldrig
coacha, aldrig predicera, aldrig döma) är **arkitektoniska commitments**.
Andra aktörer skulle behöva omdesigna sina LLM-pipelines för att efterlikna
det. Det är **kopierbart i namn men inte i praktik**.

**Verdict:** Lager 3 är hyper-stark inom EU, mediocre globalt. Strategiskt:
gör Selvra till EU-default snarare än global-default initially.

### Doktrin-koherens audit

**Lock-positionerna 1-10 är konsistenta** — jag har läst dem i flera
dokument. Inga interna konflikter. Brev-metaforen, käll-attribuering,
prosa-första, ingen-dashboard, agency-as-default, EU-default — alla ekar
igenom konsekvent.

**Ett potentiellt brott:** Context Engine Nivå 1-2 (kort med kategorier
på /context-sida) är **i spänning med "ingen feed, en sak per vy"**.
Att klicka mellan 7 kategori-kort för att generera olika prompts är
*just* en feed-pattern, om än editorial. Värt att problematisera när
Nivå 1 byggs.

---

## Section 2 — Error & rescue map: vad kan döda Selvra

Detta är **kritisk sektion**. Varje rad är en realistisk dödsrisk.

| Risk | Trigger | Mitigerad? | Rescue-handling | Worst-case-impact |
|---|---|---|---|---|
| **R1. Carl burnar ut** | Solo-founder, 3+ workstreams (Selvra + Stillra + Motiq i bakgrunden), AB-väntan, design-iteration | ⚠️ DELVIS — push-back-on-late-night-memory finns men inga strukturella safeguards | Pacing-discipline, single-focus-windows | KRITISKT — utan Carl finns ingen Selvra. Bus-factor = 1. |
| **R2. Brev v0.3 fungerar inte mot full data** | När Calendar+Mail+Spotify+Strava läggs till — prompt regression, datadump, hallucinations | ✅ Pre-mortem R7 dokumenterar risken | Iterera prompt v0.3 → v0.4. Räkna med 3-5 iterationer. | HÖG — om brev v0.3 inte landar för Carl själv, går inte att skala. |
| **R3. Apple Intelligence absorberar yta** | Apple WWDC 2027 lanserar gap-detektering med HealthKit | ⚠️ DELVIS — EU-sovereignty + cross-AI är edge men inte fullständigt skyddat | Snabbare Context Engine-bygge, etablera som EU-default | HÖG — för Apple-användare blir Selvra obsolete utanför EU-Privacy-segment |
| **R4. Anthropic/OpenAI bygger native MCP-multi-source** | Q3-Q4 2026 sannolik leveransram | ❌ Inte mitigerad | Selvra blir cross-AI-broker, inte essential service | MEDIUM — Selvra finns kvar men förlorar Context Engine-värdet |
| **R5. Pricing-fragility** | 99-149 kr/månad är wedged: under "premium therapy" ($150+/månad), över "free journaling" | ❌ Inte testat | Iterera mot freemium eller premium-tier | MEDIUM — för låg conversion gör segment 1 ohållbart |
| **R6. Source-coverage gap** | Garmin-approval tar 4-6 veckor minimum, Apple Health väntar Expo-rewrite, Notion-integration är Fas 2 | ⚠️ DELVIS — Strava som failover, Path C för Dexcom | Accept thin substrate för v1, bygg ut Fas 2 | LÅG-MEDIUM — färre källor = tunnare brev, men inte dödligt |
| **R7. Carl-själv-bias i brev v0.2** | Brevet är tunat mot Carl. När icke-Carl testar kan det kännas främmande, fel-formulerat, för introspektivt | ❌ Inte mitigerad — ingen icke-Carl har testat | Iterera prompt mot 5-10 beta-users med olika profiler | KRITISKT — om brevet inte landar för andra är hela tesen falsifierad |
| **R8. Adoption-friction (OAuth + vänta-en-vecka)** | "Koppla 5 källor och vänta en vecka för värdet" är hög friktion | ⚠️ DELVIS — landing CTA är iterad, brev-exempel renderas, men cold-start är real | Context-prompt teaser som user kan testa direkt (Nivå 1 → live snabbare?) | MEDIUM — påverkar conversion |
| **R9. Distribution-vakuum** | Inget go-to-market-arbete. Ingen waitlist. Inget content. Selvras existens är osynlig för segment 1 | ❌ Inte mitigerad | Editorial newsletter, indie-author-positioning, Are.na-presence | KRITISKT — bästa produkten misslyckas utan distribution |
| **R10. Regulatorisk shift** | EU AI Act ändras 2027, GDPR-revision, eller Sverige-specifik tillsynsskärpning | ⚠️ DELVIS — constitutional reasoning + audit-trail | Anpassa, lobbya via AB | LÅG — Selvra är *bättre* positionerad än konkurrenter mot tightening |
| **R11. Multi-vertikal-komplexitet kollapsar** | Solo-founder kan inte underhålla 4 vertikaler. När en (Stillra) växer börjar de andra rotna | ❌ Inte mitigerad | REDUCE strategiskt: nedfrys Motiq/Forsyne/Elefant tills tesen valideras | MEDIUM — verkligheten påtvingar reduction; bättre att välja medvetet |
| **R12. Context Engine bygger fel sak** | Carl bygger Context Engine Nivå 1 på spekulation utan att veta vad icke-Carl-användare faktiskt vill ha för categories | ✅ Mitigerad — Nivå 1 är gated på brev v0.3-validering per `SELVRA_CONTEXT_ENGINE_2026-05-11.md` | Vänta in validering | LÅG — disciplin finns |

**4 kritiska gaps som behöver explicit mitigering:**

- **R1** Bus-factor — vad händer om Carl är borta i 3 veckor? Inget plan.
- **R7** Icke-Carl-validering — inget bevis att brev fungerar för andra. STÖRSTA hypotesen.
- **R9** Distribution-vakuum — bästa produkten dör utan publik.
- **R5** Pricing-validation — 99-149 kr/månad är gissning.

Dessa är **death-by-omission**-risker. De är inte fail-modes som happens —
de är *frånvaron av motbevis*. Bristen på data är risken.

---

## Section 3 — Strategic threat model

### Konkurrent-trio som mest sannolikt eliminerar Selvras yta

**T1: Apple Intelligence Personal (sannolikhet HÖG, tid 2027-2028)**

- Apple bygger gap-detektering med HealthKit + Calendar + Mail + Photos native
- På-enheten-AI = inga privacy-tradeoffs
- Gratis för Apple-användare
- **Selvras motdrag:** snabb etablering inom EU-segment, cross-AI-position
  (Apple läser inte din Anthropic-data), portabilitet (SREF som Apple inte
  erbjuder)

**T2: Anthropic Claude Personal (sannolikhet HÖG, tid Q3-Q4 2026)**

- Claude memory + multi-source connectors (Gmail, Calendar redan annonserade
  för 2026)
- Bättre prompt-engineering än Selvras Context Engine kan göra extern
- **Selvras motdrag:** cross-vendor (Claude vs ChatGPT vs Gemini),
  EU-deployment, editorial-tradition (Claude är inte editorial)

**T3: OpenAI ChatGPT med Tasks + Memory (sannolikhet HÖG, tid redan halvbyggt)**

- Memory + Tasks + connectors
- Massiv distribution-fördel (400M+ users)
- **Selvras motdrag:** inte konsument-AI-vän, utan strukturerat protokoll.
  Olika produkt-kategori.

### Lägre-sannolikhet-hot

- **Plurality Network/AI Context Flow/AI Migrator-konsolidering** — om en
  av dem köps av Anthropic eller OpenAI, blir kategorin "AI memory
  portability" mer-eller-mindre stängd. Selvras "lager 2"-position blir
  svårare att artikulera.
- **Stripe/Square/banks bygger personal-data-protokoll** — osannolikt men
  möjligt. Skulle kollidera direkt med Selvra-protokollet.
- **EU AI Act gör Selvra olagligt på något sätt** — extremt osannolikt;
  Selvra är *exempel* på vad regleringen vill ha, inte vad den vill förbjuda.

### Marknads-konsolidering-risk

Den största strategiska risken är inte att en ny aktör släpper en bättre
produkt. Det är att **AI-giganterna konsoliderar kategorin "personal AI"
så snabbt att Selvra aldrig hinner etablera mind-share**.

**Tidsestimat innan kategorin är förlorad:** 18-24 månader. Selvra måste
ha någon form av publik traction innan 2027 mid-year.

---

## Section 4 — User journey + retention curve

### Adoption-funnel-test

```
SEGMENT 1 (medvetna självobservatörer i Norden, ~50k-150k)
    ↓ [DISTRIBUTION-VAKUUM: Selvra inte synlig någonstans]
    ↓ ~0.1-0.5% upptäcker Selvra de första 12 månaderna utan marketing
    ↓ = 100-750 potential users
SIGNS UP (magic-link)
    ↓ [ONBOARDING-FRIKTION: 5 OAuth-kopplingar + intentioner + tankar]
    ↓ ~30-50% slutför onboarding
    ↓ = 30-375 onboarded users
READS BREV V1 (efter 1 vecka)
    ↓ [VALUE-DELIVERY: brev v0.3 mot tunn substrate]
    ↓ Hypotes: 40-60% säger "det landar"
    ↓ = 12-225 retained users
PAYS (efter free-period)
    ↓ [PRICING: 99-149 kr/månad, ingen testat]
    ↓ Hypotes: 5-15% av retained converts
    ↓ = 0.6-34 betalande users efter 12 månader
```

**Brutal observation:** Med nuvarande strategi-mix är Selvra på trajektori
mot **<50 betalande efter år 1**. Det är ekonomiskt ohållbart även för
solo-founder med externa intäkter (Carls Stillra etc.).

### Vad som måste flytta funnel-numren

1. **Distribution: minst 1k-5k waitlist före publik launch.** Editorial
   newsletter under selvra.ai/journal (Craig-Mod-inspirerat). Indie-author-
   positioning. Are.na-channel som growth-vehikel.

2. **Onboarding-friktion: snabbare first-value.** Context-prompt-teaser
   som user testar mot egen ChatGPT *redan på landing-sidan* — innan
   signup. Ger smakprov utan OAuth-marathon.

3. **Brev v0.3 mot tunn substrate: prompt-disciplin.** När icke-Carl
   testar med 1-2 källor istället för 5, måste brevet ändå landa. Annars
   filtreras 70% bort i value-delivery-steget.

4. **Pricing: gratis längre, eller freemium.** 99-149 kr/månad direkt är
   för stark commitment innan tesen är personligen validerad. Förslag:
   3-6 månader gratis dogfood, prosa-only. Premium-tier: cross-AI-export
   + Context Engine + Notion-integration.

### Retention efter brev v0.3

Outestat. Hypoteser:
- **Vecka 1-4:** Hög novelty + första-genuine-observation = retention 70-80%
- **Vecka 5-12:** Brevet börjar repetera teman + Dreamer-pattern-loop hotar dogfood-värdet
- **Vecka 12+:** Selvra behöver *evolve* med användaren — brev v0.3 förblir
  samma, men användare har gått igenom 12 brev. Trötthet sätter in.

**Mitigation som inte är dokumenterad:** Selvra borde ha *progression* i
brev-formatet. Vecka 1-4: orientation. Vecka 5-12: pattern-deepening.
Vecka 12+: questions-back-to-user (frågor brevet vill ha svar på som blir
nästa veckas substrate). Det är inte byggt; det är inte dokumenterat. Det
är *retention-strategi-vakuum*.

---

## Section 5 — Doktrin-quality review

Lock-positionerna är artikulerade. Är de **internt konsekventa**?

**Konsistensa par:**
- "Aldrig coacha" + "Aldrig predicera" + "Aldrig döma" — koherenta. Brevet
  är observation, inte intervention.
- "Käll-attribuerad" + "Användaren äger representationen" — koherenta.
  Transparens hela vägen.
- "EU-deployment" + "Constitutional reasoning" — koherenta. Strukturell,
  inte feature-baserad.

**Inom-doktrin-spänningar:**
- **"Reflektionen är produkten"** vs **"Du äger representationen"**. Den
  första säger att brevet är värdet; den andra säger att hela data-stocken
  är värdet. Inte konflikt, men *prioriteringsfråga* när trade-offs uppstår
  (UX vs portabilitet, för-AI-export vs läsbarhet).
- **"Editorial dokument-tradition"** vs **"Context Engine för AI-konversationer"**.
  Editorial är paper-magazine; Context Engine är AI-tool-utility. UX-mässigt
  drar de åt olika håll: Kinfolk vs Linear. Risk att UI blir *neither*-fail.

**Doktrin-blanchande:**
- "Spegla mönster" — vad räknas som mönster? Två observationer? Tre?
  Konsekvent över tid? Räcker en gång? Skillet vet inte vad brevet får
  *kalla* mönster vs anekdot.
- "Utan tolkning" är överoptimistisk. *All* selektion är tolkning. Att
  välja Dexcom-trajectory 82%→58%→95% snarare än fyrtio andra mätpunkter
  är tolkning. Doktrinen säger sanning som inte är möjlig.

**Verdict:** Doktrinen är mestadels konsekvent och **stark**. Två spänningar
att hålla öga på som Selvra växer. En överoptimism i "utan tolkning" som
värd att medvetet artikulera (Selvra *selekterar*, vilket är *en form av*
tolkning).

---

## Section 6 — Validerings-tester (hur vet vi att det fungerar?)

Vad skulle bevisa att Selvra-idén fungerar i världen?

**Test 1 — Brev-resonans för icke-Carl (KRITISKT, otestat)**
- 5-10 beta-users från segment 1 (självmedvetna, tech-engaged, redan-
  journaling-vana)
- 4 veckors dogfood mot egna källor
- Mått: 4 av 5 säger "det landar" på en skala 1-5 (4+ = land)
- **Dödskriterium:** om < 2 av 5 = brevet är Carl-specifikt, inte allmänt

**Test 2 — Retention vid vecka 6 (KRITISKT, otestat)**
- Av beta-cohorten: hur många öppnar brev 6 efter att novelty-effekten avtagit?
- Mått: >50% retention vid vecka 6
- **Dödskriterium:** <30% = produkten har inte progression, blir tråkig

**Test 3 — Vilja-att-betala (KRITISKT, otestat)**
- Av retained-cohorten: hur många säger "ja jag skulle betala 99-149 kr/månad"?
- Mått: >30% intent-to-pay
- **Dödskriterium:** <10% = pricing fundamentalt fel, eller produkten är inte värd det

**Test 4 — Cross-AI-export-användning (sekundärt)**
- Hur ofta använder beta-users export-till-AI-funktion?
- Mått: minst 1 användning per månad per user
- **Dödskriterium:** <0.2 per månad = Context Engine adresserar fel behov

**Test 5 — Source-coverage-elasticity (sekundärt)**
- Fungerar brevet för en user med 1 källa? 2 källor? 5?
- Mått: subjektiv "landing"-kvalitet skiljer inte signifikant mellan 1-
  källa och 5-källa-users (= brevet är källanostiskt)
- **Dödskriterium:** brev kräver 4+ källor för att landa = adoption-
  tröskel för hög

**Vad som idag finns som validering:** Test 1 är delvis genomfört på Carl
(n=1, brev v0.2 fungerar). Övriga 4 är otestade.

**Verdict:** Selvra är **pre-validerings-fas**. Den största enskilda
strategiska investeringen är att designa + köra dessa 5 tester strukturerat
innan publik launch. Inte fler features, inte fler vertikaler — *validering*.

---

## Section 7 — Unit economics + scaling viability

### Per-user-kostnad (estimat)

| Komponent | Estimat per user per månad |
|---|---|
| Railway-infra (delad) | 2-5 kr |
| LLM-anrop (synthesis + Dreamer, ~50k tokens/månad) | 8-15 kr |
| Resend-mail | 0.1 kr |
| OAuth-callbacks/storage | <1 kr |
| Support (Carl-tid initialt) | ?? |
| **TOTAL TEKNIK** | **~12-25 kr/månad/user** |

**Marginal vid 99 kr/månad:** ~75-87 kr/månad/user (75-88% marginal). Hälsosamt.
**Marginal vid 149 kr/månad:** ~124-137 kr/månad/user (83-92% marginal). Mycket hälsosamt.

**Vid scale (>1000 users):** LLM-kostnader sjunker via batch + caching.
Infra-fixed-cost amortiseras. Marginal växer.

### Break-even-analys

- **Solo-founder personal break-even:** ~30k SEK/månad behov.
- **Vid 99 kr/månad:** Behöver ~340 betalande users.
- **Vid 149 kr/månad:** Behöver ~225 betalande users.

**Genomförbart inom 12-18 månader om distribution byggs medvetet.** Inte
genomförbart med nuvarande noll-distribution.

### Scaling-bottleneck

Den verkliga scaling-frågan är inte teknik (Selvra-protokollet skalar fint
till 10k users på existerande Railway). Det är **prompt-disciplin**.

Brev-kvalitet kräver:
- Bra prompt
- Bra substrate (data per user)
- Bra evaluation (är brevet bra?)

Vid 1000 users blir prompt-evaluation crisis: ingen kan läsa 1000 brev/vecka
för att bedöma kvalitet. Behöver:
- Automatiserad eval (LLM-as-judge) — riskabelt, kan blanchera
- User-feedback-loops — friktion
- Spot-checks + statistical sampling — okej, men kräver process

**Inte byggt. Inte dokumenterat.** Vid scaling kollapsar kvalitets-säkringen.

---

## Section 8 — Observability (leading indicators)

Vad ska Selvra mäta för att veta om idén lever eller dör i världen?

**Leading indicators (vecka-skala):**
- Daily-active-writes (intentioner + tankar per user per dag)
- Weekly-brev-open-rate (% som faktiskt läser veckans brev)
- Brev-time-spent (genomsnittlig läs-tid, antyder djup)
- Tankar-tillkomna-efter-brev (väcker brevet reaktion?)

**Lagging indicators (månad-skala):**
- 30-day retention
- 90-day retention
- Churn-reason taxonomy

**Strategisk-indicator:**
- Net-Promoter-Score från beta-cohort
- Konkurrent-references (säger users "jämfört med X" — vilken X?)

**Inte byggt.** Selvra har idag noll product-analytics. Det är *intentional*
per privacy-doktrinen (ingen tracking). Men utan *någon* mätning är
scaling-beslut blinda.

**Mitigering möjlig utan att bryta doktrinen:**
- Opt-in-telemetri: user godkänner explicit i settings att Selvra mäter
  usage. Default off.
- Aggregerad-only: ingen per-user-tracking. Bara "X% av users läste brev
  v.18" på cohort-nivå.
- EU-hosted analytics: PostHog självhostad i Frankfurt (eller egen
  analytics-pipeline).

---

## Section 9 — Go-to-market

### Vad Selvras GTM-strategi är idag

Inte artikulerad. Det är vakuum.

### Vad GTM-strategin **borde** vara

Selvra är inte mass-market. Inte SaaS-distribution. Inte ad-driven. Det är
**content-led + community-led indie-author-positioning**.

**Konkreta drag:**

1. **`selvra.ai/journal`** — editorial newsletter där Carl skriver om
   självobservation, gap-detektering, kropp-tid-uppmärksamhet. Veckovis.
   Inte marketing. Inte feature-pitch. Tankar.

2. **Are.na-channel `selvra-observation`** — växande sammling av citat,
   bilder, referenser kring självmedvetenhet. Communaut-byggande på rätt
   typ av läsare.

3. **Indie-Hacker-style transparens** — bygg-i-public-poster på X/Mastodon
   (inte spam, edited). Visa Brev v0.2-utvecklingen. Folk följer människan,
   inte produkten.

4. **Substack/email-list** för waitlist. 99 kr/månad-nivån vid launch är
   riktad mot 1-3% conversion av list. Mål: 5k waitlist-subscribers vid
   AB-launch.

5. **Editorial-publikations-partnerskap** — Atlantic, Long Reads, The Forge,
   MIT Tech Review etc. Selvra som ämne, inte advertorial.

**Estimat:** 6 månaders content-arbete innan publik launch. Det är
*parallelt* med kod-arbete, inte sekventiellt. Och det är *Carls* arbete —
inte mitt.

**Brutal:** detta är *inte* byggt. Inte påbörjat. Det är största strategiska
gapet just nu.

---

## Section 10 — Long-term trajectory (5-10 år)

### Scenarier

**Scenario A: Niche-success (sannolikhet 30%)**
- Selvra etablerar sig som "Kinfolk för självobservatörer"
- 5k-20k betalande users globalt, ~50% i EU
- Stabil 3-6M kr/år för Carl
- Inte unicorn, inte fail. Hållbart specialist-bolag.

**Scenario B: Apple absorption (sannolikhet 30%)**
- Apple Intelligence + Journal-app + HealthKit gör 70% av Selvras yta
  gratis för 70% av segmentet
- Selvra behåller EU-Privacy-segment och cross-AI-användare
- Reduktion till 500-2000 users
- Inte hållbart för solo, kan bli labour-of-love eller exit

**Scenario C: Protocol-emergence (sannolikhet 15%)**
- SREF v1 blir genuine industry-standard
- Selvra-protokollet adopteras av andra apps (inte bara Selvras egna vertikaler)
- Selvra blir "Stripe för personal AI representation"
- Stora vinster om man hinner före AI-giganternas konsolidering

**Scenario D: Failed validation (sannolikhet 20%)**
- Brev v0.3 fungerar inte för icke-Carl
- Pricing-validering visar ingen vill betala
- Selvra kvarstår som Carls personliga verktyg
- Stillra/Motiq frikopplas, drivs separat

**Scenario E: Acquisition (sannolikhet 5%)**
- Notion/Anthropic/Apple köper Selvra för dess SREF-protokoll + EU-position
- Carl blir teknisk-team-lead i större org
- Selvra-as-independent-brand försvinner

**Förväntat värde:** Mest vikt på A och B. Inte 0-EV, inte unicorn-EV.
**Realistisk specialist-position med liten chans till bredare protocol-emergence.**

---

## Top kritiska gaps (rangordnade)

**CRITICAL:**

1. **Icke-Carl-validering (R7).** Hela tesen vilar på antagandet att
   Carls brev-kvalitet generaliserar. Otestat. Den enskilt största
   strategiska osäkerheten i hela Selvra-stacken.

2. **Distribution-vakuum (R9).** Bästa produkten dör utan publik. Inget
   content. Ingen waitlist. Inget community-bygge. Selvra är osynligt.

3. **Solo-founder bus-factor (R1).** Bus-factor = 1. Inget plan. Inga
   skriftliga successor-instruktioner. Om Carl är borta i 3 veckor läggs
   Selvra ner. *(Se Carls kalibrering nedan — bus-factor nedklassad
   pre-launch.)*

**WARNING:**

4. **Pricing-fragility (R5).** 99-149 kr/månad är gissning. Aldrig
   validerat. Kan vara för lågt (täcker inte support-cost), för högt
   (conversion < 5%), eller fel modell (måste vara freemium).

5. **Retention-progression-vakuum.** Inget plan för hur brevet utvecklas
   vecka 12+. Stagnerad brev-formatet = trötthet = churn.

6. **Multi-vertikal-komplexitet vs solo bandwidth (R11).** 4 vertikaler
   är 3 för många just nu. Stillra dominerar bandwidth; Motiq/Forsyne/
   Elefant rotnar utan att medvetet ha nedfrysts.

7. **Anthropic/OpenAI native-MCP-konkurrens (R4).** Tidsfönster 6-18
   månader. Inte mitgerat. *(Se Carls kalibrering nedan — Anthropic-
   partner-option.)*

**NOTE:**

8. **Doktrin-spänning Editorial vs Context-Engine.** UX-risk att bli neither-fail.
9. **"Utan tolkning" är överoptimism.** Doktrin lovar något arkitekturen
   inte kan leverera.
10. **Observability/analytics-vakuum.** Inte mätbart om idén fungerar
    i världen.

---

## Vad räddar Selvra

Trots gap-listan ovan: Selvra har strukturella fördelar som *enheter dem
flesta startups saknar*.

**S1. Constitutional reasoning är genuin arkitektonisk USP.** Lock-positioner
som arkitektoniska commitments är *svår* att efterlikna. När konkurrenter
kommer kan de inte snabb-bygga detta — det kräver omdesign av deras LLM-
pipelines.

**S2. SREF v1 portabilitet som protocol-emergence-kandidat.** Om Selvra
etablerar SREF som öppen standard innan AI-giganterna konsoliderar, kan
Selvra-as-protocol-stewards ha 10-årig värdetillväxt.

**S3. EU-position är fast.** CLOUD Act-exponering för USA-konkurrenter är
permanent strukturell skillnad. EU-segment är inte stort men det är
*Selvras hemmamarknad*.

**S4. Editorial design-tradition är medvetet val.** Selvra ser inte ut
som något annat på marknaden. Kinfolk-tradition i tech-konsument-yta är
distinkt. Det är kopierbart i namn men kräver disciplin att efterleva —
disciplin som SaaS-kulturer inte har.

**S5. Multi-source-aggregation är redan byggd.** Konkurrenter måste bygga
detta från noll. Selvras protokoll är 12k LOC av väl-genomtänkt arkitektur.
Tidsförsprång: 6-12 månader minimum.

**S6. Vertikal-bevis-strategi (om bandwidth tillåter).** Stillra som
validerande pilot för T1-diabetiker är genuin proof-of-protocol. Andra
startups skulle behöva designa hela proof-strukturen från noll. *(Se Carls
kalibrering nedan — Stillra är mer strukturellt viktigt än recensenten
adresserade.)*

---

## Rekommendation: håller idén?

**Verdict: Idén håller. Men inte automatiskt.**

Selvra är inte ett företag som dör om Carl gör genomsnittliga drag. Selvra
är ett företag som *kan* bli något meningsfullt om Carl gör tre saker rätt:

**Drag 1: Validera tesen på icke-Carl. Innan något annat.**

5-10 beta-users från segment 1. 4-6 veckors dogfood. Brev-resonans-test +
retention-test + pricing-intent-test. Innan Context Engine-bygge, innan
mobile Expo, innan Notion-integration.

**Dödskriterium:** om brev-resonans-test failar (< 2 av 5 säger "landar"),
pivotera. Kanske mot pure-data-aggregation utan brev. Kanske mot guided-
self-reflection. Men inte blint vidare med samma format.

**Drag 2: Bygg distribution parallellt med AB-wiring.**

`selvra.ai/journal` editorial newsletter. Are.na-channel. Bygg-i-public-
tråd. Mål: 1k-2k waitlist innan publik launch. Carls eget arbete, 6
månaders horisont.

**Drag 3: Ranka vertikalerna. Frys de som inte aktivt valideras.**

Aktiv: Selvra-app + Stillra. Frysta: Motiq, Forsyne, Elefant. Skrift-
resolution. Återupp-rankning post-validering.

**Om dessa tre drag görs:** Selvra har 50-60% sannolikhet att nå Scenario
A (niche-success) eller bättre. Det är *bra* odds för ett seriöst projekt.

**Om dessa tre drag inte görs:** Selvra har 40-50% sannolikhet att hamna
i Scenario D (failed validation) eller stagnera till Carls personliga
verktyg. Det är *inte* fail-state — men det är inte vad du beskrivit som
ambition.

---

## Sammanfattnings-tabell

```
+======================================================================+
|              SELVRA MEGA-REVIEW — COMPLETION SUMMARY                  |
+======================================================================+
| Mode                  | HOLD SCOPE                                    |
| TL;DR                 | Idén håller. Inte automatiskt.                |
| Premiss               | Reell men nischad (~50-150k segment Norden)   |
| Konkurrent-trio        | Apple, Anthropic, OpenAI — tidsfönster 18-24m |
| Critical gaps         | 3 (R1 burn, R7 icke-Carl-validering, R9 GTM)  |
| Warning gaps          | 4 (pricing, progression, multi-vertikal, MCP) |
| Notes                 | 3 (doktrin-spänningar, "utan tolkning", obs)  |
| Strukturella styrkor  | 6 (constitutional, SREF, EU, editorial, ...)  |
| Sannolikhets-mix      | A:30% B:30% C:15% D:20% E:5%                  |
| Tidsfönster           | 18-24 mån innan kategorin konsolideras        |
| Krav-att-leva         | 3 drag (validera + distribuera + frysa)       |
| Hållbar EV            | Hälsosam specialist-position; ej unicorn      |
+======================================================================+
```

---

## Carls kalibreringar (2026-05-12 post-review)

Recensionen läst noga. Tre kalibreringar och tre tillägg till recensentens analys.

### Kalibreringar — vad recensenten överdrev eller missade

**K1. R1 bus-factor är inte kritiskt pre-launch.**

Recensenten klassar R1 som kritisk. Carls läsning: reell men inte kritisk
just nu. Selvra är pre-launch. Inga betalande kunder beror på upptid. Om
Carl är borta i 3 veckor pre-launch är konsekvensen *väntar tre veckor*,
inte *bolaget kollapsar*.

Bus-factor blir kritisk **post-launch** när användare beror på Selvra
dagligen. Då behövs successor-instruktioner. Inte nu.

**Behandling:** TODO för senare. Inte akut-fixa.

**K2. Sannolikhets-mixen är gissning — inte värd argumentera om.**

Recensenten själv flaggar: "Mina sannolikheter är gissningar." Specifikt:
Scenario C (protocol-emergence via SREF) är möjligen underviktat. AI-
memory-portability-kategorin växer; Selvra har structural moat genom EU
+ constitutional reasoning + redan-byggd MCP. 15% kan vara försiktigt.

Men inte värt borrning. Sannolikheter är trams. Vad som matterar är att
göra de tre dragen rätt.

**K3. T2 (Anthropic) är inte ren konkurrent — partner-option finns.**

Anthropic gjorde `claude.com/import-memory` explicit för anti-lock-in.
De positionerar sig motsats till OpenAI (stängd memory-export). När
Anthropic bygger native MCP-multi-source (R4), gör de det med
portabilitet i åtanke. Selvra-protokollet är kompatibelt med Anthropics
riktning, inte konkurrent.

**Strategisk option:** Selvra som partner till Anthropic snarare än
konkurrent. SREF som format för portabel personlig representation kan
adopteras eftersom det matchar deras position.

### Tillägg — vad recensenten missade

**T1. Stillra är genuint proof-of-protocol, inte "andra vertikal".**

Stillra är bevis att Selvra-protokollet fungerar för T1-diabetiker — en
av de svåraste användarna att designa för (medicinsk komplexitet,
livskritisk data, mental hälsa). Om Stillra fungerar för T1-segmentet,
är arkitektonisk princip validerad.

Selvra-app för medvetna självobservatörer är annan användning av samma
protokoll. **Stillra-validering ger Selvra strukturellt försprång som
recensenten inte räknade in.**

**T2. Tempot under denna session är atypiskt.**

Recensenten antar normal solo-founder-tempo. Carl har levererat veckor
av arbete på en session med Claude Code-leverage. Det betyder distance
till 12-mån-ideal är inte oövervinnerlig — den är 3-6 månaders intensivt
arbete om tempot bibehålls.

Inte argument att inte göra de tre dragen. Observation att tempot är möjligt.

**T3. R7 är inte påstående — strukturell sanning.**

R7 (icke-Carl-validering) är inte en av 12 risker. Det är *den* risk som
allt annat hänger på. När wiring är klar och brev v0.3 fungerar mot
fullständig data, är det första som måste hända att 5-10 personer i Carls
närhet testar. Inte produktlansering. Validering.

---

## De tre locked-imperativen (post-review, 2026-05-12)

Recensentens tre rekommendationer accepterade som **strategiska
imperativ** — på samma nivå som de 10 lock-positionerna och 8 canonical
positionerings-fraserna. Inte features. Strategiska commitments.

### Imperativ 1 — Validera tesen på icke-Carl

**Vad:** 5-10 beta-users från segment 1 (självmedvetna, tech-engaged,
redan-journaling-vana, helst spridning över ålder/kön/yrke). 4-6 veckors
dogfood mot egna källor. Tre kvantitativa mått:

1. **Brev-resonans:** ≥4 av 5 säger "landar" på skala 1-5
2. **Retention vecka 6:** >50% öppnar brev 6
3. **Vilja-att-betala:** >30% intent-to-pay för 99-149 kr/månad

**Dödskriterier:**
- Brev-resonans <2 av 5 → tesen falsifierad, pivotera
- Retention <30% → produkten saknar progression
- Intent-to-pay <10% → pricing eller produkt fundamentalt fel

**Trigger:** efter AB-wiring + brev v0.3 mot full data.

**Förbjudet:** bygga Context Engine Nivå 1, mobile Expo, eller nya
vertikaler innan validering.

### Imperativ 2 — Bygg distribution parallellt med AB-wiring

**Vad:** Editorial newsletter under `selvra.ai/journal`. Are.na-channel.
Bygg-i-public-närvaro. Mål: minst 1k-2k waitlist innan publik launch.

**Format:** Carls eget arbete. Veckovis. Inte marketing. Inte feature-pitch.
Tankar om självobservation, gap-detektering, kropp-tid-uppmärksamhet.

**Trigger:** börjar direkt, parallellt med AB-wiring. Inte efter.

**Förbjudet:** vänta tills produkten är "klar". Distribution byggs i
parallell med produkten, inte sekventiellt.

### Imperativ 3 — Ranka vertikalerna. Frys de som inte aktivt valideras.

**Aktiv-status (2026-05-12):**
- ✅ Stillra — primärt fokus, TestFlight, validerar protokoll på T1-segmentet
- ✅ Selvra-app — konsument-yta för medvetna självobservatörer

**Fryst-status (2026-05-12):**
- ❄️ Motiq — arkitektoniskt designat, inte aktivt byggt. Återupp-rankning
  post-Selvra-app-validering.
- ❄️ Forsyne — samma. Återupp-rankning vid behov.
- ❄️ Elefant — samma. Återupp-rankning vid behov.

**Trigger:** låst nu. Återupp-ranking endast efter Imperativ 1 är validerat.

**Förbjudet:** mid-build-pivots till Motiq/Forsyne/Elefant. Frysning är
medveten disciplin, inte distraktion-via-rotation.

---

## Open critical gaps att tracka (revisita var 4-6 vecka)

| Gap | Status 2026-05-12 | Nästa steg |
|---|---|---|
| **R7 — Icke-Carl-validering** | ❌ Inte påbörjat | Beta-cohort efter brev v0.3-validering på Carl |
| **R9 — Distribution-vakuum** | ❌ Inte påbörjat | selvra.ai/journal newsletter, parallellt med AB-wiring |
| **R11 — Multi-vertikal-komplexitet** | ✅ Adresserat via Imperativ 3 | Skriftlig frysning av Motiq/Forsyne/Elefant |
| **R1 — Bus-factor** | TODO (post-launch) | Successor-instruktioner när användarbase finns |
| **R5 — Pricing-validation** | ❌ Inte påbörjat | Test 3 i beta-cohorten (intent-to-pay) |
| **R4 — Anthropic native-MCP** | ⚠️ Strategisk option finns | Partner-möjlighet utforskas om/när relevant |

---

## Använd-dig-av-instruktion

**När:** revisita doc:en var 4-6 vecka.
**Vad att tracka:** rörelse på de 6 open critical gaps. Imperativ 1-3
progress. Konkurrent-tabell-uppdatering. Probabilities och scenarier
omkalibrerade om nya data.

**Inte:** ompröva idén baserat på en dålig dag. Selvras strukturella
position är *fast*. Det är *exekvering* som rör sig.

---

## Vad detta dokument inte är

- Inte god-eller-dålig-dom på Selvra som idé. Idén är *bra*. Frågan är
  om *exekvering + validering* matchar idén.
- Inte avskräckning. Skarp granskning för att hjälpa Carl se vad världen
  kommer testa.
- Inte stenat. Recensent är subjektiv. Mer data → bättre kalibrering.

**Carl-noteringen:** "Det här är bästa typ av motstånd Claude Code kan
ge dig. Det är inte cheerleading. Det är inte avskräckning. Det är vad
världen kommer testa Selvra mot — artikulerat innan världen själv gör
det."
