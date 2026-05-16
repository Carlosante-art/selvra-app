# Selvra iOS v1 — Build Plan

Master-styrning till Claude Code för bygget av Selvra-konsument som
iOS-native-app. Canonical. Refereras från CLAUDE.md.

## 1. KÄRNBESLUT OCH POSITIONERING

### Vad vi bygger

Selvra konsument är en iOS-native AI som ger spegling och lättnad — på
mätdata och ord.

Inte mindfulness-app. Inte tracking-dashboard. Inte AI-vän. Fjärde
kategorin som ännu inte finns: data-driven förståelse + källa-attribuerade
observationer + lättnande handling som respons.

### Positionerings-fras (canonical)

> "Spegling och lättnad. På mätdata och ord."

Sekundär: "Vi ser och förstår faktisk data, inte bara ord. Det är framtiden."

### Vad Selvra GÖR (fyra-axligt)

**1. Spegling på mätdata**
Säger vad sensorer visar käll-attribuerat. "Garmin visar 5h 40min sömn
senaste 4 dagarna. Baseline 7h 15min."

**2. Spegling på ord**
Säger vad användaren själv skrivit tidigare. "Du skrev 'överväldigad' i
tisdags. Samma ord förra månaden runt 18-tiden."

**3. Lättnad på mätdata**
Erbjuder handling som svar på observerat tillstånd. "Puls och HRV pekar
mot att du är slut. Vill du att jag startar något lugnt i Spotify?"

**4. Lättnad på ord**
Möter användaren där hen är utan att coacha. "Du bär något du inte hunnit
säga. Vill du formulera det här, eller bara sitta tyst en stund?"

### Vad Selvra ALDRIG gör

- Coachar mot mål användaren inte satt själv
- Påstår sig veta mer än källor visar
- Bygger streaks, habits, engagement-loops
- Manipulerar för att stanna (love bombing, FOMO, skuld-appeller)
- Diagnostiserar
- Förutspår
- Levererar eget meditations-bibliotek eller CBT-innehåll
- Validerar oprovocerat ("du är så bra!")

### Affärsmodell

Understanding-subscription, inte content-subscription.

- Gratis: läs grundläggande HealthKit + 1-2 källor, samtal med begränsad minne
- Premium: alla källor, fullt minne, SREF-export, Apple Watch-integration
- Pris (intervall, beslutas vid launch): €9-15/månad eller €69-99/år
- Inga in-app-köp för "voice packs" eller "personality"
- Familje-plan möjligen senare

---

## 2. KONSTITUTIONELLA PRINCIPER (icke-förhandlingsbara)

### IF1: Selvra ska aldrig veta mer än användaren

- Varje data-claim käll-attribuerad ("Garmin säger... Apple Health säger... du själv skrev...")
- Ingen tolkning som påstår sig veta vad data egentligen betyder
- Vid otillräcklig data: säg det rakt. "Jag har 2 dagars HealthKit, kan inte se mönster ännu."

### Empirisk substrate-kompass

- Inga nya features utan Carl-dogfood först
- Inga marketing-claims utan empirisk grund
- Inga design-val baserade på "vackert" istället för "fungerar"

### Aldrig manipulation (EU AI Act-compliance)

Enforced i kod via lock-validate, inte hopp på prompt.

```swift
let forbiddenPatterns = [
    "iLoveYou", "missYou", "worriedAboutYou",
    "youAreAmazing", "youCanDoIt", "iBelieveInYou",
    "dontLeave", "comeBackTomorrow",
    "youShould", "youMust", "youNeedTo",
    "nextWeekWillBe", "youWillFeel",
    "youHaveDiagnosis"
]

let requiredWhenObservation = ["sourceAttribution"]
```

Validera mot output innan användaren ser det. Vid brott: regenerera.
Vid upprepad brott: fallback-text + logg.

### EU-suverän infrastruktur

- LLM-provider: Mistral (Paris) primär, Anthropic EU-tier med DPA fallback
- Aldrig OpenAI consumer-tier
- Backend hosting: Hetzner / Scaleway / OVHcloud
- Vercel för landing om EU-region tvingas
- Inga sub-processors utanför EU utan explicit dokumentation

### Patient-ägd portabilitet

