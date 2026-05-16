# iOS API-spec — REST endpoints för selvra-ios-konsumtion

Per `SELVRA_IOS_V1_BUILD_PLAN_2026-05-16.md` §5 vecka 2-3 task 1.

Bygger på `IOS_API_READINESS_2026-05-16.md` (audit av befintliga endpoints +
saknade routes). Denna doc är konkret REST-spec: URL-paths, request-bodies,
response-shapes, auth, error-codes. Implementationsorder för selvra-app
backend när iOS-bygget kräver dem.

## Auth

### `POST /api/auth/apple`
Apple Sign-in token-exchange. iOS-klient skickar Apple-id-token från
`ASAuthorizationAppleIDProvider`. Backend validerar mot Apple, hittar
eller skapar `users`-rad, returnerar Bearer-JWT.

**Request:**
```json
{
  "appleIdToken": "eyJ...",
  "appleUserId": "001234.abc...",
  "email": "carl@privaterelay.appleid.com",
  "fullName": { "givenName": "Carl", "familyName": "K" }
}
```

**Response 200:**
```json
{
  "accessToken": "eyJ...",
  "tokenType": "Bearer",
  "expiresIn": 2592000,
  "user": {
    "id": "uuid",
    "email": "carl@privaterelay.appleid.com",
    "createdAt": "2026-05-16T10:00:00Z"
  }
}
```

**Error 401:** Apple-token-validation failed.
**Error 500:** Backend-fel.

### `POST /api/auth/refresh`
Refresh access-token. Använder befintlig session-cookie eller refresh-token.

### `DELETE /api/auth/session`
Logout. Invalidera token.

## Threads (samtal-trådar)

### `GET /api/threads`
Lista trådar för current user.

**Query-params:**
- `archived=true|false` (default false)
- `query=string` (titel-search)
- `limit=number` (default 20, max 100)
- `cursor=string` (paginering)

**Response 200:**
```json
{
  "threads": [
    {
      "id": "uuid",
      "title": "Söndag morgon",
      "lastMessageAt": "2026-05-16T08:00:00Z",
      "archivedAt": null,
      "messageCount": 12
    }
  ],
  "nextCursor": "string|null"
}
```

### `POST /api/threads`
Skapa ny tråd.

**Response 201:**
```json
{ "id": "uuid", "createdAt": "..." }
```

### `GET /api/threads/:id`
Hämta tråd (ägar-validerat).

**Response 200:**
```json
{
  "id": "uuid",
  "title": "...",
  "startedAt": "...",
  "lastMessageAt": "...",
  "archivedAt": null
}
```

**Error 404:** Tråd finns ej eller tillhör annan user.

### `PATCH /api/threads/:id`
Uppdatera tråd-metadata.

**Request:** `{ "title": "...", "archivedAt": "..." | null }`

### `DELETE /api/threads/:id`
Hård-radera tråd + alla turns (cascade).

### `GET /api/threads/:id/turns`
Hämta alla turns kronologiskt.

**Response 200:**
```json
{
  "turns": [
    {
      "id": "uuid",
      "turnIndex": 0,
      "userText": "...",
      "selvraText": "...",
      "sourcesConsulted": [{ "sourceAiId": "garmin" }],
      "createdAt": "..."
    }
  ]
}
```

## Chat (streaming)

### `POST /api/chat/stream`
Befintlig endpoint, intakt från Fas 1.

**Request:**
```json
{
  "conversationId": "uuid|null",
  "text": "..."
}
```

**Response:** NDJSON-stream (token-för-token), Content-Type
`application/x-ndjson; charset=utf-8`.

Event-types per rad:
- `{"type":"meta","conversationId":"uuid"}` — för ny tråd
- `{"type":"memory_ack","text":"..."}` — kortslut memory-request
- `{"type":"stream_start","sources":[...]}` — LLM börjar streama
- `{"type":"chunk","text":"..."}` — token
- `{"type":"final","selvraText":"...","title":"..."}` — persist klar
- `{"type":"invalidated","selvraText":"..."}` — validation-fail, fallback
- `{"type":"error","message":"..."}`

**iOS-konsumtion (Swift):**
```swift
let (asyncBytes, _) = try await URLSession.shared.bytes(for: request)
for try await line in asyncBytes.lines {
  guard let data = line.data(using: .utf8) else { continue }
  let event = try JSONDecoder().decode(StreamEvent.self, from: data)
  // dispatch per event.type
}
```

## Minne

### `GET /api/memory/facts`
Lista user-stated + source-observed facts.

**Query-params:**
- `factType=user_stated|source_observed` (filter)
- `sourceName=string` (filter på källa-namn)
- `limit=number`

