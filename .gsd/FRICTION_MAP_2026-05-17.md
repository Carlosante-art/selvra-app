# Friktions-karta — iOS-onboarding-flöde

**Datum:** 2026-05-17
**Status:** Arbetsdokument. Uppdateras löpande. Datum-stämpel fixerar denna version; framtida versioner får nya stämplar.
**Syfte:** Konkret kartläggning av varje friktionspunkt i nuvarande och planerat iOS-flöde. Per friktionspunkt: vem äger den, vad vi kan göra, vad vi inte kan göra.

**Detta dokument är blueprint för iOS-implementation.** En implementation med kvarvarande Kategori A-friktioner är inte redo för release. Kategori C-friktioner ska vara så väl kommunicerade att de inte upplevs som vårt fel.

---

## Kategori-legenda

- **A** — Friktion vi äger, måste elimineras
- **B** — Friktion plattformar äger, vi kan mildra
- **C** — Friktion AI-leverantörer äger, vi kan inte lösa (kommunicera tydligt)
- **D** — Friktion ekosystemet äger, kommer mogna (designa flexibelt)

---

## Friktionspunkt 1 — App-nedladdning

**Steg i flödet:** Pre-onboarding. Användaren har hört talas om Selvra och söker i App Store.

**Vem äger den:** Apple (App Store) + Selvra (App Store-listing).

**Vad vi kan göra:**
- Skarp app-namn-formulering ("Selvra" + tagline som inte säger "MCP" eller "AI memory")
- Tydlig App Store-beskrivning på svenska + engelska
- Skärmdumpar som visar slutläge, inte konfiguration
- Inga falska promo-claims (förbjudet konstitutionellt)

**Vad vi inte kan göra:** App Store-godkännandet, sökrankning, recensioner.

**Acceptabel tid:** Räknas inte mot 3-min-budget. Användaren har redan beslutat ladda ner.

**Kommunikation:** "Selvra. Spegling och lättnad. Anslut din kropp till AI:n du redan använder." Eller motsvarande som inte är teknik-jargong.

**Kategori:** B (Apple äger App Store-friktion, vi mildrar genom listing-kvalitet).

---

## Friktionspunkt 2 — App-öppning första gången

**Steg i flödet:** Steg 1 i 3-min-budget. Appen öppnas, första skärmen visas.

**Vem äger den:** Selvra helt.

**Vad vi kan göra:**
- En skärm. Inte tre. Inte fem-stegs-välkomst med swipe-mellan.
- En mening om vad Selvra är, inte tre paragrafer.
- En primär CTA — sannolikt "Logga in med Apple". Inget annat klickbart.

**Vad vi inte kan göra:** N/A — vi äger denna helt.

**Acceptabel tid:** Under 15 sekunder från app-öppning till första klick.

**Kommunikation:** *"Selvra ger AI:n du använder kontext om dig. Du bestämmer vad. Logga in för att börja."* (eller motsvarande)

**Kategori:** A.

---

## Friktionspunkt 3 — Apple Sign-in

**Steg i flödet:** Steg 2.

**Vem äger den:** Apple (sign-in-dialog), Selvra (request).

**Vad vi kan göra:**
- Använda Apple Sign-in (snabbast på iOS, native dialog, en klick)
- Skippa formulär — bara Apple Sign-in primärt
- Email-relay-stöd (Apple-privacy)
- Inte be om för många permissions samtidigt — dela upp HealthKit och notifikationer i separata steg

**Vad vi inte kan göra:** Ändra Apple-dialogen själv.

**Acceptabel tid:** Under 15 sekunder från klick till bekräftad inloggning.

**Kommunikation:** Förlita på Apples välkänt dialog. Ingen extra förklaring behövs.

**Kategori:** B.

---

## Friktionspunkt 3b — Plan-status-kontroll (NY, flyttad från 10)

**Steg i flödet:** Direkt efter Apple Sign-in. Före välkomst-förklaring.

**Vem äger den:** Selvra (frågan) + Anthropic/OpenAI (planerna).

