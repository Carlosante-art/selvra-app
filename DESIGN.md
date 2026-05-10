# DESIGN.md — selvra-app v1

Canonical lock-dokument för selvra-appens design. Frozen 2026-05-10 (kan
revideras med explicit pushback + ny lock).

Selvra-protokollet lever på `~/selvra/` och är reflektions-väljarens
underliggande representation. Detta dokument beskriver **konsument-appen**
ovanpå protokollet.

---

## 1. Produktdoktrin

Selvra-appen är reflektions-väljaren ovanpå Selvra-protokollet. Användaren
togglar källor; Selvra läser där hon redan finns och levererar
**reflektioner** — inte dashboards, inte coach-råd, inte memory-recall.

**Gap-tesen (kärnan):** Produkten är gapet mellan tre saker:

1. Vad användaren *säger att hon vill* (intentioner)
2. Vad användaren *säger att hon gör* (self-report)
3. Vad datan *visar att hon faktiskt gör* (källor)

Reflektionen formas av kontexten. Samma motor, samma representation, olika
reflektioner.

**Tesen under allt:** I AI-eran har människor inte ett *minnes-problem*, de
har ett *förståelse-problem*. Data finns överallt, sammanhang finns
ingenstans.

> Människan har rätt att veta sig själv. Selvra är det som gör det möjligt.

### Vad appen INTE är

- Inte en dashboard
- Inte en AI-coach
- Inte en memory-recall-produkt
- Inte en "digital twin" / "life operating system"
- Inte ett verktyg som "samlar all din data"
- Inte ett socialt nätverk

### Anti-patterns att undvika

- Black Mirror / surveillance / creepy positionering
- "AI som känner dig bättre än du själv"
- Övervaknings-narrativ av något slag
- Coach-språk ("du borde göra X")
- Generisk wellness-app-positionering

### Ordvalet "reflektion" — anti-positionering

Tre distinktioner som ordet *reflektion* bär och som skiljer Selvra från
AI-memory-konkurrenter:

1. **"Brief" är vad någon annan ger dig** (chef, analytiker). *Reflektion*
   är något som tillhör dig. Användar-ägd ner på ordnivå.

2. **Anti-positionering mot konkurrenter:** Engramme har "memory", Mem0 har
   "memories", Personal AI har "PLM" — tekniska eller jargong-ord. Selvra
   har "reflektion" — mänskligt, ägt, existerar i mänsklig erfarenhet sedan
   tusentals år, nu något AI kan göra strukturerat och longitudinellt.

3. **Strukturella implikationer** som matchar redan-låsta positioner:
   - Reflektion är *passiv tills efterfrågad* → matchar designval 7
     (ingen prescriptive notification, hon kommer till Selvra)
   - Reflektion är *subjektiv-kompatibel* → matchar designval 3 (observation
     OK, prescription inte) + drift-mekaniken där gapet är värdet, inte
     att Selvra har rätt

### Canonical framing (copy-fraser)

- *"Reflektion, inte spegel."*
- *"Du väljer själv vilka delar av dig du vill förstå bättre."*
- *"Selvra hjälper dig se mönstren mellan dina källor."*
- *"Agency, inte extraction."*
- *"Människan har rätt att veta sig själv."*
- *"Hon journalar redan i huvudet eller till ChatGPT — Selvra erbjuder bara
  en yta som dubblar som self-report-källa."*
- *"En reflektion är som ett brev till henne från någon som har observerat
  hennes vecka."*

---

## 2. Source-adapter-arkitektur

Selvra-appen bygger inte EGNA integrationer till varje källa. Den bygger ett
**adapter-pattern** där varje integration-yta är en isolerad adapter som
implementerar samma interface mot Selvra-protokollet.

```
Adapter-host
├── TerraAdapter            kropp/wearables (500+ providers via Terra)
├── GoogleAdapter           Gmail + Calendar + Drive + Photos
├── MicrosoftAdapter        Outlook + Calendar + OneDrive
├── AppleAdapter            Apple Health + Photos + Calendar
├── SpotifyAdapter
├── AppleMusicAdapter
├── NotionAdapter
├── TodoistAdapter
├── AIConversationAdapter   ChatGPT / Claude / Gemini imports
├── ElefantAdapter          lokal screen-tracker (Carl som första användare)
└── ManualImportAdapter     WhatsApp-exports, etc.
```

Varje adapter är isolerat arbete. En adapter som kraschar dödar inte de
andra.

### Build-ordning