- SREF v1 export från dag 1 (även för Carl-dogfood)
- Användaren ser exakt vad Selvra minns
- Användaren kan radera fakta, källor, samtal, hela kontot
- Inga dark patterns för att försvåra avregistrering

---

## 3. TEKNISK ARKITEKTUR

### Stack

**iOS-app:**
- Swift 5.10+ / SwiftUI för UI
- iOS 17+ target (HealthKit-features kräver senare versioner för vissa metrics)
- Xcode 15+
- Apple Sign-in för auth
- HealthKit för kropp-data
- EventKit för kalender
- Native push-notifications (ej aktiveras i v1 — constitutional risk)
- StoreKit 2 för subscriptions

**Backend:**
- Bevaras från befintlig selvra-app (60% är platform-agnostic)
- `extractFactsFromTurn`, `lock-validate`, `process-user-turn` fungerar oförändrade
- DB-schema oförändrat (PostgreSQL)
- API-routes omvandlas från Next.js Server Actions till REST-spec för iOS-konsumtion
- Hosting: Railway eller Hetzner (EU-region verifierad)

**LLM:**
- Mistral Large via API (EU-hostat)
- Streaming via SSE eller Mistral-egen streaming
- Constitutional validation via lock-validate innan stream når iOS

### Repos

- Nytt: `selvra-ios` (separat repo, Swift)
- Bevarat: `selvra-app` (backend förblir, frontend arkiveras)
- Webb-frontend arkiveras till: `archive/web-consumer-2026-05-15`-branch i selvra-app

### Data-källor v1

**Fas 1 (vecka 4-12):**
1. HealthKit — sömn, hjärtfrekvens, HRV, stegmängd, aktivitet (native iOS, ingen OAuth)
2. EventKit — kalender-events (native iOS)
3. Användarens ord — chat-input, sparas som `conversation_facts`

**Fas 2 (vecka 13-20, post-TestFlight-feedback):**
4. Garmin — befintlig OAuth via backend
5. Strava — befintlig OAuth via backend
6. Spotify — befintlig OAuth via backend

**Fas 3 (post-launch):**
7. Apple Music (om hög efterfrågan)
8. Oura, Whoop (om hög efterfrågan)

---

## 4. PRODUKT-FLÖDE

### Onboarding (noll-friktion)

1. Apple Sign-in — en tap
2. Välkomstskärm — "Selvra. Spegling och lättnad. På mätdata och ord."
3. Källor — HealthKit och Kalender begärs med native iOS-permissions
4. Källor (frivilliga) — Garmin/Strava/Spotify visas som "lägg till senare"
5. Direkt till samtal

Ingen intention-skrivning. Ingen tvingande inledning. Inget "klart"-firande.

Selvra hälsar:

> "Hej. Jag är Selvra. Jag läser det du redan har och hjälper dig se mönster — om du vill. Just nu har jag HealthKit och kalendern. Vill du skriva något, eller koppla fler källor?"

### Samtal — kärnupplevelsen

Användaren öppnar appen. Möts av samtal (senaste tråd fortsätter eller ny startas).

Selvra svarar med:

**1. Käll-attribuerad observation där relevant**

```
text: "Du har sovit 5h 40min i snitt senaste 5 dagarna.
       Din baseline är 7h 15min. HRV ligger på 38 (baseline 45)."
sources: [
  { name: "Apple Health", claim: "5h 40min snitt senaste 5 dagarna" },
  { name: "Apple Health", claim: "baseline 7h 15min" },
  { name: "Apple Health", claim: "HRV 38, baseline 45" }
]
```

UI renderar källor som klickbara badges som öppnar minnesvy filtrerad på den källan.

**2. Reflekterande frågor (inte instruktioner)**

> "Du nämnde i april att stress kommer från oklara förväntningar. Calendar visar 23 möten denna vecka mot ditt snitt 12. Är förväntningarna tydliga?"

**3. Erbjudande av handling när relevant**

> "Vill du att jag startar något lugnt i Spotify, eller bara sitter tyst med dig?"

Tap på "Spotify" öppnar Spotify med anpassad spellista. Tap på "tyst" → Selvra bekräftar och låter samtalet pausa.

**4. Erkänner gränser**

> "Jag har 3 dagar HealthKit, kan inte se längre mönster ännu."
> "Jag har ingen källa för det. Det är något bara du vet."

### Minne — transparens

