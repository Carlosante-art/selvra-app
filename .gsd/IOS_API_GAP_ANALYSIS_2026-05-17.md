# iOS API gap-analys mot befintliga endpoints

**Datum:** 2026-05-17
**Status:** Konkret mappning. Verifierat mot main 2026-05-17.
**Källa:** `IOS_API_SPEC_2026-05-16.md` (spec) vs `src/app/api/*` (kod).

---

## Sammanfattning

| Total i spec | Finns på main | Partial | Saknas helt |
|---|---|---|---|
| 24 endpoints | 16 (67%) | 1 | 7 |

Backend-arbete för att komplettera iOS-stöd: **5-8 dagars implementering** fördelat över build-planens veckor 5-8.

---

## Endpoint-för-endpoint-status

| Endpoint | Status | Befintlig route | Implementations-vecka |
|---|---|---|---|
| `POST /api/auth/apple` | **SAKNAS** | — | Vecka 5 |
| `POST /api/auth/refresh` | **SAKNAS** | — | Vecka 5 |
| `DELETE /api/auth/session` | **SAKNAS** | NextAuth signout finns men inte REST-DELETE | Vecka 5 |
| `GET /api/threads` | ✓ | `src/app/api/threads/route.ts` GET | Klart |
| `POST /api/threads` | ✓ | `src/app/api/threads/route.ts` POST | Klart |
| `GET /api/threads/:id` | ✓ | `src/app/api/threads/[id]/route.ts` GET | Klart |
| `PATCH /api/threads/:id` | ✓ | `src/app/api/threads/[id]/route.ts` PATCH | Klart |
| `DELETE /api/threads/:id` | ✓ | `src/app/api/threads/[id]/route.ts` DELETE | Klart |
| `GET /api/threads/:id/turns` | ✓ | `src/app/api/threads/[id]/turns/route.ts` GET | Klart |
| `GET /api/threads/:id/export` | **SAKNAS** | — | Vecka 8 |
| `POST /api/chat/stream` | ✓ | `src/app/api/chat/stream/route.ts` POST | Klart (se not nedan) |
| `GET /api/memory/facts` | ✓ | `src/app/api/memory/facts/route.ts` GET | Klart |
| `DELETE /api/memory/facts/:id` | ✓ | `src/app/api/memory/facts/[id]/route.ts` DELETE | Klart |
| `GET /api/memory/explicit` | ✓ | `src/app/api/memory/explicit/route.ts` GET | Klart |
| `DELETE /api/memory/explicit/:id` | ✓ | `src/app/api/memory/explicit/[id]/route.ts` DELETE | Klart |
| `GET /api/sources` | **SAKNAS** | — | Vecka 7 |
| `POST /api/sources/healthkit/sync` | **SAKNAS** | — | Vecka 7 |
| `DELETE /api/sources/:id` | **SAKNAS** | — | Vecka 7 |
| `GET /api/sources/oauth/:provider/init` | **PARTIAL** | `src/app/api/oauth/google/init/route.ts`, `oauth/strava/init/route.ts` (specifika per provider, inte unified pattern) | Vecka 7 (unify) |
| `GET /api/account` | ✓ | `src/app/api/account/route.ts` GET | Klart |
| `POST /api/account/delete` | ✓ | `src/app/api/account/delete/route.ts` POST | Klart |
| `POST /api/account/restore` | **SAKNAS** | — | Vecka 8 |
| `GET /api/export/sref` | ✓ | `src/app/api/export/sref/route.ts` GET | Klart |
| `GET /api/export/ai-context` | ✓ | `src/app/api/export/ai-context/route.ts` GET | Klart |

### Not: `/api/chat/stream`

Markerad **DEPRECATED INTERNAL** per [`CHAT_PIPELINE_DEPRECATION_2026-05-16`](CHAT_PIPELINE_DEPRECATION_2026-05-16.md) **för web-konsumenten**. iOS-konsumenten är annan situation — själva iOS-appen ÄR en chat-yta enligt build-planens §4 ("Samtal — kärnupplevelsen"). Pipelinen kvarstår funktionellt; deprecation gäller bara web-UI som kommer rivas vid iOS-port.

---

## Vad som ska byggas (prioriterat)

### Vecka 5 — Auth (3 nya endpoints, ~2-3 dagar)

