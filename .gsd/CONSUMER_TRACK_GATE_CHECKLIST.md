# Konsument-spår — Fas 1 gate-checklist

Gaten innan Fas 1 (Personal Tool) aktiveras. Refererad från
[SELVRA_CONSUMER_TRACK_2026-05-15.md](./SELVRA_CONSUMER_TRACK_2026-05-15.md) §11.

Alla gates måste vara uppfyllda samtidigt innan iOS-bygge påbörjas.

---

## Gate 1: Stillra v2 manuell e2e KLAR

- [ ] Hela patient-läkare-flödet körd i TestFlight production-bundle
- [ ] Brief genererad → delning skapad → läkar-vy renderad → patient-vy renderad
- [ ] Minst 7 dagars sammanhängande användning utan reset
- [ ] Inga bryt-bugs som blockerar pilot-patient-onboarding

**Status:** ⬜ ej klar

---

## Gate 2: Endokrinolog-outreach-material klart

- [ ] 5 outreach-mejl draftade och granskade av Kari
- [ ] Stillra-deck (för läkar-perspektiv) klart
- [ ] One-pager med pilot-protokoll-utkast
- [ ] Minst 2 av 5 mejl ute

**Status:** ⬜ ej klar

---

## Re-evaluering

När alla gates är ✅, gör en sista granskning innan Fas 1 aktiveras:

1. Är Stillra T1D fortfarande primär?
2. Är konstitutionella principerna fortfarande operativa i grund-arkitekturen
   (käll-attribuering, anti-manipulation, patient-ägd portabilitet, EU-suveränitet)?
3. Säger Kari OK på timing (extern-process-perspektiv)?

Om allt är ✅: aktivera Fas 1. Skapa branch i lämpligt repo, börja med iOS-app-skeleton + HealthKit-integration.

Om något är ⚠️: dokumentera varför i ny rad i denna fil och vänta.