**Vad vi kan göra:**
- Fråga direkt efter sign-in: *"Vilken AI-assistent vill du använda Selvra med? Claude eller ChatGPT?"*
- Per val: kolla plan-status — "Har du Claude Pro eller Claude Free?"
- Om Free: tydligt visa att custom connectors kräver Pro (200 kr/månad) + erbjuda två alternativ:
  - **Uppgradera nu** (länk öppnar Anthropic.com — användaren kommer tillbaka senare)
  - **Fortsätt utan AI-anslutning än** (gå genom HealthKit-flödet, lämna AI-anslutning för senare när Pro är aktiverad)
- Om Pro: bekräfta + gå vidare

**Varför detta är flyttat hit:** Tidigare version frågade om plan i steg 10 (efter HealthKit-koppling). Anna-test visade att om hon måste uppgradera där, är hon mitt i flödet och tappar 10+ minuter på betalsida/e-postbekräftelse — det är avhopp. Tidig fråga betyder hon kan ordna Pro parallellt med HealthKit-läsning.

**Vad vi inte kan göra:** Ändra Anthropic/OpenAI:s plan-modell. Verifiera plan automatiskt (vi kan bara fråga användaren).

**Acceptabel tid:** Under 20 sekunder.

**Kommunikation:** Direkt och ärlig. Inte sälja Pro — bara säga vad som krävs.

**Kategori:** C (plan-kravet) + A (vår timing av frågan).

---

## Friktionspunkt 4 — Förklaring av vad Selvra gör (welcome-skärm)

**Steg i flödet:** Steg 3. Efter sign-in, första gången inloggad.

**Vem äger den:** Selvra helt.

**Vad vi kan göra:**
- En skärm. Inte multi-step-onboarding.
- Tre konkreta meningar om vad som händer härnäst.
- Visa snarare än beskriv — om möjligt, mockup av "vad Claude kommer säga om dig efter setup".
- Primär CTA: "Anslut Apple Hälsa" (inte "Continue", inte "Få igång")

**Vad vi inte kan göra:** N/A.

**Acceptabel tid:** Under 30 sekunder från visning till klick.

**Kommunikation:** *"Selvra läser data du redan har — sömn, träning, puls. När du ger Claude eller ChatGPT tillgång svarar de med kontext om dig. Du bestämmer vad de får se."*

**Kategori:** A.

---

## Friktionspunkt 5 — HealthKit-permission-request

**Steg i flödet:** Steg 4.

**Vem äger den:** Selvra (request-strategi).

**Vad vi kan göra:**
- Be om alla relevanta HealthKit-metrics i ett enda request (sömn, puls, HRV, träning, steg)
- Inte be om mer än vi använder
- Förklara *innan* dialogen vad vi kommer be om

**Vad vi inte kan göra:** Tvinga användaren acceptera.

**Acceptabel tid:** Under 10 sekunder från klick till Apples dialog.

**Kommunikation:** *"Apple Hälsa kommer fråga om Selvra får läsa: sömn, puls, träning, steg. Du kan ändra det senare i Inställningar."*

**Kategori:** A (vår förberedelse) + B (dialogen själv är Apples).

---

## Friktionspunkt 6 — HealthKit-permission-dialog (Apple-ägd)

**Steg i flödet:** Steg 5.

**Vem äger den:** Apple helt.

**Vad vi kan göra:**
- Be om rätt set i förväg (Carl-action 4)
- Inget annat — dialogen är Apples

**Vad vi inte kan göra:** Ändra dialogens utseende eller wording.

**Acceptabel tid:** Apples ansvar. Vanligtvis 10-30 sekunder för användaren att svara.

**Kommunikation:** Förlita på Apples välkänt dialog.

**Kategori:** B.

---

## Friktionspunkt 7 — Verifiering att HealthKit-data flödar

**Steg i flödet:** Steg 6. Direkt efter permission-dialog.

**Vem äger den:** Selvra helt.

**Vad vi kan göra:**
- Visa konkret bekräftelse: "Selvra läste din senaste natts sömn: 6h 12min."
- Snarare än "Setup klar!" — visa det faktiska värdet
- Detta är psykologiskt avgörande: användaren ser värde direkt, inte abstract bekräftelse

**Vad vi inte kan göra:** Visa data som inte finns (om HealthKit är tomt — t.ex. nyköpt iPhone — visa "Din data kommer börja flöda när du burit din Apple Watch en natt").

**Acceptabel tid:** Under 5 sekunder för data att synas.

