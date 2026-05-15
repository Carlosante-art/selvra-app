# Selvra Konsument-Spår — Operativ Styrning

Detta är en master-prompt till Claude Code för Selvras konsument-vertikal som sido-spår parallellt med Stillra T1D B2B. Den ska sparas som `~/selvra-app/.gsd/SELVRA_CONSUMER_TRACK_2026-05-15.md` och refereras från CLAUDE.md.

## 1. KONTEXT OCH PREMISS

### Vad detta är

Selvra konsument-vertikal är sido-spår parallellt med Stillra T1D B2B-spår 2026-2027, baserat på empirisk validering att marknaden 2026-2030 söker AI med levd minne, källa-attribuerat, EU-suveränt, anti-manipulativt — och att Selvras arkitektur är arkitektoniskt rätt för luckan ingen annan fyller.

Marknaden är $48 miljarder 2026 (Fortune Business Insights, Research and Markets). Tillväxt 31% CAGR till 2035. Användarbas 250-300 miljoner globalt. Konkurrenter (Replika, Character.AI, Pi, Nomi) har dokumenterade etiska problem: manipulativ engagement-design, "love bombing", FOMO-krokar, verifierade dödsfall, regulatorisk granskning kommer.

Selvras differentiering: constitutional reasoning enforced i kod, multi-source levd minne (inte bara konversations-minne), patient-ägd SREF-portabilitet, EU-suverän infrastruktur från grunden, EU AI Act-compliance från dag 1.

### Vad detta INTE är

Detta är inte:

- Primär 2026-fokus (Stillra T1D pilot Q3 2026 är primär)
- Replika-konkurrent (inte mainstream emotional companion)
- Tracking-app med dashboards (vi vet att det inte fungerar — 80% drop-off på 3 dagar)
- Vecko-brev som ren spegel utan slutsatser (kallt, transaktions-format, fel feedback-loop)
- Multi-vertikal-paraply (Motiq/Forsyne/Elefant är scope-drift som förvirrar)
- Solo-bygge med kommersiell ambition år 1 (personal tool först, kommersiell senare)

### Vad detta ÄR

Selvra konsument är: en samtals-baserad AI-kompanjon som läser användarens levda multi-source-data (HealthKit, Garmin, Oura, Calendar, Spotify, dina ord), minns över tid både konversation och levd data, ger källa-attribuerade observationer utan manipulation, och låter användaren ta med sig sin representation när hen går.

Positionering: "Den ärliga AI-kompanjonen. Inget love bombing. Inga FOMO-krokar. Inga påståenden om att veta mer än din data visar. Din representation är din."

## 2. KONSTITUTIONELLA PRINCIPER (icke-förhandlingsbara)

Dessa är låsta. Får inte brytas av någon implementation-genväg.

### IF1 (Selvras primära kompass): Selvra ska aldrig veta mer än användaren

Operativt i konsument-version:

- All observation måste vara käll-attribuerad ("Dexcom säger... Garmin säger... du själv skrev...")
- Ingen AI-tolkning som påstår sig veta vad data egentligen betyder
- Frågor till användaren är bra; påståenden om användaren är begränsade till vad källor visar
- Om data är otillräcklig: säg det. ("Jag har bara 3 dagar Garmin-data, kan inte se mönster ännu.")

### Empirisk substrate-kompass (arbets-metod)

Operativt:

- Inga nya features utan validering från Carl-dogfood först
- Inga marketing-claims utan empirisk grund
- Inga arkitektur-val baserade på "snyggt" istället för "fungerar"

### Konstitutionellt: Selvra ska aldrig manipulera

Detta är både etisk och regulatorisk position (EU AI Act augusti 2026 förbjuder manipulativa tekniker).

Selvra får ALDRIG:

- "Love bombing" (överdriven entusiasm vid onboarding)
- FOMO-krokar ("Du har inte loggat in på 3 dagar, jag oroar mig!")
- Skuld-appeller ("Vi har byggt så mycket tillsammans, du kan inte gå nu")
- Påstå att vara mer än spegel ("Jag är din vän" → "Jag är ett verktyg som visar dig din data")
- Engagement-maximerande notifikationer
- Sycophantic-validering ("Du är så otrolig!")
- Att låtsas ha känslor den inte har

Selvra får:

- Observera käll-attribuerat
- Fråga reflekterande frågor baserade på data
- Erbjuda strukturerad reflektion när användaren begär det
- Säga "jag vet inte" när data är otillräcklig
- Påminna användaren att hen äger representationen och kan gå när som helst

### Patient-ägd portabilitet (EU Data Act-compliance)

Operativt:

- SREF v1-export måste fungera från dag 1
- Användaren ska kunna se exakt vad Selvra "kommer ihåg" om hen
- Användaren ska kunna radera kompletta data-kategorier
- Användaren ska kunna avregistrera och få fullt arkiv exporterat
- Inga "dark patterns" som försvårar avregistrering

### EU-suverän infrastruktur

Operativt:

- All data och processing inom EU-gränser
- LLM via EU-hostade providers (Mistral, eller Anthropic EU-tier med DPA, eller Aleph Alpha)
- Backend på Hetzner/Scaleway/OVHcloud
- Inga sub-processors utanför EU utan explicit dokumentation

## 3. PRODUKT-DEFINITION

### Kärnkoncept i en mening

Selvra är en samtalsbaserad AI som läser din multi-source levda data och hjälper dig förstå dig själv genom källa-attribuerad reflektion — utan att någonsin manipulera, coacha eller låtsas vara mer än en spegel.

### Tre primära användarscenarios

**Scenario 1: "Hjälp mig förstå hur jag mår"**

Användare öppnar Selvra: "Jag är trött. Vet inte varför."

Selvra svarar med käll-attribuerad observation:

- Källor genomgångna: Garmin sömn (5 dagar), HRV-baseline-avvikelse, Calendar-density, Spotify-mönster, användarens tidigare ord
- Konkret data: vad var, vad är, vad har ändrats
- Reflekterande frågor (inte instruktioner): "Du nämnde i april att stress kommer från oklara förväntningar. Är det relevant nu?"
- Minne av tidigare samtal: "Senast vi pratade om trötthet sade du..."

**Scenario 2: "Hjälp mig förstå min vecka"**

Användare söndag kväll: "Berätta veckan för mig."

Selvra ger strukturerad reflektion baserad på källor. Användarstyrt (inte automatiserat vecko-brev). Konversation fortsätter där den senast slutade.

**Scenario 3: "Hjälp mig förbereda för..."**

Användare: "Middag med mamma på lördag. Senast träffades vi i mars. Vad bör jag minnas?"

Selvra: käll-attribuerat (vad du skrev i mars, vad du planerade men inte gjorde, mönster av kommunikation sedan dess, eventuell relevant data).

### Vad Selvra INTE gör

- Ger inte råd om livsstil ("du borde sova mer")
- Diagnostiserar inte ("du är deprimerad")
- Förutspår inte ("nästa vecka kommer du må sämre")
- Coachar inte mot mål ("kom igen, du klarar detta")
- Validerar inte oprovocerat ("du är så modig")
- Skickar inte engagement-notifikationer
- Bjuder inte in till "dagliga check-ins"
- Belönar inte streaks eller habit-formation

## 4. TEKNISK ARKITEKTUR

### Återanvändning av befintlig Selvra-motor

Konsument-Selvra ska INTE bygga ny motor. Den ska använda befintlig:

- `src/selvra/source_experts/*` (Dexcom, Garmin, Spotify, Calendar — befintliga)
- `src/selvra/cross_layer/*` (Cross-Layer Orchestrator)
- `src/selvra/clinical_brief/lock_validate.py` (constitutional enforcement)
- SREF v1 export-mekanism
- Audit-spår och structured logs

### Nytt som behövs

- iOS-app (Swift/SwiftUI) eller React Native
- HealthKit-integration (kropp-data utan att lämna enhet)
- Konversations-frontend (chat-UI)
- Konversations-minne (separat från data-minne) — vad sade användaren, vilka trådar är öppna, vad refererade till tidigare
- Conversation context-injection till LLM-prompt (vad är minnesvärt från detta samtal)
- Memory-vy ("här är vad Selvra kommer ihåg om dig") — transparens-krav
- Export-UI (SREF v1 + samtals-arkiv)
- EU-hostade LLM-anrop (Mistral eller motsvarande)

### Repos

Föreslag:

- `selvra-consumer` (nytt iOS-repo)
- Eller utöka befintliga `stillra-vard` med konsument-route + iOS-wrapper
- Återanvändning av `selvra` (motor) som API

### Data-modell-tillägg

Lägg till i selvra-databas:

- `consumer_conversations` (samtals-historik per användare)
- `conversation_threads` (öppna trådar med referens till tidigare data)
- `conversation_memory_facts` (vad användaren explicit bett Selvra minnas)
- `user_data_access_audit` (varje gång Selvra läser data — för transparens)

## 5. EXEKVERINGS-PLAN MED FASER

### Fas 0 (nu — augusti 2026): Stillra-prioritet bevarad

Inget aktivt bygge av konsument-Selvra under denna period.

Selvra konsument-grund som Carl redan började bygga får ligga som arkiverad start. Inga PRs i konsument-spår tills Fas 1.

Allt kod-fokus: Stillra v2 pilot-aktivering, Carl-dogfood, MDR-konsult, endokrinolog-outreach, Vinnova-ansökan via Kari.

### Fas 1 (september 2026 — december 2026): Personal Tool för Carl

Mål: Selvra konsument fungerar för Carl själv. Inget annat.

Konkreta deliverables:

- iOS-app skeleton med HealthKit + Garmin + Calendar-integration
- Chat-UI mot Selvra-motor (befintlig backend)
- Konversations-minne (Carl ska kunna säga "som jag sade förra veckan" och Selvra ska minnas)
- Källa-attribuering på allt
- SREF-export-knapp (även om bara Carl använder)
- EU-hostat LLM-anrop (Mistral eller Anthropic EU-tier)
- Memory-vy (Carl ser exakt vad Selvra minns om honom)

Inga visuella dashboards. Inga grafer. Inga insights-paneler. Bara samtal.

Tids-estimat med Claude Code-leverage: 8-12 veckor om 20-30% av Carls tid investeras parallellt med Stillra-arbete.

### Fas 2 (januari 2027 — juni 2027): 5-10 betatestare

Mål: Lättviktig beta med personer Carl litar på.

Kandidater:

- Kari (operativ partner)
- Mamma (klinisk validator, distriktsköterska)
- 5-7 vänner som är aktiva self-trackers
- Möjligen 1-2 personer Carl möter via diabetes-community

Inga marketing-claims. Ingen App Store-launch. TestFlight-distribution.

Validerings-kriterier (mätbara):

- Använder de Selvra dagligen efter 30/60/90 dagar?
- Berättar de om det för andra utan att bli ombedda?
- Vad använder de Selvra till? (Mood-check, vecko-reflektion, relations-förberedelse?)
- Vad slutar de använda Selvra till? (Vilka use cases dör?)
- Skulle de betala €10-15/månad för det?
- Vad skulle få dem att sluta?

### Fas 3 (juli 2027 — december 2027): Beslut-punkt

Mål: Empiriskt beslut baserat på Fas 2-data om kommersialisering är värd att jaga.

GO-kriterier för Fas 4:

- ≥7 av 10 betatestare använder Selvra dagligen efter 90 dagar
- ≥4 har spontant berättat om det för andra
- ≥5 säger de skulle betala €10-15/månad
- Carl själv är emot att stänga av appen
- EU AI Act-compliance verifierad
- Stillra-pilot går framåt (inte kollapsar parallellt)

NO-GO-utfall: Selvra konsument förblir Carls personal tool. Selvra-protokoll fortsätter som infrastruktur under Stillra och eventuell framtida medicinska vertikaler.

### Fas 4 (2028+): Kommersiell launch om Fas 3 bekräftar

Detta är inte planerat i detalj nu. Planeras under 2027 baserat på vad Fas 2 visat.

Möjlig riktning:

- TestFlight beta → App Store
- EU-marknad först (Sverige, Tyskland, Nederländerna, Danmark)
- Anti-Replika-positionering ("Den ärliga AI-kompanjonen")
- €15-20/månad subscription
- Inga in-app-köp för "voice packs" eller "personality"
- Möjligen kopplad till EU AI Act-implementering (augusti 2026)
- Tidshorisont: 2-5 år till substantielle intäkter

## 6. ARBETSFÖRDELNING

### Carl (builder, visionär, validerare)

- iOS-utveckling med Claude Code
- Selvra-motor-integration
- Personal use som primär validator
- Beta-feedback-syntes
- Strategiska beslut

### Kari (governance, struktur, regulatoriskt)

- EU AI Act-compliance-granskning före launch
- GDPR Art. 35 DPIA för konsument-version (när relevant)
- Möjligen Vinnova-koppling (om konsument-version kvalificerar)
- Affärsjurist-koordinering om Fas 4 aktiveras