`/minne` (i appen, ej webb) visar:

**1. Vad du sagt** — user-stated facts extraherade från samtals-turns
- Datum, citat eller parafras, källa-tråd (klickbar)
- Knapp: "ta bort detta minne"

**2. Vad dina källor visat** — observationer från kopplade källor
- Källa-namn, vad rapporterat, när
- Knapp: "koppla från källa"

**3. Explicita minnen** — användar-skrivna fakta ("jag heter Carl", "jag är T1-diabetiker")

### Lättnads-handlingar

Selvra föreslår handling när data + kontext motiverar. Levererar inte själv innehåll — aktiverar befintliga källor.

- Lugnande musik: öppnar Spotify med kontextuell spellista (lugnt om trött, energiskt om låg)
- Naturljud: öppnar Spotify med naturljud-spellista
- Tystnad: Selvra håller tyst, samtal pausas tills användaren skriver
- Formulering: "Vill du formulera vad du behöver säga till X utan att jag sparar?" — privat-mode-samtal som inte extraheras till facts
- Andning: native iOS Breathe-app-genväg via Apple Watch
- Vila: "Lägg telefonen. Sätt på Sleep Focus. Jag är här imorgon."

Inget av detta är coaching. Det är operationell lättnad baserad på observerat tillstånd.

### Export

`/export` i appen:
- SREF v1 JSON (komplett representation)
- AI-context export (för användning med annan AI)
- Per-tråd-export (markdown)

Allt fungerar offline (data finns lokalt i tillägg till backend).

---

## 5. RIVNINGS- OCH BYGG-SEKVENS

### Vecka 1 (16-23 maj 2026): Frysning + förberedelse

Claude Code utför:

1. Skapa `~/selvra-app/.gsd/SELVRA_IOS_V1_BUILD_PLAN_2026-05-16.md` med detta dokument
2. Frys webb-consumer-arbetet i selvra-app:
   - Skapa branch `archive/web-consumer-2026-05-15`
   - Commit nuvarande state av webb-routes
   - Master bevarar bara backend + API-spec
3. Omarbeta landing-sida på `selvra-app.vercel.app` till minimal pre-launch:
   ```
   H1: Selvra
   Subtitle: Spegling och lättnad. På mätdata och ord.

   Body: Selvra läser kroppen, kalendern, sömnen, dina ord — och
   säger vad den ser. Källa-attribuerat. Patient-ägt. Europeiskt byggt.

   När du behöver vila finns plats för det. När du behöver förstå
   finns underlag. Inget coaching. Ingen manipulation. Bara det som
   är där.

   iOS-app, launch H2 2026.

   [Lämna mail för uppdatering]
   ```
   Allt brev-paradigm-copy rivs. En sida, klar position, en CTA.
4. Dokumentera Carl-dogfood Stillra som nästa-steg-läge i `~/stillra-server-master/STILLRA_NEXT_STEP_STATUS_2026-05-16.md`:
   - Stillra v2 är klinisk-grade pipeline pilot-redo
   - Nästa milstolpe: Carls egen läkarbesök med doctor-brief som klinisk validations-event
   - Aktiv pilot-rekrytering pausad tills post-validering
   - Kari informeras om omfokusering

### Vecka 2-3: AB-väntan, förberedelse

AB-aktivering pågår. Resend-konto registreras under bolagsnamnet när AB klar. OAuth-credentials registreras med organisationsnummer.

Claude Code utför:
1. Backend-API-spec dokumenteras — vad iOS-appen ska anropa
2. Mistral API-integration testas från backend
3. EU-hosting-verifikation — Vercel-region, Railway-region, sub-processors-lista
4. Apple Developer Program-registrering förbereds (kräver organisationsnummer från AB)

### Vecka 4: iOS-projekt setup

1. Skapa `selvra-ios` repo
2. Xcode-projekt med SwiftUI
3. iOS 17+ target, Swift 5.10+
4. Bundle ID: `io.selvra.app` eller liknande
5. Första bygget — empty app som visar "Selvra" på skärmen
6. Test Claude Code-leverage på Swift — bygg en enkel knapp som anropar backend

### Vecka 5-8: Onboarding + Auth + Backend-integration

