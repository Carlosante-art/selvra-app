# iOS-API Readiness Audit — selvra-app 2026-05-16

**Kontext:** Per [[feedback-backend-focus-2026-05-16]]: backend är iOS-portbar.
Detta dokument kartlägger vad en iOS-klient faktiskt skulle behöva från
selvra-app-backenden — och vad som saknas för att stödja det.

**Status:** Spec, ingen kod-ändring. Aktiveras vid iOS-strategi-beslut.

## 1. Befintliga API-routes (HTTP-endpoints)

| Route | Metod | Vad | iOS-redo? |
|---|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | Auth.js handlers (magic-link via Resend) | **Partial** — funkar för web, iOS behöver Sign-in-with-Apple parallellt |
| `/api/chat/stream` | POST | NDJSON-streaming chat | **Ja** — NDJSON parsbar av Swift `URLSession.bytes` |
| `/api/export/ai-context` | GET | Full-context JSON-export | **Ja** |
| `/api/export/sref` | GET | SREF v1-export | **Ja** |
| `/api/oauth/google/init` | GET | OAuth-init Google | **Partial** — redirect-baserad, iOS behöver native OAuth |
| `/api/oauth/google/callback` | GET | OAuth-callback | **Partial** — samma |
| `/api/oauth/strava/init` | GET | OAuth-init Strava | **Partial** |
| `/api/oauth/strava/callback` | GET | OAuth-callback | **Partial** |

## 2. Server Actions (Next.js-spec, ej iOS-konsumerbara)

| Server Action | Vad | iOS-port-behov |
|---|---|---|
| `sendMessage` (samtal) | Skicka chat-meddelande non-streaming | **Behöver REST-equivalent.** Streaming-vägen täcker användarcase men non-streaming behövs för fallback / retry / quick-tasks. |
| `newThread` | Skapa ny conversation | Trivial — kan vara POST /api/threads |
| `archiveThread` | Soft-archive | Trivial — PATCH /api/threads/:id |
| `deleteAccount` (account.ts) | GDPR-hård-radera | Säkerhetskritisk — behöver explicit REST-endpoint med stark auth |
| `restoreAccount` (account.ts) | Återställ pending-delete | Trivial |
| `redactMemoryFact` | Soft-delete fact | Trivial |
| `deleteConversationFact` | Soft-delete V1-fact | Trivial |

## 3. DB-queries som iOS-klient skulle behöva läsa via API

Konsument-API-routes som SAKNAS men behövs:

| Föreslagen route | Drizzle-query bakom | Prio |
|---|---|---|
| `GET /api/threads` | `listConversationsForUser` | Hög |
| `GET /api/threads/:id` | `getConversationOwned` | Hög |
| `GET /api/threads/:id/turns` | `fetchAllTurns` | Hög |
| `POST /api/threads/:id/messages` | non-stream `sendMessage`-equivalent | Hög |
| `POST /api/threads` | `createConversation` | Hög |
| `PATCH /api/threads/:id` | `updateConversationTitle` / `archiveConversation` | Medel |
| `DELETE /api/threads/:id` | hård delete (kaskaderar) | Medel |
| `GET /api/memory/facts` | `listMemoryFactsForUi` | Hög |
| `DELETE /api/memory/facts/:id` | `redactMemoryFact` | Hög |
| `GET /api/conversation-facts` | `listConversationFactsForUi` | Hög |
| `DELETE /api/conversation-facts/:id` | `deleteConversationFact` | Hög |
| `GET /api/account` | `getSubjectLifecycle` | Hög |
| `POST /api/account/delete` | `deleteAccount` | Hög |
| `POST /api/account/restore` | `restoreAccount` | Hög |

## 4. Auth-strategi för iOS

Magic-link via Resend funkar i web. iOS-behov:

- **Native Sign in with Apple** — Apple kräver det för Apple-konton (App Store Review §4.8).
- **Token-baserad session** (Bearer JWT) istället för cookie-baserad. iOS-app kan lagra access-token i Keychain.
- **Refresh-token-flöde** så användare inte loggas ut efter 30 dagar.

