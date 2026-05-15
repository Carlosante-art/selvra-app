# Konsument-spår — Fas 1 gate-checklist

Detta är gaten innan Fas 1 (Personal Tool för Carl) aktiveras. Refererad från
[SELVRA_CONSUMER_TRACK_2026-05-15.md](./SELVRA_CONSUMER_TRACK_2026-05-15.md) §11.

**Alla tre måste vara uppfyllda samtidigt innan iOS-bygge påbörjas.**
Om en faller bort under Fas 1, pausa och re-evaluera.

---

## Gate 1: Carl-dogfood för Stillra v2 manuell e2e KLAR

- [ ] Hela patient-läkare-flödet körd av Carl själv i TestFlight production-bundle
- [ ] Brief genererad → delning skapad → läkar-vy renderad → patient-vy renderad
- [ ] Minst 7 dagars sammanhängande användning utan reset
- [ ] Inga bryt-bugs hittade som blockerar pilot-patient-onboarding

**Status:** ⬜ ej klar

**Senaste verifierings-datum:**

---

## Gate 2: Endokrinolog-outreach-material klart

- [ ] 5 outreach-mejl draftade och granskade av Kari
- [ ] Stillra-deck (för läkar-perspektiv) klart
- [ ] One-pager med pilot-protokoll-utkast
- [ ] Carl har börjat skicka mejlen (minst 2 av 5 ute)

**Status:** ⬜ ej klar

**Senaste verifierings-datum:**

---

## Gate 3: Carls TIR återhämtat sig från intensiva bygg-period

Carls TIR (Time-in-Range) ska vara **> 50% i 7-dagars-snitt under 2 veckor i rad**.

Detta är empirisk hälso-signal — T1D-kroppen är spegeln. Om TIR är under 50%
betyder det att stress + kompensations-mönster fortfarande dominerar och att
ytterligare ett aktivt bygg-spår skulle eskalera utmattning.

- [ ] Vecka 1: TIR-snitt > 50%
- [ ] Vecka 2: TIR-snitt > 50%
- [ ] Sömn-data parallellt visar återhämtning (Garmin/Oura)
- [ ] Subjektiv energi: Carl själv säger "jag har överskott", inte "jag klarar"

**Status:** ⬜ ej klar

**Senaste verifierings-datum:**

**Senaste 7-dagars TIR:**

---

## Re-evaluering

När alla tre är ✅, gör en sista granskning innan Fas 1 aktiveras:

1. Är Stillra T1D fortfarande primär (per kvartals-kontroll-post §10.1)?
2. Bevaras < 30% av Carls totala tid för konsument-spår (per §10.2)?
3. Är konstitutionella principerna fortfarande operativa i grund-arkitekturen
   (käll-attribuering, anti-manipulation, patient-ägd portabilitet, EU-suveränitet)?
4. Säger Kari OK på timing (extern-process-perspektiv: är inget kritiskt
   Stillra-spår satt på paus av distraktion)?

Om alla fyra är ✅: aktivera Fas 1. Skapa branch `consumer/phase-1-skeleton`
i lämpligt repo, börja med iOS-app-skeleton + HealthKit-integration.

Om något är ⚠️: dokumentera varför i ny rad i denna fil och vänta.