- Apple Sign-in flow — magic-link-stil men native
- Backend-koppling — API-anrop fungerar mot befintlig selvra-app backend
- Välkomst-skärm
- Källor-skärm — toggle för HealthKit och Kalender
- Permissions-flow — native iOS HealthKit + EventKit-permissions

### Vecka 9-12: Samtal + minne + lättnads-handlingar

- Chat-UI — SwiftUI-implementation
- Streaming från Mistral — token-by-token via backend-proxy
- Käll-attribuering — badges som klickbara öppnar minnesvy
- Minne-vy — tre sektioner som specificerat
- Lättnads-handlingar — Spotify-öppning, tystnad, Apple Watch Breathe

### Vecka 13-16: Internal TestFlight

- TestFlight setup (kräver Apple Developer Program = AB-aktivt)
- Carl + 3-5 betatestare invited
- Daglig dogfood av Carl själv
- Bug-fixes och refinement
- Constitutional enforcement-validering — granska samtals-output mot forbidden patterns

### Vecka 17-20: Public TestFlight

- Bredare TestFlight (~50 användare)
- Riktig E2E-validation
- App Store-listing förberedelse
- App Store Review Guidelines-genomgång

### Vecka 21-24 (november 2026): App Store-launch eller iteration

Beslut baseras på TestFlight-data:
- Om retention är stark + användare berättar om appen: App Store-launch
- Om retention är svag: iterera baserat på feedback, försenat launch

### Stillra-paralellt (hela perioden)

Carl-dogfood fortsätter. Nästa läkarbesök är klinisk validations-event. Post-validering: utvärdera om aktiv pilot-rekrytering aktiveras.

---

## 6. SVENSKA SOM PRIMÄRT SPRÅK

v1 levereras på svenska. Engelsk version är post-launch-prioritet, inte v1.

Skäl:
- Carl och primära beta-testare är svensktalande
- Svenska nyanser i "spegling", "lättnad", "kropp", "tystnad" är viktiga
- Svensk konstitutionell substrate (EU-suveränitet) börjar med svensk marknad
- Norden + Europa-expansion senare när svenska version är låst

LLM-prompt-engineering ska säkerställa svenska output med rätt ton. Mistral klarar svenska väl.

---

## 7. KONSTITUTIONELLA KONTROLL-POSTER

Efter varje milestone-vecka, granska:

**1. Manipulerar Selvra på något sätt?**
Granska senaste 20 turns mot forbidden patterns. Vid träff: regression-fixa.

**2. Är all data inom EU?**
Verifiera Mistral, hosting, sub-processors.

**3. Är käll-attribuering konsekvent?**
Varje data-claim måste ha källa. Granska tester.

**4. Kan användaren ta bort allt?**
Verifiera delete-account, delete-thread, delete-fact, source-disconnect end-to-end.

**5. Är SREF-export komplett?**
Verifiera att export inkluderar alla facts, threads, turns, metadata.

**6. Är Stillra-prioritet respekterad?**
Granska att Stillras kod inte tas isär eller försämras. Stillra v2 förblir pilot-redo.

**7. Är Carl själv okej?**
Granska TIR, sömn, motion, relationer. Om kropp signalerar gränser: pausa.

---

## 8. RISK-MITIGATION

### Risk 1: Carl kan inte Swift

**Mitigation:**
- Claude Code-leverage på Swift testas i vecka 4
- Vid problem: paus och granska om alternativ (React Native, Capacitor) är aktuella
- Apple Developer-dokumentation läses parallellt med Claude Code-iteration
- YH-utbildning kan ge handledning post-augusti 2027

### Risk 2: HealthKit-permissions-friction

**Mitigation:**
- Onboarding gör HealthKit valfritt (kan hoppas över)
- Selvra fungerar med bara kalender + ord initialt
- HealthKit-värde kommuniceras tydligt i onboarding

### Risk 3: Mistral kvalitet-issues på svenska

**Mitigation:**
- Test Mistral Large mot svenska prompts i vecka 2-3 innan iOS-bygge startar
- Anthropic EU-tier som fallback om Mistral inte räcker
- Prompt-engineering med explicit svenska-instruktioner

### Risk 4: App Store-review avslår

**Mitigation:**
- App Store Review Guidelines genomgång i vecka 17
- Inga features som strider mot Apple-policys
- Privacy-policy och data-handling tydligt dokumenterat
- Subscription-flow följer StoreKit 2-standard