1. **Terra** för kropp (löser 500+ wearable-providers via en integration)
2. **Google OAuth** för Gmail + Calendar
3. **Spotify** för musik
4. **AI-konversation manuell import** (Lager 3 self-report)
5. **Elefant** för digital aktivitet
6. **Apple Music, Microsoft, Notion, ...** — när behov uppstår

### Moat-positionering

**Integration är kostnad, inte värde.** Terra löste det redan; andra
startups löser fler domäner. Selvra tävlar inte på integration-bredd.

Moat är vad som händer **efter aggregation:**

- Constitutional reasoning (10 principer i protokollet)
- Drift detection
- Provenance på varje insight
- Reflektioner (gap-detektering)
- SREF-portabilitet
- Per-source_ai_id

### Källa-agnostisk princip

Protokollet ska aldrig vara medveten om en specifik källa. Terra,
direkt-OAuth, Solid Pod, manual-import — alla utgör samma typ av input via
adapter-interface.

---

## 3. Reflektions-format

### Designval (10 låsta principer)

1. **Käll-attribuerade observationer, aldrig judgement.** Inte *"du tränade
   bara 1 gång"*. Istället *"Garmin visade 1 träningspass. Din intention
   sade 4."* Källan är subjektet i meningen, inte du.

2. **Andra-person passiv om dig.** "Du" används om dina deklarerade
   intentioner och dina egna ord. Aldrig *"du gjorde dåligt"* eller *"du
   borde"*.

3. **Mönster-detektering OK, prescription inte.** *"Veckor under 7h sömn ger
   64% i target, över ger 73%"* är observation. *"Du borde sova mer"* är
   coach. Selvra får göra det första, aldrig det andra.

4. **Högst en fråga per reflektion, ofta ingen.** Placerad där observationen
   kräver det, inte tvingad till slutposition. Ren observation utan fråga
   är default när inget gap är värt att kalibrera.

5. **Källor i footer, ej front.** Inte logos. Bara text. Provenance utan
   dashboard-känsla.

6. **Vecka som default time-scale.** Leverans bunden till intention från
   Lager 1 om satt, kalender-event från Terra om kopplat, söndag-fallback
   om varken. Adaptiv leverans Phase 2.

7. **Tillgänglighets-signal acceptabel:** opt-in (default off), max veckovis,
   faktabaserad (*"Veckans reflektion är klar."*). Inga prescriptive
   notifications, inga retention-prompts, inga badge-räkneverk.

8. **En reflektion aktiv åt gången, ej feed.** Föregående arkiverade men
   inte stackade. Selvra producerar inte content för konsumtion.

9. **Asymmetri, ej chat.** Brev-metaforen: Selvra producerar ett brev från
   någon som observerat veckan. Hon kan svara, annotera, lägga till tankar
   — men brevet står kvar som dokument. Hon skriver i marginalen, brevet
   ändras inte.

10. **Tankar-yta alltid tillgänglig.** Senaste reflektion visar tillkomna
    tankar under sig (efter källor-footer). Arkiverade reflektioner är
    frusna read-only-dokument.

### Exempel-reflektion

```
Speglingar från vecka 19

Dexcom visade tid-i-target på 68% den här veckan. Din intention från
mars: 75%. Tidigare veckors snitt: 71%. Nedgången var koncentrerad till
tisdag och fredag.

Garmin visade 1 träningspass. Din intention sade 4 i veckan. Du skrev
till Selvra på torsdagen: "har varit för trött för att gå ut." Apple
Health visade snitt på 6h 12min sömn — under din egen markering "minst 7h."

Två veckor i rad har sömn fallit under 7h. Dina senaste sju veckors
tid-i-target visar mönster: veckor under 7h sömn ger i snitt 64% i target,
veckor över ger 73%.

— Är länken mellan sömnen och tid-i-target något du vill utforska, eller
var den här veckan en avvikelse?

Källor: Dexcom · Garmin · Apple Health · intentioner från 2026-03-14 ·
självrapport 2026-05-08
```

---

## 4. Self-report-arkitektur

Tre lager av self-report, olika friktion. **Konstitutionellt i v1** — utan
self-report är Selvra reducerat till Terra-aggregator + AI ovanpå, vilket
inte är tesen.

### Lager 1 — Intentioner vid onboarding (hög friktion, en gång)

Användaren sätter 3–5 intentioner som hon faktiskt bryr sig om. Sparas som
events med **temporal validity**, inte permanent state. Selvra vet att de
är från X datum och kan time-decaya.

En av intentionerna är leverans-tajming (*"när vill du reflektera?"*).

### Lager 2 — Dialog-yta (låg friktion, löpande)

