# Bearer-JWT vs session-cookie — design

**Datum:** 2026-05-17
**Status:** Design-doc innan implementation. Vecka 5 i SELVRA_IOS_V1_BUILD_PLAN.
**Beror på:** [`IOS_AUTH_COEXISTENCE_DESIGN_2026-05-17.md`](IOS_AUTH_COEXISTENCE_DESIGN_2026-05-17.md), befintlig Auth.js v5-session-strategi.

---

## Vad vi designar

iOS-klienten behöver Bearer-token för REST-anrop. Web-klienten använder NextAuth session-cookies. Båda måste fungera mot samma backend utan att slå sönder varandra.

Tre beslut:

1. Token-format (JWT vs opaque)
2. Sign-algoritm + expiry + refresh
3. Lagring på iOS-klient + server-side validation

---

## Designval 1 — Token-format

### Alternativ

**A. JWT (signerad, klient-läsbar).**
- Pro: Stateless server-validation (snabbt), standard
- Pro: iOS-klient kan introspektera (t.ex. `expires_at` utan API-anrop)
- Con: Inte revokerbar utan token-blocklist (eller short-lived + refresh)
- Con: Större size än opaque

**B. Opaque token (random string mot DB-lookup).**
- Pro: Direkt revokerbar (DELETE från DB)
- Pro: Liten storlek
- Con: Server-roundtrip per validation (caching kan mitigera)
- Con: Inte introspektabel utan API

### Beslut: **JWT med short-TTL + refresh**