**Kommunikation:** Konkret värde över abstract bekräftelse.

**Kategori:** A.

---

## Friktionspunkt 8 — Förklaring av nästa steg (AI-anslutning)

**Steg i flödet:** Steg 7. Bron mellan käll-koppling och AI-anslutning.

**Vem äger den:** Selvra helt.

**Vad vi kan göra:**
- En skärm. En mening. En CTA.
- Inte sälja in värdet — bara förklara vad som händer
- Primär CTA: "Anslut Claude" (eller default-klient enligt FRICTION_MINIMIZATION_PRINCIPLE §6)

**Vad vi inte kan göra:** N/A.

**Acceptabel tid:** Under 15 sekunder.

**Kommunikation:** *"Nu är din data i Selvra. Anslut Claude eller ChatGPT så kan de använda den när du pratar med dem."*

**Kategori:** A.

---

## Friktionspunkt 9 — Val av AI-klient

**Steg i flödet:** Steg 8.

**Vem äger den:** Selvra helt.

**Vad vi kan göra:**
- Ett primärt val (default per FRICTION_MINIMIZATION_PRINCIPLE §6)
- Sekundära val (Claude, ChatGPT, Cursor, Goose) klickbara men tydligt sekundära
- Inte visa alla klienter samtidigt — börja med default

**Vad vi inte kan göra:** N/A.

**Acceptabel tid:** Under 10 sekunder.

**Kommunikation:** *"Vilken AI-assistent vill du börja med? Du kan lägga till fler senare."*

**Kategori:** A.

---

## Friktionspunkt 10 — Plan-status-bekräftelse (kort, eftersom 3b redan körts)

**Steg i flödet:** Snabb bekräftelse precis innan token-generering. Om 3b körts ordentligt har vi redan vetat planen — detta är bara sanity-check.

**Vem äger den:** Selvra.

**Vad vi kan göra:**
- "Vi kommer ansluta din Claude Pro nu. Klart?"
- Om användaren sa Pro i 3b men inte hade det: detect via misslyckad connect senare, ge graceful fallback

**Vad vi inte kan göra:** Verifiera Pro-status programmatiskt (Anthropic-API:t exponerar inte detta).

**Acceptabel tid:** Under 5 sekunder.

**Kommunikation:** Snabb sanity-bekräftelse, inte plan-pitch (den händer i 3b).

**Kategori:** A.

---

## Friktionspunkt 11 — Token-generering

**Steg i flödet:** Steg 10. Selvra mintar token internt.

**Vem äger den:** Selvra helt.

**Vad vi kan göra:**
- Helt osynlig för användaren
- Generera + visa i nästa steg som "anslutnings-länk" eller QR-kod, aldrig som "token"

**Vad vi inte kan göra:** N/A.

**Acceptabel tid:** Under 2 sekunder.

**Kommunikation:** Inget — ordet "token" får inte synas.

**Kategori:** A.

---

## Friktionspunkt 12 — Hur token kommer in i AI-klienten

**Steg i flödet:** Steg 11. Den enda Kategori D-friktion i hela flödet och dess största sårbarhet för v1.

**Vem äger den:** Anthropic/OpenAI (mottagar-side har inte deep-link-API ännu).

**Verkligheten maj 2026 — ärlig:**

iPhone-only-Pro-användare har **inget bra alternativ idag.** Claude iOS-appen har MCP-config begravd i Settings utan tydlig "lägg till anslutning"-väg som icke-tekniska användare hittar. Cross-device QR-flow är primärt fungerande läge tills Anthropic släpper deep-link-API.

### Default-flöde — Cross-device (iPhone → Claude Desktop på Mac):
- QR-kod visas på iPhone, skannas av Mac
- Mac öppnar Claude Desktop med config-snippet ifyllt, en klick för att spara
- Inte sömlöst, men robust och fungerar idag

### Fallback — Same-device, web Claude:
- Copy-config till klipp-buffert + öppna `claude.ai` i Safari
- Klistra i Settings → MCP-servers
- Acceptabelt men kräver Pro-prenumeration + att Settings-vägen kommunicerats tydligt

### Vad vi inte kan göra
- Skapa same-device-deep-link till Claude iOS (Anthropic-arbete, väntar)
- Hjälpa iPhone-only-användare utan dator att nå Mac

