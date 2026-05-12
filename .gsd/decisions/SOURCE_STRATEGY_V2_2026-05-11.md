# Selvra Source Strategy v2 — Reviderad integrationsplan

**Canonical source-strategi från 2026-05-12.** Låst som strategi-dokument
för framtida integration-arbete. Tidigare source-doc:s i denna mapp är
markerade som SUPERSEDED.

**Supersederar:**
- `SOURCE_STRATEGY_PIVOT_2026-05-11.md` (Terra → Open Wearables-pivot står
  fast som arkitektur-beslut, men prioritetsordning ersätts av denna)
- `OPEN_WEARABLES_FAS_2-5_2026-05-11.md` (deploy-stegen kvarstår som
  referens, men Open Wearables flyttas till Fas 3 — inte Fas 2 längre)

---

**Status:** Reviderad efter deep search om vad konsumenter faktiskt använder och har OAuth-access till. Ersätter tidigare source-listor i ~/selvra-app/.gsd/decisions/.

**Kontext:** Streamlined-v1 pre-AB är klart. Tre OAuth-scaffolds (Magic-link, Google, Strava) väntar wiring. AB aktiveras inom dagar via Karis vilande bolag (omvandlas till KJ Labs AB). Brev v0.2 har dokumenterad cross-layer-observation. Source-strategin behöver låsas innan wiring-fasen startar.

---

## Designprinciper för source-prioritering

Tre konstitutionella regler som styr vad som integreras och i vilken ordning:

**1. Selvras tes: "Vi läser vad du redan gör."**
En källa är värdefull om den fångar något användaren **redan producerar**. Inte något som kräver ny aktivitet. Detta är skälet att Headspace prioriteras lågt (kräver att användaren mediterar mer) medan Notion prioriteras högt (användaren skriver redan där).

**2. Signal-rikedom över volym.**
Bredare aggregation över fler källor är inte automatiskt bättre. En rik källa (Dexcom med 5000+ datapunkter/vecka) ger mer än fem tunna källor. Prioritera djup-signal över numerär.

**3. Tillgänglighet för privatpersoner.**
Källor som kräver enterprise-broker-konton eller AB-godkännanden filtreras ut eller deferas. Garmin, Terra, Headspace via Spike — alla väntar på AB-bekräftelse och blir lågprioriterade om friktion är hög.

---

## Fem livsdomäner Selvra ska täcka

Selvra observerar människan över fem distinkta livsdomäner. Varje domän har primära och sekundära källor. Användare väljer själva vilka som kopplas — Selvra fungerar med minimum en domän, optimum alla fem.

### Domän 1: Kropp och fysiologi
*Vad kroppen visar.*

- **Primär:** Dexcom CGM (via Stillra Path C — klart)
- **Sekundär:** Apple Health (via Expo native, post-v1)
- **Tertiär:** Garmin (via Open Wearables, väntar AB + dev-program)
- **Senare:** Whoop, Oura, Polar via samma broker

### Domän 2: Tid och planering
*Vad kalendern visar du tänkt göra.*

- **Primär:** Google Calendar (Google OAuth — scaffold klar)
- **Sekundär:** Apple Calendar (via CalDAV om relevant)

### Domän 3: Uppmärksamhet och kommunikation
*Vart din uppmärksamhet går.*

- **Primär:** Gmail metadata (Google OAuth — scaffold klar, från-rader, ämnen, frekvens, INTE innehåll)
- **Sekundär:** Calendar mötes-frekvens (samma OAuth som ovan)

### Domän 4: Emotion och konsumtion
*Vad du väljer att lyssna på, läsa, titta på.*

- **Primär:** Spotify (Spotify OAuth — scaffold klar)
- **Sekundär:** Readwise (för läsning/highlights, power-user)
- **Tertiär:** Apple Music, Letterboxd

### Domän 5: Inre dialog och reflektion
*Vad du själv tänker och formulerar.*

- **Primär:** Lager 1 (intentioner) — klart
- **Primär:** Lager 2 (tankar i selvra-app) — klart
- **Sekundär:** Notion (Notion API, OAuth, power-user-rich)
- **Tertiär:** AI-konversation-import (Lager 3, ChatGPT/Claude/Gemini-export)

### Domän 6 (kandidat): Aktivitet och rörelse
*Vad kroppen faktiskt gjorde.*

- **Primär:** Strava (Strava OAuth — scaffold klar, fångar även Garmin-användare som synkar dit)
- **Sekundär:** Garmin direkt (post-AB + dev-program)

---

## Integration-prioritering — tre faser

### Fas 1 (omedelbart post-AB-wiring, dagar)

Källor som inte kräver något utöver AB och har scaffolds klara:

1. **Magic-link auth (Resend)** — wiring
2. **Google Calendar** — wira upp existerande OAuth-scaffold
3. **Gmail metadata** — samma Google-consent-screen
4. **Spotify** — wira upp existerande OAuth-scaffold
5. **Strava** — wira upp existerande OAuth-scaffold (täcker Garmin-användare som synkar)

**Resultat:** Selvra läser fem livsdomäner aktivt. Brev v0.3 kan generera mot fullständig data. Tesen testas.

### Fas 2 (post-brev-v0.3-validering, veckor)

Källor som lägger till djup men inte är blockers:

6. **Notion API** — OAuth, privatpersoner accepteras direkt. Lätt integration. **Mycket värde för segment 1 (medvetna självobservatörer).** Fångar deras rikaste själv-rapport-data.
7. **Readwise API** — lätt integration. Hidden gem för power-users. Aggregerar läsning från Kindle, Pocket, Instapaper. Signalvärde mot målgrupp högt.
8. **AI-konversation-import UX** — Lager 3, ingen extern API. Filuppladdning från ChatGPT/Claude/Gemini-export. Selektiv import-UX är icke-trivialt men byggdes som scaffold under streamlined-v1.

**Resultat:** Selvra täcker även Notion-skrivande och läsning. Rikare cross-layer-observation möjlig.

### Fas 3 (post-v1-validering, månader)

Källor som kräver större investering eller väntar regulatorisk friktion:

9. **Open Wearables + Garmin Developer Program-ansökan** — när formuläret öppnar igen. Träning + sömn + HRV som direkta källor.
10. **Apple Health via Expo native** (eller via wearable-broker) — central för iOS-mainstream. Single point of access till 20+ källor som flödar genom Apple Health. Värt mycket men kräver Expo-rewrite eller Terra/Spike-prenumeration.
11. **Google Maps Timeline / location-data** — försiktigt, opt-in, via Takeout-export först eller native iOS. Privacy-känsligt men rik signal.

**Resultat:** Selvra konkurrerar mainstream-Apple-användare. Wearable-bredd. Location-mönster.

---

## Vad som explicit defereras eller avvisas

**Defereras tills marknad bekräftar:**
- **Headspace via Spike** — tunn datapunkt, kräver enterprise-broker. Selvra adresserar inte "meditation-frekvens" som primär observation. Skip för v1 och v1.1.
- **MyFitnessPal/Cronometer** — kost-data är värdefullt men API:er är enterprise. Skippa tills användarbas explicit ber om det.
- **Last.fm/scrobbling** — om Spotify räcker, ingen anledning att dubbla.
- **Letterboxd/Goodreads** — film/böcker är intressant men låg signal-rikedom jämfört med Notion eller Readwise.

**Aldrig prioriterat utan starka skäl:**
- **Twitter/X API** — paywall sedan 2023, dyrt, signal-fattigt för Selvra.
- **Instagram/TikTok** — privacy-mässigt komplicerat, API restriktiv, fångar inte rätt typ av data.
- **LinkedIn** — restriktiv API, professionell domän som inte matchar Selvras position.
- **Sociala medier generellt** — signal-fattig data, hög privacy-friktion, fel publik.

---

## Två arkitektoniska beslut värda att låsa

### Beslut 1: Notion-integration prioriteras före Apple Health

**Skälen:**
- Notion API är tekniskt enklare (OAuth, ingen native-shell krävs)
- Power-user-segment (segment 1) använder Notion mer aktivt än de bär wearables
- Apple Health kräver Expo-rewrite eller enterprise-broker — båda är större investeringar
- Notion ger rikast själv-rapport-data Selvra kan få utöver Lager 2

Apple Health kommer senare när Expo-native-rewrite är gjord, eller när broker-konto blir motiverat av användarbas.

### Beslut 2: Spotify behålls i Fas 1 trots tidigare diskussion

Det fanns tidigare diskussion om Spotify som soft-defer:bart. Men Spotify är **emotionell-tillstånd-domän** som ingen annan källa täcker. Den är **1 dags arbete för låst scaffold-kod**. Värdet/effort-ratio är hög.

Spotify behålls i Fas 1.

---

## Det större värdet av denna strategi

Selvra har inte alla källor från start. Det är inte fel. Selvras position är *"vi läser vad du redan har"* — och de flesta människor har inte alla 11 källor från detta dokument. De har 3-5.

Det betyder Selvra ska:
- **Fungera utmärkt med få källor** (Brev v0.3 mot minst 3 domäner)
- **Skalas naturligt med fler** (mer data = rikare observationer)
- **Aldrig kräva fullständighet** (lock-position 1: passiv aggregation)

Denna source-strategi är därför **inte krav** för v1-användare. Det är **maximum** Selvra kan läsa över tid när användaren kopplar fler källor.

**Selvras edge är inte att ha flest källor. Det är att läsa de källor användaren har, intelligent.**

---

## Diff mot tidigare strategier (kort)

**Nya integrationer som inte fanns i tidigare planer:**
- Notion API (Fas 2) — privatperson OAuth, läs pages och databases
- Readwise API (Fas 2) — power-user läsnings-aggregator
- Apple Health via Expo (Fas 3) — när Expo-rewrite eller broker beslutas
- Google Maps Timeline / location (Fas 3) — försiktigt, opt-in

**Flyttade prioriteringar:**
- Spotify: behålls i Fas 1 (ej deferas) — emotionell-tillstånd-domän inte täcks av annan källa, scaffold-kod redan finns
- Open Wearables / Garmin: flyttas från Fas 2 till Fas 3 — väntar AB + dev-program approval, inte critical-path
- AI-konversation-import: flyttas från Fas 1 till Fas 2 — selektiv import-UX är icke-trivial, kan vänta

**Explicit avvisade:** Headspace, sociala medier (Twitter/Instagram/TikTok/LinkedIn), MyFitnessPal, Last.fm, Letterboxd/Goodreads.

---

## Vad detta dokument INTE är

- **Inte implementation-plan.** Wiring-fasen post-AB följer denna prioritetsordning men spec:as separat när AB är klart.
- **Inte slutgiltig.** Source-strategi är levande — Fas 3 öppen för revision baserat på v1-validering.
- **Inte teknisk arkitektur.** Open Wearables-pivot + Path C-arkitektur är låst i `SOURCE_STRATEGY_PIVOT_2026-05-11.md` (superseded för prioritering, kvarstår för arkitektur-beslut).
