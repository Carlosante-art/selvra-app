# Backend-audit — selvra-app 2026-05-16

Snapshot från fast-check-runda 2026-05-16 (backend-fokus-spår).

## NPM vulnerabilities

4 moderate. Inga high/critical.

| Pkg | Severity | Påverkar prod? | Fix |
|---|---|---|---|
| esbuild + @esbuild-kit/* (via drizzle-kit) | moderate | **Nej** (devDep) | Uppgradera drizzle-kit nästa iteration |
| esbuild (via next devbuild) | moderate | **Nej** | Auto-uppgraderas med next |
| next | moderate | Ja (vid SSR) | Uppgradera till nästa minor när stable |
| @sentry/nextjs | moderate | Ja | Beror på next-uppgradering |

**Beslut:** Ingen `npm audit fix --force` nu. Risk för regression i Sentry + Auth.js > värdet av fix. Schemalägg uppgradering i en separat audit-PR.

## Bundle-storlek baseline

| Chunk | Storlek |
|---|---|
| Största JS-chunk | 223 KB |
| Total JS (top 10) | ~750 KB |
| CSS | 33 KB |

För Next.js + Tailwind v4 + Mistral SDK + Sentry är detta acceptabelt. Inte värt deep-optimization just nu.

**Beslut:** Dokumentera som baseline. Re-mät vid större ändringar.

## Säkerhets-headers

**Tillagda 2026-05-16:**
- `X-Frame-Options: DENY` — anti-clickjacking
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` — HTTPS-only
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
- `Content-Security-Policy` med:
  - `default-src 'self'`
  - `script-src 'self' 'unsafe-inline' https://*.sentry.io`
  - `connect-src 'self' https://*.sentry.io https://api.mistral.ai https://*.up.railway.app`
  - `frame-ancestors 'none'`

**Trade-offs:**
- `'unsafe-inline'` på script-src behövs av Next.js bootstrap. Kan tightas senare med nonces.
- `'unsafe-inline'` på style-src behövs av Tailwind v4 + Next.js. Kan tightas senare.

**Verifierat efter tillägg:** 291/291 tester gröna, build ✓, tsc + eslint rent.

## Deploy-status

| Lager | Status |
|---|---|
| Production deploy | ✓ `selvra-app.vercel.app` (refactor-branchen 2026-05-16) |
| Env-vars | ✗ 0 satta (Carl-action via `scripts/vercel-env-push.sh`) |
| Migration 0000-0003 | ✗ Ej körda mot Railway-DB |
| Sentry capture | ✗ Init OK men `SENTRY_DSN` ej satt |

## Backend-arbete utfört 2026-05-16

1. `extractFactsFromTurn` v2 med Mistral json_schema-mode + few-shot examples (+6 tester)
2. iOS-API-readiness audit i `.gsd/IOS_API_READINESS_2026-05-16.md`
3. Säkerhets-headers i `next.config.ts`
4. Backend-audit-doc (detta)

**Tester totalt:** 291 (var 285 innan v2)

## Skuld kvar (icke-blocking)

- npm-vulns (moderate) — uppgradering i separat PR
- CSP-tightning — nonces istället för 'unsafe-inline' när Next.js stöder det stable
- Push-notification-design — pausad tills iOS-strategi beslutas
- Pagination på listor — pausad tills iOS-prio
- REST-spegling av Server Actions — pausad tills iOS-go

## Inget mer omedelbart backend-arbete utan ny input

Det jag rört (extract-facts v2, iOS-audit, säkerhets-headers, backend-audit) är safe-to-merge. Resten av roadmap ligger antingen i andra repon (~/selvra, ~/stillra-server som du själv jobbar i) eller är blockad av iOS-strategi-beslut.

Carl-action önskad:
1. Sätt env-vars + kör migration + verifiera E2E
2. Eller besluta iOS-tidshorisont så jag kan börja REST-spegling
3. Eller annan riktning