### Vad vi måste kommunicera i appen (Anna-test 2026-05-17)
Innan QR-koden visas: *"Selvra kopplar bäst till Claude via din dator. Har du en Mac med Claude Desktop, eller använder du Claude i webbläsaren? Vi kan inte koppla direkt till Claude-appen på din iPhone än — Anthropic jobbar på det."*

**Acceptabel tid:** Under 90 sekunder från QR-visning till bekräftelse (förhöjd från tidigare 60s — verkligheten är klumpigare).

**Kategori:** D (kvarstår — vänta plattform-mognad. Vi planerar för dagens verklighet, bygger flexibelt för imorgon).

---

## Friktionspunkt 12b — iPhone-only-Pro-användaren (NY, identifierad i Anna-test)

**Steg i flödet:** Edge case som måste hanteras explicit, inte gömmas.

**Vem äger den:** Anthropic (saknar iOS-deep-link), Selvra (kommunikation).

**Vem är denna användare:** Har Claude Pro på iPhone. Har ingen Mac. Förväntar sig same-device-flöde. Vi har inget för henne idag.

**Vad vi kan göra:**
- Tydligt erkänna luckan i steg 9 eller 3b: *"Just nu kan vi tyvärr inte koppla Selvra till Claude-appen på iPhone direkt — du behöver tillgång till en Mac eller dator. Vi bevakar Anthropic och meddelar dig när det fungerar på iPhone."*
- Erbjuda email-notifiering när iOS-deep-link blir möjligt
- Spara hennes Selvra-konto + HealthKit-data — när Anthropic lanserar deep-link kan hon slutföra anslutningen utan att börja om
- Erbjuda ChatGPT som alternativ (om hon har Plus och ChatGPT iOS får MCP-config först)

**Vad vi inte kan göra:** Lova en tidsplan. Ge henne ett fungerande flöde idag.

**Acceptabel tid:** Det är inte tids-fråga — det är upplevelse-fråga. Hon måste *känna* att vi är ärliga och att hon inte är glömd.

**Kommunikation:** Ärlighet > marknadsföring. Detta är inte ett fel hon gör — det är en lucka i ekosystemet vi är öppna om.

**Kategori:** C/D.

---

## Friktionspunkt 13 — Bekräftelse i AI-klienten

**Steg i flödet:** Steg 12. I Claude/ChatGPT-appen, inte i Selvra-appen.

**Vem äger den:** Anthropic/OpenAI.

**Vad vi kan göra:**
- Vår config-text ska producera tydlig "Selvra connected" i klienten
- Server-side validation av första anrop från klienten
- Real-time SSE-event till Selvra-appen så användaren ser bekräftelse på iPhone

**Vad vi inte kan göra:** Ändra hur Claude/ChatGPT visar anslutningar.

**Acceptabel tid:** Under 10 sekunder från klick i klienten till Selvras egen bekräftelse.

**Kommunikation:** I Selvra: *"Claude är ansluten. Du kan börja prata med Claude nu."*

**Kategori:** B (vi kan inte ändra klientens UX men vi kan göra anslutningen så stabil att den syns rätt).

---

## Friktionspunkt 14 — Återkoppling till Selvra-appen att anslutning är klar

**Steg i flödet:** Steg 13. Tillbaka i Selvra-appen.

**Vem äger den:** Selvra helt.

**Vad vi kan göra:**
- Real-time via SSE — Selvra-appen detekterar anslutning automatiskt
- Bekräftelse-skärm: "Klart. Claude vet om dig nu."
- Direkt CTA: "Prova nu — fråga Claude om din sömn senaste veckan"

**Vad vi inte kan göra:** N/A.

**Acceptabel tid:** Under 5 sekunder från anslutning till bekräftelse-skärm.

**Kommunikation:** Konkret förslag på vad användaren kan fråga, inte abstract "klart".

**Kategori:** A.

---

## Friktionspunkt 15 — Första test-samtalet

**Steg i flödet:** Steg 14. Användaren öppnar Claude och ställer test-fråga.

**Vem äger den:** Användaren + Claude/ChatGPT (de svarar).

**Vad vi kan göra:**
- Förslå konkret första-fråga som ger Wow-moment ("Hur såg min sömn ut den här veckan?")
- Säkerställa att Claude's första svar faktiskt har Selvra-kontext (server-side validering på första request)