**`POST /api/auth/apple`** — Apple Sign-in token-exchange
- Validerar Apple-id-token mot Apple OIDC-metadata (https://appleid.apple.com/auth/keys)
- Skapar eller hittar `users`-rad
- Returnerar Bearer-JWT (jose-baserat, samma format som befintlig NextAuth-session)
- Auth.js v5 har Apple-provider — kan användas direkt via `signIn("apple", {idToken})`
- Estimat: 1 dag

**`POST /api/auth/refresh`** — token-rotation
- Accepterar utgående token (om <30d sedan utgivning)
- Returnerar ny token med fresh expiry
- Estimat: 0.5 dag

**`DELETE /api/auth/session`** — REST logout
- Wrappar NextAuth signout-flöde i REST-endpoint
- Estimat: 0.25 dag

### Vecka 7 — Sources (3 nya + 1 unify, ~2-3 dagar)

**`GET /api/sources`** — lista kopplade källor + status
- Aggregerar data från `connected_sources`-tabell + per-källa lastSyncedAt
- Estimat: 0.5 dag

**`POST /api/sources/healthkit/sync`** — HealthKit-data-ingest
- Stora request-payloads (sleep, heartRate, hrv, steps)
- Måste validera schema strikt + scrub:a PII
- Skickar genom `extractFactsFromTurn`-pipeline eller direkt till `source_observed`-facts (TBD design)
- Estimat: 1.5 dagar (designval + implementering)

**`DELETE /api/sources/:id`** — koppla från källa
- Markerar källa som disconnected, behåller historik
- Estimat: 0.5 dag

**Unify `GET /api/sources/oauth/:provider/init`** — generisk pattern
- Konsoliderar befintliga `oauth/google/init` + `oauth/strava/init` till en provider-parametrar-erade route
- Estimat: 0.5 dag

### Vecka 8 — Account-restore + tråd-export (2 nya, ~1 dag)

**`POST /api/account/restore`** — återställ pending-delete-konto
- Wrappar existing soft-delete-restore-logik från Server Action
- Estimat: 0.5 dag

**`GET /api/threads/:id/export`** — per-tråd-markdown-export
- Återanvänder `formatThreadAsMarkdown` från `src/lib/conversation/`
- Estimat: 0.5 dag

---

## Saker som behöver designval innan implementation

### HealthKit-sync-flöde
`POST /api/sources/healthkit/sync` är största okända. Frågor:

1. **Real-time vs batch?** Skickar iOS-klient varje sample direkt, eller dagliga batches?
2. **PII-scrubning på server eller klient?** Hjärtfrekvens-värden + tidsstämplar är PII.
3. **Storage-format?** Direkt i nya `source_samples`-tabell, eller transformeras till `source_observed`-facts via extractFactsFromTurn?
4. **Sample-frekvens-limit?** HealthKit kan ge tusentals samples/dag — rate-limit på serversidan?

Föreslår: design-session vecka 6 (mellan auth-arbete vecka 5 och source-arbete vecka 7).

### Apple Sign-in vs befintlig magic-link
NextAuth v5 kan stödja båda parallellt — magic-link via Resend för web-fall (om kvar), Apple Sign-in för iOS. Båda producerar samma `users`-rad om email matchar. **TBD:** om magic-link också ska finnas på iOS som backup, eller bara Apple Sign-in.

### Bearer-JWT-format
IOS_API_SPEC säger `accessToken: "eyJ..."`. Befintlig NextAuth använder session-cookies. iOS behöver Bearer-token. Måste implementera token-generering + verifiering för REST-routes (medan web-routes fortsätter med cookies).

---

## Vad detta dokument INTE adresserar

- Implementations-detaljer per endpoint (request/response-schemas finns i IOS_API_SPEC)
- iOS-klient-sidan (Swift-kod) — separat repo `selvra-ios` när skapas vecka 4
- Push-notification-design (paused enligt build-plan §1)
- Subscription/StoreKit-design (vecka 21+)

---

## Refs

- [`IOS_API_SPEC_2026-05-16.md`](IOS_API_SPEC_2026-05-16.md) — request/response per endpoint
- [`IOS_API_READINESS_2026-05-16.md`](IOS_API_READINESS_2026-05-16.md) — ursprunglig audit
- [`SELVRA_IOS_V1_BUILD_PLAN_2026-05-16.md`](SELVRA_IOS_V1_BUILD_PLAN_2026-05-16.md) §5 — vecko-sekvens
- [`CHAT_PIPELINE_DEPRECATION_2026-05-16.md`](CHAT_PIPELINE_DEPRECATION_2026-05-16.md) — kontext för chat-pipeline-status
