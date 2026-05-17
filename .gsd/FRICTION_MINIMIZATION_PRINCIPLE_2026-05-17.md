# Friktion-minimering som arkitektonisk constraint

**Datum:** 2026-05-17
**Status:** Konstitutionell princip. Låst innan iOS-implementation.
**Trigger:** Selvra-protokollet är produktionsfärdigt men hela arkitekturen är fortfarande utvecklarvänlig, inte gemene-man-vänlig. För patient-marknaden är friktionen den enda kvarvarande strategiska barriären.

---

## 1. Principen

**För gemene man är varje friktionspunkt utöver tre minuter en tappad användare.**

Detta är inte design-ambition. Det är arkitektonisk constraint. Alla designbeslut för konsument-ytor måste tvingas att tjäna denna princip eller motiveras explicit varför undantag krävs.

---

## 2. Vad "gemene man" betyder

### Konkret målgrupp för Selvra-konsument-yta

- Personer som äger en iPhone eller Android-telefon
- Personer som *möjligen* har en Claude Pro eller ChatGPT Plus-prenumeration, eller kan skaffa en
- Personer som *inte* vet vad MCP är
- Personer som *inte* har redigerat en config-fil någonsin
- Personer som inte vet vad en API-token är
- Personer som har använt Apple Health, Spotify eller liknande appar
- Personer som lever med mätbar livskomplexitet — kronisk sjukdom, neurodivergens, eller bara en längtan efter att förstå sig själv

### Personer som *inte* är målgrupp för konsument-ytan

- Utvecklare som vill ge sin agent minne (de använder Mem0, SuperMemory, OpenMemory)
- Power-users som tycker det är roligt att konfigurera MCP-servrar
- Privatpersoner som värdesätter teknisk kontroll över enkelhet

Designval ska tjäna första gruppen. Andra gruppen är inte fienden — de är *inte målgrupp* för konsument-ytan. De kan använda selvra-protokollet direkt via `/connect/generic`.

---

## 3. Fyra friktions-kategorier

### Kategori A — Friktion vi äger och måste eliminera

- Konto-skapande
- Käll-koppling-flöde
- Anslutning till LLM-klient
- Förståelse av vad som händer

Detta är vårt eget arbete. Det finns ingen ursäkt att lämna friktion här.

### Kategori B — Friktion plattformar äger som vi kan mildra

- OAuth-flöden för tredje-parts-källor (Garmin, Strava, Dexcom)
- HealthKit-permission-dialoger (native iOS)
- Apple/Google Sign-in

Vi kan inte ändra själva dialogerna, men vi kan minimera antalet av dem, förbereda användaren rätt och göra dem så snabba som möjligt.

### Kategori C — Friktion AI-leverantörer äger som vi inte kan lösa

- Att konfigurera MCP-server i Claude/ChatGPT
- Att Claude Pro/ChatGPT Plus krävs för custom connectors
- Att MCP-stöd är ojämnt mellan plattformar

Detta är utanför vår kontroll. Vår uppgift är att **kommunicera tydligt** att friktionen är externa krav, inte vår produkt-design.

### Kategori D — Friktion ekosystemet äger men som kommer mogna

- Native deep-link för MCP-konfiguration finns inte ännu
- Sannolikt löst inom 6-18 månader när Anthropic/OpenAI har incitament att förenkla
- Tills dess: QR-kod + copy-config är bästa tillgängliga lösning

Vi planerar för dagens verklighet och bygger så att vi snabbt kan ta nytta av plattform-förbättringar när de kommer.

---

## 4. Tids-budget för första-gångs-flöde

Från "person öppnar Selvra-appen första gången" till "ChatGPT eller Claude vet om personens representation":

- **Mål:** under 3 minuter
- **Acceptabelt:** under 5 minuter
- **Misslyckande:** över 5 minuter

### Vad tidsbudgeten inkluderar

- Apple Sign-in eller Google Sign-in
- HealthKit-permission-dialog
- Val av AI-klient
- Anslutning till den klienten
- Verifiering att det fungerar

### Vad tidsbudgeten exkluderar

- Användarens väntetid på externa flöden hen redan kommer behöva genomgå ändå (Claude Pro-prenumeration, etc.)

Dessa måste *kommuniceras* tydligt så användaren inte tror friktionen är vår.

---

## 5. Primär källa: HealthKit

Apple Health är den enda källa som inte har OAuth-friktion. Native iOS-permission-dialog. En klick. Klart.

**HealthKit är primär käll-koppling i v1.** Andra källor (Garmin, Strava, Dexcom, Spotify) är *valbara tillägg*, aldrig krav för att komma igång.

