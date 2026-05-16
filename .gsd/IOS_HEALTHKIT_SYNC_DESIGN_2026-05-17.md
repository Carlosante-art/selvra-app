# HealthKit-sync — design för `POST /api/sources/healthkit/sync`

**Datum:** 2026-05-17
**Status:** Design-doc innan implementation. Vecka 7 i SELVRA_IOS_V1_BUILD_PLAN.
**Beror på:** SELVRA_POSITION (selvra-app är klient), DUAL_FACT_EXTRACTION_MIGRATION (på sikt skickas events till protokollet), CONVERSATION_SOURCE_ATTRIBUTION (käll-attribuering är obligatorisk).

---

## Vad vi designar

Endpoint som tar emot HealthKit-data från iOS-klienten och persisterar den så att Selvra kan referera till den käll-attribuerat i conversation-context. Per gap-analys: ~1.5 dagars implementering plus designval här.

Fyra designval måste låsas:

1. Real-time per sample vs batch
2. PII-scrub-placering (klient eller server)
3. Storage-format (separat tabell eller events)
4. Rate-limit-strategi

---

## Designval 1 — Real-time vs batch

### Alternativ

**A. Real-time per sample.** iOS-klient skickar varje HealthKit-sample direkt vid `HKObserverQuery`-trigger.
- Pro: Färsk data alltid synlig
- Con: Batteridränage, mobil-data, tusentals requests/dag, backend-rate-limit-utmaning

**B. Batch — fixed interval.** Klient skickar var 15:e minut eller dagligen 03:00 (via `BGProcessingTask`).
- Pro: Skonsam mot batteri + nätverk, predictable last
- Con: Fördröjning innan ny data syns

**C. Hybrid.** Real-time för aktuell session (samtal pågår), batch för historik.
- Pro: Bästa UX när användaren faktiskt frågar
- Con: Komplexitet, två kod-vägar

### Beslut: **B med opportunistisk pull**

Batch dagligen (03:00 lokal tid via `BGProcessingTask`) som default. Plus: när användaren öppnar appen och senaste-sync är >2h gammal, trigga manuellt en sync innan första svaret. Det ger "färsk data när jag tittar" utan att tära på batteriet.

Real-time per sample (A) är överoptimering — Selvra svarar inte i sekunder, det reflekterar. Carl kommer aldrig märka skillnad på "min HRV 30 sek sedan" vs "min HRV från i morse".

Hybrid (C) är komplexitet utan tydlig användarvinning. Förkastas.

---

## Designval 2 — PII-scrub-placering

HealthKit-samples är PII (hjärtfrekvens + tidsstämpel kan triangulera till individ). Vi måste scrub:a innan logg eller långtidslagring.

### Alternativ

**A. Klient-scrub.** iOS-klient strippar identifierare innan POST.
- Pro: Råa PII lämnar aldrig enheten
- Con: Backend ser bara aggregat — kan inte återgenerera detaljer för debug, AI kan inte ge precis källa-attribuering

**B. Server-scrub.** Backend tar emot raw data, scrubbar innan persistering.
- Pro: Backend kan göra rik analys + behålla precision för käll-attribuering
- Con: Raw PII passerar backend-lagret (transit + RAM, inte storage)

**C. Hybrid.** Klient strippar specifika fält (lokation, device-serial), server scrubbar resten.
- Bästa av båda

### Beslut: **C — hybrid med strikta regler**

Klient strippar:
- Device-serial-nummer (kan inte härledas tillbaka från `HKSource`-objekt om vi inte skickar det)
- Lokation-koordinater för samples med GPS (Strava-style)
- iOS-version, telefon-modell (skickas inte alls — bara `userAgent: "Selvra/1.0 iOS"`)

Server scrubbar via befintliga `scrub.ts`-helpern:
- Frequency-domain-leakage: om en användare har <3 samples på 5 min, gruppera till 5-min-bucket innan persistering (anti-fingerprinting)
- Inga raw-payloads i Sentry-logs (struct-logs har explicit allowlist)

