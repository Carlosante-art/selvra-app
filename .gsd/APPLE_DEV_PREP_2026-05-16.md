# Apple Developer Program — Registrering-förberedelse

Per `SELVRA_IOS_V1_BUILD_PLAN_2026-05-16.md` §5 vecka 2-3 task 4.

Krav för att aktivera iOS-bygget i §5 vecka 4. Apple Developer Program
behövs för:
- Bundle ID-registrering (`io.selvra.app`)
- Provisioning profiles (development + distribution)
- TestFlight-distribution (vecka 13)
- App Store-publishing (vecka 24)
- Push-notification-certifikat (om push aktiveras post-v1)
- Sign in with Apple konfiguration

## Förkrav (Carl-action)

### 1. AB-aktivering klart

Apple kräver organization-konto (företags-registrering, $99/år) snarare
än individual-konto för:
- Sign in with Apple
- Push-notifikationer
- Multi-developer-team (om YH-utbildning lägger till handledare)
- App Store-listing under bolagsnamn

**Blocker:** AB-aktivering pågår (2-3 veckor). Inget Apple-arbete kan
slutföras innan organisationsnummer finns.

### 2. D-U-N-S Number

Apple kräver D-U-N-S (Data Universal Numbering System) för organization-
verifiering. Sverige: gratis via Dun & Bradstreet (`https://www.dnb.com/duns-number/get-a-duns.html`).

**Tidshorisont:** 1-3 dagar för D-U-N-S-utfärdande. Kan ansökas parallellt
med AB-aktiveringen.

### 3. Apple ID för organisation

Inte personlig Apple ID. Skapa dedikerad email (`apple@selvra.ai` eller
liknande) som ägs av AB:t — inte Carls personliga konto. Säkerhets-skäl:
om Carl byter mail-provider eller säljer/överlåter bolaget skall Apple-
kontot vara separabelt.

## Steg-för-steg registrering (när AB klart)

### Steg 1: D-U-N-S Number (om saknas)

1. https://developer.apple.com/enroll/duns-lookup/
2. Slå upp bolagsnamn — om träff, notera nummer
3. Om ingen träff: ansök via D&B-länk (tar 1-3 dagar)

### Steg 2: Apple ID-setup

1. Skapa Apple ID med org-email
2. Aktivera two-factor-authentication (krävs av Apple)
3. Verifiera email + telefon-nummer kopplat till AB

### Steg 3: Apple Developer Program enrollment

1. https://developer.apple.com/programs/enroll/
2. Välj "Organization" (inte Individual)
3. Fyll i:
   - Org-namn (samma som registrerat på D-U-N-S)
   - D-U-N-S nummer
   - Org-roll: Carl som "Account Holder"
   - Kontakt-email + telefon
4. Betala $99 USD årlig avgift
5. Vänta verifiering (1-7 dagar, ibland längre)

### Steg 4: Verifiera + setup post-godkänd

1. Logga in på App Store Connect
2. Skapa nya appen:
   - Bundle ID: `io.selvra.app` (eller liknande)
   - Namn: `Selvra` (eller `Selvra - Spegling och lättnad`)
   - SKU: internt-id (t.ex. `selvra-ios-v1`)
   - Bundle ID-typ: Explicit
3. Skapa certifikat:
   - Development Certificate (för Xcode-debug)
   - Distribution Certificate (för TestFlight + App Store)
4. Skapa provisioning profiles:
   - Development (devices i team-listan)
   - Ad Hoc (för pre-TestFlight tester)
   - App Store (för TestFlight + Store-distribution)

## Konfiguration som behövs i Xcode (vecka 4)

```
Bundle Identifier:    io.selvra.app
Display Name:         Selvra
Version:              1.0.0
Build:                1
Deployment Target:    iOS 17.0
Capabilities:
  ☑ Sign in with Apple
  ☑ HealthKit (background delivery)
  ☑ Calendars (read-only)
  ☐ Push Notifications (DEAKTIVERAT i v1 — constitutional risk)
  ☐ In-App Purchase (aktiveras vid subscription-bygge)
Privacy descriptions in Info.plist:
  NSHealthShareUsageDescription:
    "Selvra läser sömn, hjärtfrekvens, HRV och aktivitet för att 
     spegla mönster över tid. All data stannar i din app + på vår 
     EU-baserade server. Du kan radera allt när som helst."
  NSCalendarsUsageDescription:
    "Selvra läser kalendern för att se mönster mellan vad du planerat 
     och hur kroppen reagerar. Bara titlar och tider — inga deltagare."
```