JWT eftersom:
- Selvra-protocols token-modell är redan JWT (MCP-server, connect-flow PR #34)
- Konsistent stack: alla våra tokens är JWTs
- iOS-app kan visa expiry utan extra API-anrop

Mitigera revocation-svaghet med:
- **Short TTL** — 30 minuter access-token (vs 30 dagar för MCP-tokens)
- **Refresh-token** med längre TTL — 30 dagar, lagras säkert på iOS
- **Revocation-table** för medvetna logout/revocation (kollas vid varje refresh, inte vid varje access)

---

## Designval 2 — Sign-algoritm + expiry + refresh

### Sign-algoritm

| Alg | Pro | Con |
|---|---|---|
| HS256 (HMAC) | Snabb, enkel | Symmetric — server och alla validators delar samma secret |
| RS256 (RSA) | Asymmetric (publik nyckel kan verifiera utan att signera) | Större tokens, långsammare |
| ES256 (ECDSA) | Asymmetric + mindre nyckel/token | Kortare etablerad än RSA |

### Beslut: **HS256**

Konsistent med selvra-protocol (`MCP_JWT_SECRETS` använder HS256). Endast en validator (selvra-app:s backend) — ingen vinst med asymmetric just nu.

Om vi senare exponerar token-validation för tredje part (annan backend som vill autentisera selvra-app-användare), byter vi till RS256/ES256 utan att bryta klienten.

### Expiry-strategi

| Token | TTL | Refresh? |
|---|---|---|
| Access-token | 30 min | Nej (måste refresh:as) |
| Refresh-token | 30 dagar | Roterar vid varje refresh (anti-replay) |

Access-token 30 min ger fenster för revocation utan att vara störande. iOS-klient håller refresh-token i Keychain, refresh:ar transparent.

### Refresh-flow

```
1. iOS gör request med access-token
2. Backend validerar — om expired → 401
3. iOS detekterar 401, kör POST /api/auth/refresh med refresh-token
4. Backend:
   a. Validerar refresh-token (signature + expiry + revocation-check)
   b. Issuerar NY access-token + NY refresh-token (roterar)
   c. Markerar gamla refresh-token som consumed
   d. Returnerar nya
5. iOS sparar nya, retry:ar original-request
```

### JWT-claim-shape

Konsistent med selvra-protocol MCP-tokens (åter-användbart kod):

```json
{
  "sub": "user-uuid",                     // user id
  "tid": "tenant-uuid",                   // tenant (Selvra-positioneringen — varje user har egen tenant)
  "iss": "selvra-app",                    // issuer
  "iat": 1726531200,                      // issued-at
  "exp": 1726533000,                      // expires-at (30 min för access)
  "jti": "uuid",                          // JWT-ID (för revocation-tracking)
  "scope": "user",                        // alltid "user" för iOS-tokens (skild från MCP write-scope)
  "type": "access" | "refresh",           // token-typ
  "token_version": 1                      // schema-version för future-proofing
}
```

---

## Designval 3 — Lagring på iOS + server-side validation

### iOS-side: Keychain

Både access-token och refresh-token lagras i iOS Keychain (`kSecClassGenericPassword`).

```swift
// Keychain-access via standard iOS-pattern
let query: [String: Any] = [
  kSecClass as String: kSecClassGenericPassword,
  kSecAttrAccount as String: "selvra_access_token",
  kSecAttrService as String: "io.selvra.app",
  kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
]
```

`kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` betyder:
- Token tillgänglig efter första unlock-efter-omstart (inte bakgrund-tillgänglig om enheten är låst)
- INTE syncad till iCloud Keychain (enhets-bunden)

Refresh-token raderas vid logout. Access-token rensas vid expiry eller logout.

### Server-side: middleware

Befintlig `auth()` från NextAuth fungerar för cookie-based requests. För Bearer-token-routes behövs separat middleware:

```typescript
// src/lib/auth/bearer.ts (ny)
import { jwtVerify, SignJWT } from 'jose'

const ACCESS_TOKEN_TTL_SECONDS = 30 * 60        // 30 min
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 3600 // 30 dagar

const secret = new TextEncoder().encode(process.env.AUTH_BEARER_SECRET!)

export async function verifyBearerToken(token: string): Promise<{ userId: string; tenantId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'selvra-app',
    })
    if (payload.type !== 'access') return null
    // Revocation-check (cache:ad lookup)
    if (await isTokenRevoked(payload.jti as string)) return null
    return { userId: payload.sub as string, tenantId: payload.tid as string }
  } catch {
    return null
  }
}

export async function issueBearerTokens(userId: string, tenantId: string) {
  const accessJti = crypto.randomUUID()
  const refreshJti = crypto.randomUUID()
  
  const now = Math.floor(Date.now() / 1000)
  
  const accessToken = await new SignJWT({
    sub: userId, tid: tenantId, jti: accessJti, type: 'access',
    iss: 'selvra-app', scope: 'user', token_version: 1,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + ACCESS_TOKEN_TTL_SECONDS)
    .sign(secret)
  
  const refreshToken = await new SignJWT({
    sub: userId, tid: tenantId, jti: refreshJti, type: 'refresh',
    iss: 'selvra-app', scope: 'user', token_version: 1,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + REFRESH_TOKEN_TTL_SECONDS)
    .sign(secret)
  
  // Lagra refresh-jti i DB för rotation + revocation
  await db.insert(refreshTokens).values({
    jti: refreshJti, userId, issuedAt: new Date(),
    expiresAt: new Date((now + REFRESH_TOKEN_TTL_SECONDS) * 1000),
  })
  
  return { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS }
}
```

Route-protection wrappar:

```typescript
// I varje REST-route som ska Bearer-skyddas
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return errorResponse(401, 'UNAUTHORIZED')
  
  const claims = await verifyBearerToken(token)
  if (!claims) return errorResponse(401, 'UNAUTHORIZED')
  
  // Använd claims.userId + claims.tenantId
  // ...
}
```

### Coexistens med cookies (web)

Routes som ska stödja BÅDA: kolla cookie först, sedan Bearer:

```typescript
export async function getUser(req: Request): Promise<{ userId: string; tenantId: string } | null> {
  // 1. Försök cookie (NextAuth-session)
  const session = await auth()
  if (session?.user?.id) {
    // Hämta tenantId från DB-lookup på user
    const user = await db.query.users.findFirst({ where: eq(users.id, session.user.id) })
    if (user?.selvraTenantId) {
      return { userId: session.user.id, tenantId: user.selvraTenantId }
    }
  }
  
  // 2. Fallback Bearer
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return verifyBearerToken(authHeader.replace('Bearer ', ''))
  }
  
  return null
}
```

iOS-routes använder bara Bearer. Web-routes använder cookies. Routes som vill stödja båda anropar `getUser`.

---

## Ny env-var krävs

```
AUTH_BEARER_SECRET=<openssl rand -hex 32>
```

Separat från AUTH_SECRET (NextAuth-cookie-secret) av två skäl:
1. Bearer-flödet kan revolveras oberoende av cookie-secret
2. Olika TTL-modeller (cookies är längre-lived)

Carl-action när vi implementerar vecka 5: generera + lägg på Vercel.

---

## DB-tabell krävs

Ny tabell `refresh_tokens` för rotation + revocation:

```sql
CREATE TABLE refresh_tokens (
  jti UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  consumed_at TIMESTAMP WITH TIME ZONE,        -- när token förbrukats vid refresh
  rotated_to_jti UUID                          -- pekare till efterträdaren (audit)
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_active ON refresh_tokens(user_id) WHERE consumed_at IS NULL AND revoked_at IS NULL;
```

Drizzle-migration som ny fil `drizzle/0007_refresh_tokens.sql` vid vecka 5-implementation.

---

## Säkerhets-considerations

- **Refresh-token replay-skydd:** rotering vid varje refresh + `consumed_at`-flagga. Om gammal refresh-token används efter rotering → revokera ALLA tokens för user (säkerhetsbrott antaget)
- **Access-token-läckage:** 30 min TTL begränsar exponering
- **Keychain-skydd:** kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly betyder att stulen-låst-enhet inte kan extrahera token
- **Inga Bearer-tokens i URLs:** alltid i Authorization-header (URLs läcker via logs/referrer)

---

## Vad detta INTE adresserar

- Per-device-token-management (vill vi se "5 enheter inloggade"-vy?) — vecka 8+ om relevant
- Token-revocation från web (`Settings → Sign out other devices`) — vecka 8+
- Multi-tenant-stöd för iOS-app (om en user kan ha flera tenants) — out-of-scope, en user = en tenant i v1

## Refs

- [`IOS_API_SPEC_2026-05-16.md`](IOS_API_SPEC_2026-05-16.md) — POST /api/auth/apple, POST /api/auth/refresh, DELETE /api/auth/session
- [`IOS_AUTH_COEXISTENCE_DESIGN_2026-05-17.md`](IOS_AUTH_COEXISTENCE_DESIGN_2026-05-17.md) — provider-coexistens (parad-doc)
- selvra-protocol `src/selvra/mcp/tokens.py` — JWT-pattern för MCP-side (åter-användbart)
- Auth.js v5: https://authjs.dev/getting-started/installation
- jose-library: https://github.com/panva/jose (befintligt i selvra-app)
