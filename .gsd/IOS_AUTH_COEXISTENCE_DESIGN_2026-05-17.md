# Apple Sign-in + magic-link coexistens

**Datum:** 2026-05-17
**Status:** Design-doc innan implementation. Vecka 5 i SELVRA_IOS_V1_BUILD_PLAN.
**Beror på:** befintlig Auth.js v5-konfiguration (`src/lib/auth/config.ts`), [`IOS_AUTH_BEARER_JWT_DESIGN_2026-05-17.md`](IOS_AUTH_BEARER_JWT_DESIGN_2026-05-17.md).

---

## Vad vi designar

Hur Apple Sign-in (för iOS-klient) och magic-link via Resend (för web) ska coexistera utan att skapa duplicata user-rader eller hosting-konflikt mellan auth-providers.

Tre frågor måste lösas:

1. Får båda providers finnas på samma user-konto?
2. Vad händer om Apple Sign-in matchar en email som redan har magic-link-konto (eller tvärtom)?
3. Vilken provider är "primär" på respektive yta?

---

## Designval 1 — Båda providers på samma konto?

### Alternativ

**A. En provider per user-konto.** Antingen Apple eller magic-link, inte båda.
- Pro: Enkel mental modell, ingen länkning-logik
- Con: Carl loggar in via Apple på iOS men kan inte logga in via web (eller måste skapa nytt konto med ny email)

**B. Flera providers per user-konto (account-linking).** Användaren kan ha både Apple och magic-link på samma konto.
- Pro: Smidig multi-platform — samma konto på iOS och web
- Con: Komplexitet vid första-Apple-sign-in mot existerande magic-link-konto

### Beslut: **B — account-linking**

Auth.js v5 stöder account-linking out-of-the-box via `accounts`-tabellen i Drizzle-adaptern. Implementation kräver:

- `accounts`-tabell (Drizzle-adapter skapar default — verifiera finns)
- `AUTH_LINK_ACCOUNTS=true` (eller motsv. konfiguration — kolla Auth.js v5-docs)
- Konflikt-strategi (se nedan)

---

## Designval 2 — Konflikt vid första Apple Sign-in mot existerande email

Scenario: Carl har skapat konto via magic-link med `carl@example.com`. Nu loggar han in via Apple Sign-in. Apple returnerar `email: carl@example.com` (verified).

### Tre möjliga utfall

**A. Auto-merge.** Apple-providern länkas tyst till befintliga user-radens `accounts`-tabell.
- Pro: Smidig
- Con: Säkerhets-risk om Apples email-verifiering är svag eller spoofas (osannolikt men möjligt)

**B. Manuell merge.** Användaren får ett mail "vill du länka Apple till ditt existerande konto?" — kräver klick på länk i mailet.
- Pro: Säker
- Con: Friktion för användare som faktiskt äger båda

**C. Reject med klar feedback.** Apple Sign-in failar med "ett konto finns redan med denna email — logga in via magic-link och länka från Settings".
- Pro: Säkrast, ger användaren kontroll
- Con: Mest friktion, kräver UI för länkning från inloggat läge

### Beslut: **C med override-pattern**

Default: **C (reject)** — Apple Sign-in matchar redan-existerande email → 409 Conflict med tydlig felmeddelande och länk till "logga in via magic-link och länka Apple från Settings".

Settings-länkning från inloggat läge: enkelt — UI knapp "Länka Apple", Auth.js v5 stöder via `linkAccount`-flow.

Detta är konsistent med **[[feedback_avsiktlig_friktion_i_konsekvens_2026-05-17]]** — kontot är säkerhetskritisk resurs, friktion vid auto-linking är feature.

För nya användare (ingen befintlig email): Apple Sign-in skapar nytt konto automatiskt — full friktionsfri-väg (det är **flöde**, inte **konsekvens**).

---

## Designval 3 — Vilken provider är primär per yta?

### Beslut

| Yta | Primär provider | Fallback |
|---|---|---|
| iOS-app | Apple Sign-in | Ingen — iOS visar bara Apple-knapp |
| Web (selvra-app.vercel.app) | Magic-link | Ingen i v1 — Apple Sign-in på web är vecka-13+-feature om alls |

Skäl:
- iOS HIG-rekommendation: native Apple Sign-in när tillgänglig
- Apple App Store-policy: appar med social-login MÅSTE erbjuda Apple Sign-in
- Web saknar Apple-app-integration som krävs för smidigt Apple Sign-in (kan ändras senare)

### iOS-only-frågor

- Email-relay (`@privaterelay.appleid.com`) — accepteras som user-email, men `MAIL_FROM` måste vara verifierad SPF/DKIM-konfig för att Apple ska forwarda
- "Sign in with Apple" via web (för iOS-user som loggar in på web utan att vara på Apple-enhet) — pushas till v2

---

## Tekniskt schema (Drizzle)

Befintliga tabeller:

```typescript
user                  // id, email, name, image, emailVerified
account               // userId, type, provider, providerAccountId, ... (för OAuth)
verificationToken     // för magic-link
session               // för aktiva sessions (om JWT-strategy: oanvänd)
```

Auth.js v5 + Drizzle-adapter skapar dessa via `@auth/drizzle-adapter`. Verifiera att `account`-tabellen redan finns (skulle skapats i migration 0000).

**Lägg till om saknas:** ingen extra schema-ändring förväntad. Account-linking använder bara befintlig `account`-tabell.

---

## Auth.js v5 konfig-ändringar

`src/lib/auth/config.ts` behöver:

```typescript
import Apple from "@auth/core/providers/apple"
import Resend from "@auth/core/providers/resend"
// ... existing imports

export const authConfig: NextAuthConfig = {
  providers: [
    Resend({
      from: process.env.MAIL_FROM!,
      apiKey: process.env.RESEND_API_KEY!,
    }),
    Apple({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
      // Apple-specifik — JWT signing-key från Apple Developer Console
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Konflikt-check för Apple-sign-in mot existerande email
      if (account?.provider === 'apple' && profile?.email) {
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, profile.email),
        })
        if (existingUser) {
          // Kolla om Apple redan länkat
          const existingAppleAccount = await db.query.accounts.findFirst({
            where: and(
              eq(accounts.userId, existingUser.id),
              eq(accounts.provider, 'apple')
            ),
          })
          if (!existingAppleAccount) {
            // Reject med specifikt error-state
            throw new Error('ACCOUNT_EXISTS_USE_MAGIC_LINK_TO_LINK')
          }
        }
      }
      return true
    },
  },
  // ... rest
}
```

REST-endpoint `POST /api/auth/apple` (per IOS_API_SPEC) wrappar Auth.js signIn-flow för iOS-konsumtion:

```typescript
export async function POST(req: Request) {
  const { appleIdToken, appleUserId, email, fullName } = await req.json()
  
  // Validera Apple-token mot Apple OIDC-keys
  const verified = await verifyAppleIdToken(appleIdToken)
  if (!verified) return errorResponse(401, 'UNAUTHORIZED')
  
  try {
    // signIn returnerar session eller throw
    const result = await signIn('apple', {
      // Apple-providers konfig får detta från appleIdToken
      redirect: false,
    })
    
    // Issuera Bearer-JWT för iOS (separate från web session-cookie)
    const bearerToken = await issueBearerJWT(result.user)
    
    return Response.json({
      accessToken: bearerToken.token,
      tokenType: 'Bearer',
      expiresIn: bearerToken.expiresIn,
      user: { id: result.user.id, email: result.user.email, createdAt: result.user.createdAt },
    })
  } catch (err) {
    if (err.message === 'ACCOUNT_EXISTS_USE_MAGIC_LINK_TO_LINK') {
      return errorResponse(409, 'ACCOUNT_EXISTS_USE_MAGIC_LINK_TO_LINK', {
        message: 'Ett konto finns redan med denna email. Logga in via magic-link och länka Apple från Settings.',
      })
    }
    throw err
  }
}
```

Bearer-JWT-utgivning detaljerad i parad-design-doc.

---

## Apple Developer Console-krav

För att Apple Sign-in ska fungera måste Carl konfigurera:

1. **App ID** med Apple Sign-in capability (bundle `io.selvra.app`)
2. **Service ID** för web (om Apple Sign-in på web senare)
3. **Sign-in-with-Apple-key** (`.p8`-fil) — används som `APPLE_CLIENT_SECRET` (signerad JWT)
4. **Configure Sign in with Apple** för App ID
5. Om email-relay: konfigurera private email service domain

Allt detta kräver **AB-aktivt + Apple Developer Program-registrering**. Pausat tills AB.

---

## Vad detta INTE adresserar

- Apple Sign-in på web (vecka 13+ feature)
- Account-unlinking (kan användaren ta bort Apple-länkning från sitt konto?) — vecka 8 om relevant
- "Förlorad Apple-tillgång" (apple-konto raderat) — kan användaren återfå access via magic-link? Bör testas i TestFlight
- Multi-device-session-management (Carl på iOS + iPad + web samtidigt) — pushas till efter v1 om problem

## Refs

- [`IOS_API_SPEC_2026-05-16.md`](IOS_API_SPEC_2026-05-16.md) — POST /api/auth/apple
- [`IOS_API_GAP_ANALYSIS_2026-05-17.md`](IOS_API_GAP_ANALYSIS_2026-05-17.md) — vecka 5 prio
- [`IOS_AUTH_BEARER_JWT_DESIGN_2026-05-17.md`](IOS_AUTH_BEARER_JWT_DESIGN_2026-05-17.md) — token-format-design (parad)
- selvra-app `.gsd/feedback_avsiktlig_friktion_i_konsekvens_2026-05-17.md` — konflikt-strategi
- Auth.js v5 docs — account-linking: https://authjs.dev/getting-started/installation
- Apple Sign-in for Apps: https://developer.apple.com/sign-in-with-apple/