## App Store-listing-förberedelse (vecka 17-20)

**App-namn:** Selvra
**Subtitle:** Spegling och lättnad
**Promotional Text:** På mätdata och ord.
**Description (svenska):**
> Selvra läser kroppen, kalendern, sömnen, dina ord — och säger vad
> den ser. Källa-attribuerat. Patient-ägt. Europeiskt byggt.
>
> När du behöver vila finns plats för det. När du behöver förstå
> finns underlag. Inget coaching. Ingen manipulation. Bara det
> som är där.

**Keywords:** AI, hälsa, sömn, reflektion, EU, integritet, Garmin, kalender
**Support URL:** https://selvra.ai/privacy
**Marketing URL:** https://selvra.ai
**Privacy URL:** https://selvra.ai/privacy
**Category:** Health & Fitness (primär) + Lifestyle (sekundär)
**Age Rating:** 17+ (kräver explicit p.g.a. AI + hälsa)

## Privacy Policy (krävs av App Store Review)

Måste inkludera:
- Vilken data samlas (HealthKit-metrics, kalender-titlar, chat-text, OAuth-data)
- Hur lagras (PostgreSQL EU-region, encrypted-at-rest)
- Sub-processor-lista (per EU_HOSTING_VERIFICATION-doc)
- Användarens rättigheter (GDPR Art. 15-22): tillgång, rättelse, radering,
  portabilitet, invändning
- SREF v1 export-mekanism
- Kontakt-information för dataskyddsombud (DPO)

Befintlig `/privacy`-route i selvra-app behöver utökas med dessa
sektioner pre-launch.

## Test-distribution (TestFlight, vecka 13)

- TestFlight Internal Testing: upp till 100 testare från utvecklings-team
- TestFlight External Testing: upp till 10,000 testare via public link
- Reviewer-feedback från Apple inom 24h för Internal, 1-2 dagar för External
- Internal kräver inte App Review (snabb iteration), External kräver det

## Subscription-setup (vecka 17+)

För understanding-subscription per build-plan §1:

**StoreKit 2 produkter att skapa i App Store Connect:**
- `io.selvra.app.monthly` — €9-15/månad (intervall, exact pris bestäms vid launch)
- `io.selvra.app.yearly` — €69-99/år
- Gratis tier är default (ingen subscription krävs för basic-funktioner)

**Apple tar 15-30%:** 30% första året, 15% efter retention. Pris bör
inkludera detta.

## Risker

- **Avslag av Apple Developer Program:** kan ske om Apple inte verifierar
  org-info. Mitigation: noggrann form-ifyllning, snabb respons på Apple-
  kontakt-requests.
- **Bundle ID redan tagen:** `io.selvra.app` kan vara registrerat av annan.
  Mitigation: testa via Apple's `Bundle ID Lookup` innan Steg 4. Alternativ:
  `ai.selvra.app` eller `app.selvra.consumer`.
- **App Store Review-avslag:** Hälso-AI-appar är hård-granskad. Mitigation:
  Privacy Policy ultra-tydlig, inga claims om "diagnos" eller "behandling",
  följ App Store Review Guidelines 5.1.3 (Health & Medical Research).

## Tidshorisont

| Vecka | Apple-action |
|---|---|
| 2-3 | AB-aktivering + D-U-N-S-ansökan + Apple ID-setup |
| 3-4 | Apple Developer Program enrollment + verifiering |
| 4 | Bundle ID + certificates + Xcode-projekt setup |
| 5-12 | iOS-bygget (mot dev-cert) |
| 13 | TestFlight Internal |
| 17 | TestFlight External + App Store Connect-listing |
| 22 | Submit för App Store Review |
| 24 | App Store-launch (om review godkänd) |