Reflektionen är dialogisk, inte broadcast. Selvra observerar gap → ställer
specifik fråga → hon svarar med en mening. Self-report inbäddat i
reflektionen själv.

**Disciplin: max en fråga per reflektion, ofta ingen.** Default är
observation-triggered. **User-initiated freeform** är alltid tillgängligt
på samma yta — hon kan skriva en tanke när hon vill, utan att Selvra
frågat.

### Lager 3 — AI-konversation-import (noll friktion, ambient)

Hon pratar redan med ChatGPT/Claude om sina mål, sina veckor, sin kropp.
Den datan finns. Via MCP-yta eller export-import blir konversationer
self-report som **biprodukt** av befintligt liv.

**v1-disciplin:** Lager 3 är differentiering, inte tillgänglighet. Bygger
**selektiv import** (tagga konversationer "ja, lägg till" innan import,
eller filtrera via review-flow). Mainstream-användare får gap-tesen från
Lager 1+2 ensamma; Lager 3 är acceleration för power-users.

### Vad self-report INTE är

- Inga weekly check-ins
- Inga formulär
- Inga "hur mår du idag på en skala 1–10"
- Inga prescriptive prompts

---

## 5. Onboarding-flow (5 steg)

**Reviderat 2026-05-10** efter moat-doktrin: moat-substans (intentioner)
före cost (källor).

### Steg 1 — Landing

Brev-metaforen i landing, exempel-reflektion direkt, anti-positionering
explicit, EU-sovereignty + ownership som första-substantivt.

### Steg 2 — Identitet

Magic-link via e-post. Inget lösenord. *"För att spara representationen."*
Inget "create account".

### Steg 3 — Intentioner (moat-substans)

3–5 stycken, free-text. Exempel illustrativa, inte picklist. Hon äger sitt
eget språk. Exempel inkluderar icke-mätbar intention (*"Inte titta på
telefon första timmen på morgonen"*) för att signalera att Selvra inte är
dashboard.

En av intentionerna är leverans-tajming:
- ( ) Söndag morgon
- ( ) Fredag eftermiddag
- ( ) Inför specifika events
- ( ) Annan rytm

### Steg 4 — Källor (cost, lättviktigt)

Terra-grupperat i tre breda kategorier. Knapptryck per kategori öppnar
Terras kopplings-vy. Liten yta, snabbt flöde. Ingen gatekeeping — hon kan
fortsätta utan att koppla något.

### Steg 5 — Signal opt-in + klart

Default **off** på signal. Explicit deklaration av vad signal *inte* gör.
Klart-skärmen inbjuder till första tanke (Lager 2 freeform direkt, även
utan reflektion att svara på).

---

## 6. Form factor + tech

- **Web responsivt först.** Djupläsning är primär use case. iPad/desktop
  primär ytan; mobil-browser sekundär.
- **Native iOS + ambient korta reflektioner som Phase 2** efter web
  validerat. PWA-på-iOS är halv-trasigt → bygg native senare, inte
  halv-form nu.

### Stack

- **Next.js 16** (App Router, Server Components)
- **TypeScript**
- **Tailwind v4**
- **Hosting:** Railway (samma som Selvra-protokoll, SpecSync, Motiq)
- **Protokoll-kommunikation:** HTTP REST mot
  `selvra-production.up.railway.app` (Selvra v0.2.1 HTTP-fasaden, deployad
  2026-05-06)

---

## 7. Var Selvra-app står ekosystem-mässigt

- **Selvra-protokollet** (`~/selvra/`): event-sourced representation,
  10 principer, multi-provider router. Selvra-app är **en konsument** av
  protokollet.
- **Vertikalerna** (Stillra för T1D, Motiq för musik, Elefant för intention
  vs handling): instanser av reflektions-mekanismen. **Inte aktivt i v1
  av selvra-app** — vertikal-arkitekturen är post-v1-fråga.
- **Andra konsumenter** av protokollet kan finnas (Stillra-app, framtida
  vertikal-skal). Selvra-appen är **reflektions-väljar-ytan** specifikt.

---

## Forward-compat-kontrakt (vad som måste-stabilt)

- Gap-tesen (vill/säger/gör som tre axlar)
- Brev-metaforen för reflektions-asymmetri
- Self-report som biprodukt, inte arbete
- Käll-attribuerad observation (aldrig judgement)
- Adapter-pattern för alla integrationer
- Källa-agnostisk protokoll-kommunikation
- Användar-ägd representation (exporterbar, raderbar, EU-deployed)

Pushback på något av detta kräver explicit re-locking i konversation.
