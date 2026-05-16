# Strategiskt beslut 2026-05-16: Konsoliderad omfokusering

**Status:** Canonical. Beslutet är fattat. Ersätter konsument-Fas-låsning,
v1-webb-bygget, och tidigare landing-spec som primär produkt-strategi.

## Sammanfattning

**Stillra:** i nästa-steg-läge. Inte parkerat, inte aktiv pilot. Nästa
milstolpe är klinisk validations-event via Carls eget läkarbesök med
doctor-brief. Post-validering: beslut om formell pilot-aktivering baserat
på empiriska data.

**Selvra-konsument:** aktiv produktidentitet. Pivoteras till **iOS-only**.

## Skäl till iOS-pivot

- HealthKit-integration fundamental för multi-source levd minne
- Konkurrent-arkitektur är mobile-first (Replika, Pi, Character.AI)
- Konsumenter letar AI-kompanjoner i App Store, inte webb-läsare
- Push fungerar bara på iOS (webb-push trasig på Apple)
- Friction-skillnad mellan webb-url-login vs hem-skärm-tap är 80%
  retention-divergens inom 3 dagar

## Bandwidth-logik

Stillra-externs (AB, MDR, IRB, Vinnova, endokrinolog-rekrytering) rör
sig i veckor-månader oavsett vad solo-founder gör. Selvra-konsument är
internt-blockerat (kod-bygge) som rör sig snabbt med Claude Code-leverage.
Aktiv tid läggs där rörelse är möjlig.

## Konkret första-drag idag (Claude Code-tasks)

1. Skapa denna fil (`SELVRA_CONSUMER_IOS_PIVOT_2026-05-16.md`)
2. Frys nuvarande webb-bygget. Backend bevaras (60% av v1 är
   platform-agnostic — `extractFactsFromTurn`, `lock-validate`,
   `process-user-turn`, DB-schema, säkerhetslager). UI-routes (40% —
   `.tsx`, Next.js, samtal/welcome/minne-komponenter) arkiveras till
   branch `archive/web-consumer-2026-05-15`.
3. Skriv om landing-sidan till minimal pre-launch:
   - H1: Selvra
   - Subtitle: AI som vet vad du har levt, inte bara vad du har sagt.
   - Body: Bygger en iOS-app för dig som vill förstå dig själv genom det
     du redan har — kalender, sömn, träning, dina ord. Källa-attribuerat.
     Patient-ägt. Europeisk infrastruktur. EU AI Act-compliant.
   - Footer: Launch H2 2026. [Mailadress för uppdatering].

   Allt brev-paradigm-copy rivs. Inga sektioner. En sida, en mening,
   en CTA.

## Carl-tasks (utanför Claude Code)

4. Stillra: dogfood fortsätter. Carls läkarbesök används som klinisk
   validations-event. Test-frågor formuleras innan besöket:
   - Kan läkare läsa briefen utan att tappa kontext?
   - Tillför briefen något till mötet?
   - Reagerar läkare positivt/neutralt/flaggar brister?
   - Representerar briefen veckan rätt?
   - Något kliniskt insight som missats utan briefen?

5. Kari informeras om omfokuseringen. Inte "Stillra parkerat". "Stillra
   i nästa-steg-läge tills första klinisk validering klar, Selvra-
   konsument får aktiv bandwidth under tiden. Vinnova-roll aktiveras
   post-validering, sannolikt vintern 2026/27."

6. iOS-bygget startar efter AB-aktivering (vecka 2-3). Vila-period
   vecka 1 medan webb-frysning och landing-omarbetning körs. Inget mer
   kod-arbete på Selvra UI denna vecka utöver landing-copy.

## Bevarade konstitutionella principer

- **IF1** — Selvra ska aldrig veta mer än användaren
- **Empirisk substrate-kompass** — klinisk validations-event är substrate,
  inte gissning
- **North star** — intellektuellt, heligt, inte unicorn
- **Aldrig manipulation** — `consumer-lock-validate.ts` 11 forbidden
  patterns gäller fortsatt
- **EU-suverän infrastruktur** — Mistral (Paris), Sentry EU, Hetzner
- **SREF v1 export från dag 1** — patient-ägd portabilitet

## Tidshorisont

| Period | Vad |
|---|---|
| Maj-juni 2026 | Vila + webb-frysning + landing + AB-väntan |
| Juli 2026 | iOS-projekt setup, Swift-första-iteration |
| Augusti-november 2026 | iOS-bygget mot Selvra-backend |
| December 2026 | TestFlight beta |
| Vintern 2026/27 | Stillra klinisk validations-utvärdering |
| 2027 | YH-besked, decide om Selvra launch pre-utbildning eller paus |

## Vad detta dokument ERSÄTTER

- `SELVRA_CONSUMER_TRACK_2026-05-15.md` — Fas 0-låsning obsoletad av denna pivot
- `SELVRA_CONSUMER_V1_BUILD_2026-05-15.md` — v1 web-build pivoteras till iOS
- `SELVRA_LANDING_DESIGN_SPEC_2026-05-12.md` — brev-paradigm-landing pivoteras till pre-launch
- `IOS_API_READINESS_2026-05-16.md` — kvarstår som referens för iOS-backend-spegling när bygget startar

## Vad detta dokument BEVARAR

- `BACKEND_AUDIT_2026-05-16.md` — säkerhets-headers + bundle-baseline gäller
- `V1_E2E_VERIFICATION_2026-05-16.md` — verifierings-procedur gäller för backend-pipelinen
- Stillra-arbetet (separat repo, separat scope)