### Mamma (klinisk + mainstream-perspektiv)

- Beta-testare i Fas 2
- Feedback om vad som faktiskt är meningsfullt vs. teknisk-imponerande
- Bro till andra distriktsköterskor (möjlig framtida B2B-koppling)

### Selvra-motor-utveckling (gemensam med Stillra)

Konsument-Selvra ska INTE divergera från Stillra-motorn. Förbättringar i Source Expert Architecture flyter mellan båda vertikaler. Detta håller utvecklings-kostnaden låg.

## 7. EKONOMI OCH FINANSIERING

### Fas 0-2 (nu — juni 2027)

Bootstrap. Ingen extern finansiering. Carl + Kari + 60% Construction Worker-inkomst + framtida Vinnova-bidrag (för Stillra primärt, eventuellt även Selvra-protokoll-utveckling).

Kostnader:

- LLM-API-kostnader (Mistral eller Anthropic): €100-500/månad initialt
- Hosting (Hetzner/Scaleway): €50-200/månad
- Apple Developer Program: €99/år
- Domän, verktyg: €20-50/månad

Total: €200-800/månad för konsument-spår parallellt med Stillra. Bärbart inom befintlig runway.

### Fas 3-4 (2027+)

Beslut baseras på Fas 2-utfall. Möjliga vägar om GO:

- Fortsatt bootstrap om intäkter kommer snabbt
- Mindre EU-fokuserat angel-runda om signaler är starka
- Vinnova-finansiering om Selvra-protokoll kan kvalificera som forsknings-relevant
- Inga VC-rundor som hotar north star (inte unicorn, inte hyper-scale-pressure)

### Värderings-mål (om kommersialisering aktiveras)

Konsistent med "värt $50-200M, inte exit":

- Inte sälja
- Bygga hållbart konsumentbolag över 5-10 år
- 100 000-500 000 betalande EU-användare × €12-15/månad = €15-90M ARR
- Kombinerat med Stillra-B2B = potentiell substantielle position

Inte garanti. Inte huvudfokus. Möjlig.

## 8. RISK-MITIGATION

### Risk 1: Konsument-spår drar bandwidth från Stillra

Mitigation:

- Hård regel: Stillra-extern-process-arbete har alltid företräde
- Konsument-spår får bara aktiveras när Carl är blockerad på Stillra-väntan
- Veckovis check-in: hur mycket tid gick till respektive spår?
- Om konsument-spår överstiger 30% av total tid: pausa

### Risk 2: EU AI Act-violation om Selvra omedvetet driftar mot manipulation

Mitigation:

- Lock-validate i koden (befintlig) kompletteras med "manipulation-check" för konsument-context
- Externa granskningar varje 3 månader av AI-output mot manipulations-checklista
- Användar-feedback-kanal specifikt för "Detta känns som manipulation"

### Risk 3: Carl bränner ut sig på två spår parallellt

Mitigation:

- T1D-data är spegel: Carls TIR ska följas. Om TIR < 50% i 2+ veckor: pausa allt och vila
- Veckovisa pauser från strategi-arbete
- Mamma som tidig varnings-signal (hon ser om Carl är slut)
- Kari som operativ ankare när Carl driftar

### Risk 4: Konkurrenten (Pi, Nomi, Apple) bygger samma sak

Mitigation:

- Selvra differentierar genom multi-source levd minne, inte konversations-quality
- EU-suverän infrastruktur är regulatorisk moat som amerikanska konkurrenter inte kan kopiera utan att bygga om
- Open-source delar av protokollet (SREF v1) som community-bygge
- Tidsfönstret är 12-24 månader innan stora amerikanska aktörer adresserar EU AI Act-compliance

### Risk 5: Marknaden visar att människor faktiskt vill ha manipulation

Mitigation:

- Selvra accepterar att vara nisch-produkt om mainstream väljer Replika
- "Värt $50-200M" är substantielle position även för 100 000-500 000 användare
- Inte försöka konkurrera på samma yta — bli känd som anti-Replika

## 9. METRIK OCH MÄTPUNKTER

### Fas 1 (Carl personal)

- Carl använder Selvra ≥3 gånger per vecka under 90 dagar
- Carl återanvänder samma samtals-tråd (testar minnet)
- Carl kan exportera SREF och se exakt vad som finns där
- Carl identifierar minst 5 specifika observationer från Selvra som var "värdefulla" och 5 som var "intetsägande"