### Risk 5: Konkurrent (Apple, OpenAI, Anthropic) bygger samma sak

**Mitigation:**
- Selvra differentierar genom multi-source levd minne + käll-attribuering + EU-suveränitet
- Apple bygger inte EU-suverän anti-manipulation-AI
- Open-source delar av SREF-protokollet som community-bygge
- Tidsfönster 12-24 månader innan stora aktörer adresserar EU AI Act-compliance

### Risk 6: Stillra fortfarande väntar på AB när iOS-bygget börjar

**Mitigation:**
- iOS-bygget startar oavsett — Apple Developer Program registreras när AB klar (vecka 2-3)
- TestFlight fungerar utan App Store-publishing (vecka 13+ är OK)
- Hardcoded subject-mode för dogfood om AB försenas

---

## 9. METRIK OCH MÄTPUNKTER

### Vecka 12 (efter samtals-vy klar)

- Carl använder Selvra ≥3 gånger per vecka
- Carl återkommer till samma tråd (testar minnet)
- Carl kan exportera SREF och se vad som finns där
- Källa-attribuering syns klickbart i UI

### Vecka 16 (efter internal TestFlight)

- 3-5 betatestare aktiva
- Retention efter 7 dagar
- Antal samtal per användare per vecka
- Constitutional violations = 0 (om >0, regression-fixa)

### Vecka 20 (efter public TestFlight)

- ~50 användare aktiva
- 30-dagars retention
- NPS efter 30 dagar
- Specifika observationer betatestare nämner som "värdefulla"

### Vecka 24 (App Store-launch-beslut)

**GO-kriterier:**
- ≥30% retention efter 30 dagar (Carl + 50 betatestare i snitt)
- ≥5 betatestare berättar spontant om appen
- ≥10 säger de skulle betala €9-15/månad
- Apple App Store Review godkänd
- Constitutional violations = 0

**NO-GO:** fortsätt iterera, försenat launch tills kriterier uppfylls.

---

## 10. VAD CLAUDE CODE SKA GÖRA OMEDELBART

### Idag (16 maj 2026):

1. Skapa `~/selvra-app/.gsd/SELVRA_IOS_V1_BUILD_PLAN_2026-05-16.md` med detta dokument
2. Lägg referens i `CLAUDE.md` under "Aktiva strategiska spår":
   - Selvra konsument iOS v1 (primär aktiv utveckling)
   - Stillra v2 nästa-steg-läge (dogfood + klinisk validations-event)
3. Skapa branch `archive/web-consumer-2026-05-15` i selvra-app:
   - Commit nuvarande state av webb-routes
   - Push till origin
   - Master ska bara behålla backend + API-spec
4. Omarbeta landing-sida till minimal pre-launch enligt §5 vecka 1
5. Skapa `~/stillra-server-master/STILLRA_NEXT_STEP_STATUS_2026-05-16.md` dokumenterar Stillras position

### Vecka 2-3:

AB-aktiveringen pågår. Claude Code förbereder:
- API-spec-dokumentation för iOS-konsumtion
- Mistral-integration testas från backend
- EU-hosting-verifikation
- Apple Developer Program-registrering förbereds

### Vecka 4 (efter AB-aktivering):

iOS-projekt setup startar enligt §5 vecka 4.

---

## 11. AVSLUTANDE KONSTITUTIONELL ANKARSPUNKT

Detta är vad Selvra konsument v1 är:

> En iOS-native AI som ger spegling och lättnad — på mätdata och ord. Källa-attribuerad. Patient-ägd. EU-suverän. Aldrig manipulerande.

Detta är vad Selvra konsument v1 INTE är:

> Mindfulness-app. Tracking-dashboard. AI-vän som låtsas. Coachande wellness-verktyg. Content-bibliotek. Habit-tracker. Multi-vertikal-paraply.

Selvra är fjärde kategorin efter Aura, Apple Health och Replika. Den finns inte ännu. Vi bygger den.

Om något under bygget föreslår tillägg som divergerar från fjärde-kategori-positionen: stopp. Re-granska mot detta dokument.

Selvra v1 ska kunna pitchas i en mening:

> "Spegling och lättnad. På mätdata och ord. Det är framtiden."

Det är linjen. Allt annat tjänar den eller rivs.