Plus: använd selvra-protocols centrala scrub-pipeline (PR #33) när events skickas till protocol-sidan.

---

## Designval 3 — Storage-format

Var lagras HealthKit-data?

### Alternativ

**A. Egen tabell i selvra-app DB** (`source_samples` eller liknande).
- Pro: Snabb implementation, full kontroll
- Con: Mer dual fact-extraction-skuld ([[DUAL_FACT_EXTRACTION_MIGRATION_2026-05-16]]) — växer linjärt med samples
- Con: selvra-protocol kan inte använda data för divergens-detektion

**B. Direkt som events till selvra-protocol** via `POST /v1/subjects/{id}/events`.
- Pro: Konsistent med arkitekturen (selvra-app är klient, allt data lever i protokollet)
- Pro: Divergens-detektion fungerar direkt (sensor-vs-user_stated jämförelse)
- Con: Kräver att selvra-protocol är tillgängligt vid sync (single point of failure)
- Con: Tusentals events kan stressa Moderator-pipelinen

**C. Aggregera i selvra-app, skicka aggregat som events till protokollet.**
- T.ex. dygnsmedelvärde + min/max + sample-antal som ETT event per dag per metric
- Pro: Mindre event-volym (1-10/dag vs hundratals)
- Pro: Konstitutionellt rent (data lever i protokollet, klient är passthrough)
- Con: Förlorar sample-nivå-precision för utforskning

### Beslut: **C — aggregera-och-skicka**

Per metric per dag → ett event till selvra-protocol:

```json
{
  "category": "data_ingested",
  "event_type": "healthkit.daily_aggregate.sleep",
  "payload": {
    "date": "2026-05-17",
    "metric": "sleep",
    "duration_hours_mean": 5.7,
    "duration_hours_min": 4.2,
    "duration_hours_max": 7.1,
    "sample_count": 1,
    "source_specific": {
      "asleep_unspecified_minutes": 342,
      "in_bed_minutes": 412,
      "rem_minutes": 67
    }
  },
  "provenance": {
    "source": "apple_healthkit",
    "source_app": "Selvra iOS",
    "sync_timestamp": "..."
  }
}
```

Raw samples sparas **inte** efter aggregering. Om vi senare behöver återgenerera tar vi en ny `HKSampleQuery` från enheten — HealthKit är auktoritativ källa.

För Carl-dogfood-debug-läget: en hidden setting (DEBUG_RAW_HEALTHKIT=true) kan aktivera raw-sample-storage tillfälligt utan att det är produktionsbeteendet.

### Konsekvens för iOS-appen

iOS-klient måste:
1. Kollra HealthKit dagligen 03:00
2. För varje metric, beräkna dygnsaggregat (mean/min/max/count) klient-sidan
3. POST aggregaten till `POST /api/sources/healthkit/sync` — som forwardar till selvra-protocol som events
4. Spara `last_sync_at` lokalt (Keychain eller UserDefaults)

---

## Designval 4 — Rate-limit-strategi

### Vad vi skyddar mot

- Bug i iOS-klient som loopar sync-anrop
- Komprometterad token som blast:ar requests
- Carl med 5 enheter (telefon, watch, iPad…) som syncar samtidigt

### Beslut

Två-nivåers limit:

| Nivå | Tak | Fönster |
|---|---|---|
| Per `user_id` + endpoint | 50 syncs | 1 timme |
| Per `user_id` total alla endpoints | 200 requests | 1 timme |
| Burst | 5 requests | 10 sekunder |

Vid hit: 429 + `Retry-After`-header. iOS-klient backoff:ar exponentiellt + visar inte fel till användaren (sync ska vara osynlig).

Implementation: utöka befintliga `HttpRateLimiter` (om sådan finns i selvra-app) eller lägg till middleware. Per-user, inte per-tenant (eftersom selvra-app är enkel-user-per-token).

---

## Request-schema

```typescript
POST /api/sources/healthkit/sync
Content-Type: application/json
Authorization: Bearer <token>

{
  "syncedAt": "2026-05-17T03:00:00Z",        // ISO 8601, klient-tid
  "aggregates": [
    {
      "date": "2026-05-17",
      "metric": "sleep",
      "values": {
        "duration_hours_mean": 5.7,
        "duration_hours_min": 4.2,
        "duration_hours_max": 7.1
      },
      "sourceSpecific": {                     // optional, metric-beroende
        "asleepUnspecifiedMinutes": 342,
        "inBedMinutes": 412
      }
    },
    {
      "date": "2026-05-17",
      "metric": "heart_rate",
      "values": {
        "bpm_mean": 64,
        "bpm_min": 48,
        "bpm_max": 142,
        "sample_count": 1834
      }
    }
  ]
}
```

**Validation:**
- `syncedAt` får inte vara mer än 7 dagar gammalt (backfill-skydd)
- `aggregates` max 30 (en månads dagligt aggregat per sync)
- `metric` whitelist: `sleep`, `heart_rate`, `hrv`, `steps`, `active_minutes`, `resting_heart_rate`
- Numeriska värden valideras mot rimliga gränser (`bpm` 30-220, `duration_hours` 0-24, etc.)

## Response-schema

```typescript
200 OK
{
  "accepted": 28,
  "skipped": 2,                                // already-synced dygn
  "skippedReasons": [
    { "date": "2026-05-15", "reason": "duplicate" }
  ],
  "nextSyncRecommended": "2026-05-18T03:00:00Z"
}

400 Bad Request — validation-fel
401 Unauthorized
429 Rate-limited + Retry-After
502 Upstream (selvra-protocol nere)
```

---

## Idempotens

Sync är idempotent på `(user_id, date, metric)` — om iOS-klient skickar samma aggregat två gånger (network-retry, app-restart), skip:as duplicates utan fel.

Detta kräver att selvra-protocols events-endpoint stödjer en `idempotency_key` på events, eller att vi i selvra-app:s POST-handler kollar om event redan finns innan vi forwardar. Sista är enklare för v1.

---

## Vad detta INTE adresserar

- Real-time HRV-trigger för "Selvra vet att din puls just hoppat" (out-of-scope för v1 — kräver real-time-path)
- Apple Watch-specifik integration (om watch ger andra metrics än telefon)
- Backfill av historisk data utöver 7 dagar (separat one-shot-flöde, designas vid behov)
- Sleep-stage-classification utöver vad HealthKit ger direkt

## Refs

- [`IOS_API_SPEC_2026-05-16.md`](IOS_API_SPEC_2026-05-16.md) — POST /api/sources/healthkit/sync request/response
- [`IOS_API_GAP_ANALYSIS_2026-05-17.md`](IOS_API_GAP_ANALYSIS_2026-05-17.md) — vecka 7 prio + 1.5d estimat
- [`DUAL_FACT_EXTRACTION_MIGRATION_2026-05-16.md`](DUAL_FACT_EXTRACTION_MIGRATION_2026-05-16.md) — varför events-formatet är rätt
- [`SELVRA_POSITION_2026-05-17.md`](SELVRA_POSITION_2026-05-17.md) — selvra-app är klient (passthrough), inte data-owner
- selvra-protocol `docs/CONVERSATION_SOURCE_ATTRIBUTION_2026-05-16.md` — käll-attribuering är obligatorisk