Användaren ska kunna börja använda Selvra med enbart HealthKit och få meningsfull representation. Andra källor adderas senare när användaren är invested.

Detta är medvetet val: friktion minimerad initialt, även om det betyder att representationen är tunnare i v1.

**Sekundär effekt:** många appar skriver redan till HealthKit (Garmin Connect-appen, Apple Watch, sömn-tracker-appar, blodglukos-appar via tredje part). En enda HealthKit-permission ger ofta data från flera tjänster utan att användaren behöver koppla dem separat. Detta är en marknadsdynamik vi utnyttjar, inte skapar.

---

## 6. Primär LLM-klient: vad vi rekommenderar

Selvra rekommenderar inte specifika klienter på principnivå — det är låst i [`SELVRA_APP_ROLE_2026-05-17.md`](SELVRA_APP_ROLE_2026-05-17.md). Men för friktion-minimering måste vi välja *en* klient som default-flödet bygger för, eftersom implementations-kostnaden är hög per klient.

### Default-klient för v1

Den med smidigast onboarding-flöde, mätt på:
- Antal steg från Selvra-app till verifierad anslutning
- Plan-krav (gratis-användare blockerade tidigt = friktion)
- Mognadsgrad av MCP-stöd

**Per maj 2026 är det troligen:**
- **Claude Desktop på Mac** (mest moget MCP-stöd, mest dokumenterat), eller
- **Claude mobile på iOS Pro** (smidigast på samma enhet som Selvra-appen)

Övriga klienter (ChatGPT, Cursor, Goose) tillgängliga via `/connect/[client]` men inte i primär-flödet i app.

Detta är taktiskt val, inte konstitutionellt. Det får revideras när landskapet ändras.

---

## 7. Friktion som inte får lösas genom att gömma komplexitet

Friktion-minimering får INTE betyda:

- Gömma att användaren faktiskt ger en LLM tillgång till sin data
- Skippa explicit consent för käll-kopplingar
- Auto-aktivera write-scope utan användarens vetskap
- Förenkla språk till osanning ("ChatGPT lär sig dig" istället för "Selvra ger ChatGPT tillgång till din representation som den läser varje gång")
- Skippa moderator-validering eller käll-attribuering "för enkelhet"

**Friktion-minimering = färre steg, klarare språk, smartare defaults.**
**Inte = transparens-kompromiss, säkerhets-kompromiss, eller manipulation-av-användarens-förståelse.**

Parallell till [`feedback_avsiktlig_friktion_i_konsekvens`](../../.claude/projects/-home-kari/memory/feedback_avsiktlig_friktion_i_konsekvens_2026-05-17.md): kritiska handlingar (ge access, exportera, radera) måste fortfarande ha tydlig bekräftelse. Friktion-minimering gäller *flöden*, inte *konsekvens-handlingar*.

---

## 8. Mått på framgång

iOS-app v1 är klar för release när:

1. **Mediantid från app-öppning till verifierad LLM-anslutning är under 4 minuter** på en testperson som aldrig sett produkten innan
2. **Testpersonen kan förklara med egna ord vad som händer** ("Selvra ger ChatGPT tillgång till min sömndata") utan att ha läst dokumentation
3. **Testpersonen kan stänga av access utan att fråga om hjälp**
4. **Ingen testperson har sett ordet "MCP", "token", "config", "API"** i flödet (de orden finns i hjälp-dokumentation, inte i primärflödet)

Detta är icke-förhandlingsbara mätbara criteria för v1-release.

---

## Referenser

- [`IOS_APP_PRIMARY_JOB_2026-05-17.md`](IOS_APP_PRIMARY_JOB_2026-05-17.md) — strategisk avgränsning av iOS-appen
- [`FRICTION_MAP_2026-05-17.md`](FRICTION_MAP_2026-05-17.md) — konkret kartläggning per friktionspunkt
- [`SELVRA_APP_ROLE_2026-05-17.md`](SELVRA_APP_ROLE_2026-05-17.md) — selvra-app som tunn klient
- [`IOS_API_GAP_ANALYSIS_2026-05-17.md`](IOS_API_GAP_ANALYSIS_2026-05-17.md) — API-gap mot iOS-konsumtion
- selvra-protocol `docs/SELVRA_ONTOLOGY.md` — rad 6 ("konversation lever utanför Selvra") + rad 7 (reproducerbar extraktion)
- selvra-protocol `docs/SELVRA_POSITION_2026-05-17.md` — kanonisk position
- Memory: `feedback_friktionsfri_ux_first_2026-05-16` — befintlig princip om friktionsfri UX i flöde
- Memory: `feedback_avsiktlig_friktion_i_konsekvens_2026-05-17` — parad-instans