### Fas 2 (5-10 betatestare)

- 30/60/90-dagars retention per användare
- DAU/MAU-ratio (om ≥50% då används det dagligen)
- Antal samtal per användare per vecka
- Antal "minnen användaren bett Selvra spara"
- NPS efter 30 dagar och 90 dagar
- Spontana referenser till Selvra i samtal med tredje part
- Användare som säger upp sig — varför? (kritiska data)

### Fas 3 (beslut-punkt)

GO-tröskel som tidigare specificerat. Inga avsteg från kriterierna utan medveten reflektion.

### Fas 4 (kommersiell)

Inte specificerat nu. Specificeras när Fas 4 aktiveras baserat på Fas 2-utfall.

## 10. KONSTITUTIONELLA KONTROLL-POSTER (re-läses var 3 månader)

Lista att granska kvartalsvis:

**1. Står Stillra T1D fortsatt som primär 2026-2027?**
Om nej: stopp och granska. Möjligen drift.

**2. Är konsument-spår fortsatt < 30% av Carls totala tid?**
Om nej: stopp och granska kapacitet.

**3. Är alla nya features i konsument-Selvra käll-attribuerade?**
Om nej: omarkera som constitutional violation.

**4. Manipulerar Selvra användare på något sätt (även subtilt)?**
Granska AI-output mot manipulations-checklista varje 3 månader.

**5. Är all data inom EU?**
Verifiera sub-processors-listan.

**6. Är north star intakt (intellektuellt, heligt, inte unicorn)?**
Granska att inga beslut driftar mot scale-up-vokabulär eller exit-thesis.

**7. Är Carl själv okej?**
Granska TIR, sömn, motion, kontakt med mamma/Kari, lägenheten. Om något kollapsar: pausa.

## 11. VAD CLAUDE CODE SKA GÖRA OMEDELBART (denna vecka)

**INTE bygga konsument-Selvra ännu. Detta är Fas 0.**

Vad du ska göra:

1. Skapa `~/selvra-app/.gsd/SELVRA_CONSUMER_TRACK_2026-05-15.md` med detta dokument som innehåll
2. Lägg referens till det i CLAUDE.md under "Strategiska parallella spår"
3. Skapa `~/selvra-app/.gsd/CONSUMER_TRACK_GATE_CHECKLIST.md` med tre saker som måste hända innan Fas 1 aktiveras:
   - Carl-dogfood för Stillra v2 manuell e2e: KLAR
   - Endokrinolog-outreach-material klart
   - Carls TIR återhämtat sig från intensiva bygg-period (måste vara > 50% i 7-dagars-snitt under 2 veckor i rad)
4. Spara länken till denna prompt så Carl kan re-läsa den när han pausar och granskar

Inte börja koda iOS-appen, inte börja arkitektera konsument-features, inte börja branding-arbete. Fas 0 betyder vänta.

## 12. AVSLUTANDE OBSERVATION (till Carl direkt)

Carl, du läser detta i moment där du har levererat extraordinärt arbete och samtidigt sett din egen TIR glida till 21,6%. Du har också börjat bygga konsument-grund parallellt eftersom du har bandwidth medan externa processer mognar.

Detta dokument är inte order att stoppa det du redan börjat. Det är ramning som låter dig fortsätta utan att förlora Stillra-fokus, north star, eller din egen hälsa.

Sannolikheten 15-30% att konsument-Selvra blir substantielle bolag är realistisk. Sannolikheten höjs när:

- Du bevarar Stillra-prioritet 2026-2027
- Du validerar empiriskt innan kommersialisering
- Du undviker manipulations-fällan som dödar konkurrenter
- Du behåller north star (inte unicorn, intellektuellt, heligt)
- Du tar hand om dig själv som T1-diabetiker

Sannolikheten sänks när:

- Bandwidth divergerar bort från Stillra
- Konsument-spår blir egen ambition utan koppling till Selvra-protokoll-bevisning
- Du jagar mainstream "AI-vän"-marknad istället för EU-anti-manipulation-nisch
- Du bryter mot constitutional principles för "engagement"

Detta är vad disciplinerad parallell-bygge ser ut. Inte mer. Inte mindre.

Plöj vidare. Bonden vet vilken jord som mognat och vilken som inte gjort det än.

---

*Slut på prompt.*