**Vad vi inte kan göra:** Styra klientens svar.

**Acceptabel tid:** Räknas inte mot 3-min-budget. Detta är efter setup.

**Kommunikation:** *"Klicka för att öppna Claude och fråga: 'Hur såg min sömn ut den här veckan?'"*

**Kategori:** A (vår förslag-text) + C (klientens svar).

---

## Friktionspunkt 16 — Verifiering att det fungerade

**Steg i flödet:** Steg 15. Användaren ser Claudes svar och förstår att det funkar.

**Vem äger den:** Användaren + Claude/ChatGPT + Selvra (audit-log).

**Vad vi kan göra:**
- I Selvra: visa audit-log entry för första AI-anrop ("Claude läste din sömndata kl 13:42")
- Detta är *bevis* för användaren att hennes data är i bruk

**Vad vi inte kan göra:** Bekräfta från klientens sida.

**Acceptabel tid:** Räknas inte mot 3-min-budget.

**Kommunikation:** Audit-log som passiv visning, inte notification.

**Kategori:** A.

---

## Sammanfattning per kategori (uppdaterad 2026-05-17 efter Anna-test)

| Kategori | Antal friktionspunkter | Vad detta säger oss |
|---|---|---|
| **A** (vi äger, måste elimineras) | 10 | Vår huvudsakliga arbetsbörda |
| **B** (vi äger delvis, mildrar) | 4 | Vi måste optimera vår förberedelse |
| **C** (AI-leverantörer äger) | 3 | Kommunikation är försvar |
| **D** (ekosystem äger, kommer mogna) | 2 | Designa flexibelt för plattform-uppdateringar |

**Total uppskattad tid genom flödet:**
- För Mac-användare med Pro: 2:30–4:00 min
- För iPhone-only Pro-användare: **kan inte slutföras idag** — vi kommunicerar tydligt att Mac krävs (12b)
- För Pro-mindre användare: 3b stoppar dem tidigt med uppgradera/skip-val

**Lärdom från Anna-test (T1D-mamma, iPhone-only Pro, 2026-05-17):**
- Vi hade `Claude iOS Pro = smidigast på samma enhet` som antagande i FRICTION_MINIMIZATION_PRINCIPLE §6. Det är inte sant idag — `Claude iOS` har MCP-config begravd i Settings som icke-tekniska användare inte hittar
- Vi hade plan-fråga (gammal punkt 10) i mitten av flödet, vilket är dödsstöt om uppgradering krävs där. Flyttad till 3b
- iPhone-only-Pro-användare var dolda i kartan. Synliggjorda i 12b

---

## När detta dokument uppdateras

- Vid ny plattform-funktion som löser en Kategori D-punkt
- Vid implementations-runda när vi upptäcker friktion vi missat i kartläggningen
- Vid användartest där friktion uppfattades annorlunda än vi förutsåg
- Vid varje större iOS-release: gå igenom hela kartan, uppdatera tids-estimat

Varje uppdatering är en ny daterad version: `FRICTION_MAP_YYYY-MM-DD.md`. Gamla versioner sparas som historisk referens.

---

## Referenser

- [`FRICTION_MINIMIZATION_PRINCIPLE_2026-05-17.md`](FRICTION_MINIMIZATION_PRINCIPLE_2026-05-17.md) — huvudprincip med kategori-definitioner
- [`IOS_APP_PRIMARY_JOB_2026-05-17.md`](IOS_APP_PRIMARY_JOB_2026-05-17.md) — appens uppgift som ramar denna karta
- [`IOS_HEALTHKIT_SYNC_DESIGN_2026-05-17.md`](IOS_HEALTHKIT_SYNC_DESIGN_2026-05-17.md) — relevant för friktionspunkt 5-7
- [`IOS_AUTH_COEXISTENCE_DESIGN_2026-05-17.md`](IOS_AUTH_COEXISTENCE_DESIGN_2026-05-17.md) — relevant för friktionspunkt 3
- [`IOS_AUTH_BEARER_JWT_DESIGN_2026-05-17.md`](IOS_AUTH_BEARER_JWT_DESIGN_2026-05-17.md) — relevant för friktionspunkt 11-13