Tekniska konsekvenser:
- Auth.js är cookie/session-baserad → behöver pair med JWT-endpoint (`POST /api/auth/token` som accepterar Apple-id-token och returnerar Selvra-app-JWT).
- DATABASE_URL-kopplad user-tabell uppdateras med `apple_user_id`-fält när Sign-in-with-Apple används.
- Magic-link kvar för web; iOS får Apple som primärt.

## 5. Streaming-protokoll för iOS

`/api/chat/stream` returnerar NDJSON. iOS-konsumtion:

```swift
let (asyncBytes, response) = try await URLSession.shared.bytes(for: request)
for try await line in asyncBytes.lines {
    let event = try JSONDecoder().decode(StreamEvent.self, from: line.data(using: .utf8)!)
    // ...
}
```

Funkar utan ändringar. NDJSON är språkagnostisk.

## 6. Saker som SAKNAS i nuvarande backend för iOS

1. **REST-spegling av Server Actions** — alla actions behöver HTTP-endpoint-motsvarighet
2. **OpenAPI-spec / TypeScript-types-export** — så iOS-klient kan generera Swift-types
3. **Bearer-token-auth-handler** — JWT-validation som accepterar Apple-id-token
4. **Push-notifikation-infrastruktur** — APNs-integration. Pausad per konsumtions-tonalitet (anti-FOMO) men finns möjlighet för informativ push ("ditt brev från förra veckan är klart" eller "Garmin loggade en ny natt"). Behöver design innan bygge.
5. **Rate-limit per token** — nuvarande är per user_id via session. Token-baserad rate-limit behöver bygges.
6. **Pagination** — `listConversationsForUser` har limit men ingen cursor/offset. iOS-listor är scroll-baserade.

## 7. Saker som FUNKAR ut-of-the-box för iOS-port

1. **DB-schema + queries** — Drizzle är språkagnostisk
2. **LLM-pipeline (Mistral + tool-call + retry)** — backend-only
3. **Konstitutionellt enforcement** — `validateConsumerOutput` körs server-side, irrelevant för klient
4. **PII-scrub + Sentry-bridge** — server-only
5. **`extractFactsFromTurn`** — server-only
6. **`conversation_facts`-tabell** — språk-agnostisk
7. **Source-markup-parsing** — funkar både i Swift-klient (port av regex) och TypeScript

## 8. Estimerat arbete för iOS-port (backend-side)

| Område | Estimat | Pre-req |
|---|---|---|
| REST-endpoints för Server Actions | 1-2 dagar | Inget |
| OpenAPI-spec + Swift-types-generering | 0.5 dag | REST-endpoints |
| JWT/Bearer-auth-handler | 1 dag | Apple Developer-konto |
| Sign-in-with-Apple-integration | 1-2 dagar | JWT + Apple-konto |
| Pagination på listor | 0.5 dag | Inget |
| Push-notification-design + design-doc | 0.5 dag | Beslut om vilka triggers |
| APNs-implementation | 2-3 dagar | Push-design klar |
| **Total** | **6-10 dagar backend-arbete** | |

iOS-klient-bygget självt är separat (estimat 60-90 dagar för v1).

## 9. Vad detta inte säger

- Detta är inte ett beslut att bygga iOS
- Detta är inte en prioritetslista — det är inventering
- Inga implementations-tasks är aktiverade av detta dokument
- Per [[feedback-no-arch-drift]] krävs tre filter (pilot-blocker / klinisk
  efterfrågan / bandwidth) innan iOS-bygge påbörjas

## 10. Konkret rekommenderad första-fas vid iOS-go-beslut

1. Bygg REST-endpoints för befintliga Server Actions (1-2 dagar)
2. OpenAPI-spec + types (0.5 dag)
3. Pagination (0.5 dag)
4. iOS-klient kan börja konsumera samtidigt — backend och iOS i parallell

Auth-omarbetning (Apple Sign-in + JWT) kommer senare när iOS faktiskt
körs i TestFlight.