**Response 200:**
```json
{
  "facts": [
    {
      "id": "uuid",
      "factText": "...",
      "factType": "user_stated|source_observed",
      "sourceName": "garmin|null",
      "threadId": "uuid",
      "turnId": "uuid",
      "extractedAt": "..."
    }
  ]
}
```

### `DELETE /api/memory/facts/:id`
Soft-delete fact. `userDeletedAt = NOW()`.

### `GET /api/memory/explicit`
Lista explicita user-skrivna minnes-fakta (conversation_memory_facts).

### `DELETE /api/memory/explicit/:id`
Soft-delete explicit fakta.

## Källor

### `GET /api/sources`
Lista kopplade källor + status.

**Response 200:**
```json
{
  "sources": [
    {
      "id": "healthkit",
      "name": "Apple Health",
      "status": "connected|pending|disconnected",
      "lastSyncedAt": "...",
      "permissions": ["sleep", "heartRate", "hrv", "steps"]
    }
  ]
}
```

### `POST /api/sources/healthkit/sync`
Klient skickar HealthKit-data (privacy: data passerar backend för
extractFactsFromTurn-processering, lagras enligt SREF-spec).

**Request:**
```json
{
  "syncedAt": "...",
  "metrics": {
    "sleep": [{ "date": "...", "durationHours": 5.7, "quality": "..." }],
    "heartRate": [{ "timestamp": "...", "bpm": 64 }],
    "hrv": [{ "timestamp": "...", "ms": 38 }]
  }
}
```

### `DELETE /api/sources/:id`
Koppla från källa. All historik bevaras men ingen ny data accepteras.

### `GET /api/sources/oauth/:provider/init`
För Garmin/Strava/Google (Fas 2). Returnerar OAuth-URL klienten ska
öppna i Safari/in-app-browser.

## Account

### `GET /api/account`
Hämta konto-info + subject-lifecycle-status.

### `POST /api/account/delete`
Markera konto för radering. Soft-delete med 30-dagars retention-fönster
för restore.

### `POST /api/account/restore`
Återställ pending-delete-konto.

## Export

### `GET /api/export/sref`
SREF v1 JSON (komplett representation).

**Response:** `application/json` med Content-Disposition `attachment; filename=...`

### `GET /api/export/ai-context`
Komprimerad context-export för annan AI.

### `GET /api/threads/:id/export`
Per-tråd-export som markdown.

## Common error-codes

| Code | HTTP | Mening |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing/invalid Bearer-token |
| `FORBIDDEN` | 403 | User saknar access till resurs |
| `NOT_FOUND` | 404 | Resurs finns ej eller tillhör annan user |
| `RATE_LIMITED` | 429 | För många requests, retry efter `Retry-After`-header |
| `LLM_PROVIDER_FAILED` | 502 | Mistral/upstream-fel |
| `CIRCUIT_OPEN` | 503 | Selvra-protokoll fail-fast (tillfälligt) |
| `INTERNAL_ERROR` | 500 | Backend-fel, se Sentry |

## Headers

**Required från klient:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`
- `Accept-Language: sv` (svenska v1)

**Returnerade från backend:**
- `Content-Type` per endpoint
- `X-Request-Id: uuid` (för debugging)
- Säkerhets-headers från `next.config.ts` (CSP, HSTS, X-Frame-Options)

## Implementation-prio (när iOS-bygget startar)

| Endpoint | Prio | Backend-status |
|---|---|---|
| `POST /api/auth/apple` | Vecka 5 | NY — bygg när Apple Sign-in implementeras |
| `GET /api/threads` | Vecka 5 | NY — wrappa `listConversationsForUser` |
| `POST /api/threads` | Vecka 5 | NY — wrappa `createConversation` |
| `GET /api/threads/:id` | Vecka 5 | NY — wrappa `getConversationOwned` |
| `GET /api/threads/:id/turns` | Vecka 5 | NY — wrappa `fetchAllTurns` |
| `POST /api/chat/stream` | KLART | Befintligt |
| `GET /api/memory/facts` | Vecka 6 | NY — wrappa `listConversationFactsForUi` |
| `DELETE /api/memory/facts/:id` | Vecka 6 | NY — wrappa `deleteConversationFact` |
| `GET /api/sources` | Vecka 7 | NY — design pending |
| `POST /api/sources/healthkit/sync` | Vecka 7 | NY — design pending |
| `GET /api/export/sref` | KLART | Befintligt |
| `POST /api/account/delete` | Vecka 8 | Befintlig Server Action, REST-wrap behövs |

## Bevarat från IOS_API_READINESS-audit

- Auth-strategi (Apple Sign-in + JWT/Bearer)
- 14 saknade endpoints listade
- 6-10 dagars backend-arbete-estimat
- Push-notification-design pausad tills constitutional-review
