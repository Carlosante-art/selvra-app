# Vercel deploy — selvra-app 2026-05-15

## Status

**Projektet är länkat och deployat** (build = grön, runtime = saknar env-vars).

| Attribut | Värde |
|---|---|
| Project | `selvra-app` |
| Org | `carlosante-arts-projects` |
| Project ID | `prj_cFlz8yfyF6MBZVNFW6xH7nUbYkNr` |
| Live URL | https://selvra-app.vercel.app |
| Unique URL | https://selvra-phcc0p3xf-carlosante-arts-projects.vercel.app |
| Build-tid | 56s |
| Tester innan deploy | 232/232 |

## Vad som funkar utan env-vars

- Static pages: `/`, `/login`, `/privacy`, `/goodbye`, `/manifest.webmanifest`
- Public assets, ikoner, OG-bilder
- 404-rendering

## Vad som BRYTER utan env-vars

| Route | Vad som fail:ar | Vilka env-vars |
|---|---|---|
| `/samtal`, `/samtal/thread/[id]` | DB-query för conversation-list | `DATABASE_URL` |
| `POST /api/chat/stream` | Auth + DB + LLM | `DATABASE_URL`, `AUTH_SECRET`, `MISTRAL_API_KEY` |
| `/login` magic-link submit | Resend API + DB | `RESEND_API_KEY`, `DATABASE_URL`, `AUTH_SECRET`, `MAIL_FROM` |
| `/minne`, `/account`, `/export/*` | Auth + DB | `DATABASE_URL`, `AUTH_SECRET` |
| `/brev`, `/thoughts`, `/traces` | Selvra-protokoll-call | `SELVRA_PROTOCOL_URL`, `SELVRA_PROTOCOL_JWT_SECRET` |

## Sätt env-vars (Carl-action)

### Alternativ A: Vercel dashboard (rekommenderat)

https://vercel.com/carlosante-arts-projects/selvra-app/settings/environment-variables

Klistra in nyckel + värde + välj environment (Production + Preview + Development).

### Alternativ B: `vercel env add` interaktivt (terminal)

```bash
# I selvra-app-katalogen
vercel env add DATABASE_URL production
# (prompta för värdet, paste din Railway-URL)

vercel env add AUTH_SECRET production
# (paste output från: openssl rand -base64 32)

# osv för resten
```

### Required-vars (måste sättas)

```
DATABASE_URL              postgresql://... (Railway Postgres)
AUTH_SECRET               openssl rand -base64 32
RESEND_API_KEY            från resend.com
MAIL_FROM                 onboarding@resend.dev (eller noreply@selvra.ai)
SELVRA_PROTOCOL_URL       https://selvra-production.up.railway.app
SELVRA_PROTOCOL_JWT_SECRET  (från Selvra seed-script)
SELVRA_TENANT_ID          (UUID, från seed)
SELVRA_SOURCE_ID          selvra-app
SELVRA_SUBJECT_EXTERNAL_ID  carl
SELVRA_SUBJECT_ID         (UUID, från seed)
SELVRA_APP_SUB_UUID       (UUID för JWT-claims)
MISTRAL_API_KEY           från console.mistral.ai
NEXT_PUBLIC_SITE_URL      https://selvra-app.vercel.app
NEXT_PUBLIC_SITE_NAME     Selvra
```

### Valfria (rekommenderas)

```
SENTRY_DSN                från sentry.io (EU storage region)
NEXT_PUBLIC_SENTRY_DSN    samma som SENTRY_DSN
SENTRY_ORG                organisation-slug (för source-map-upload)
SENTRY_PROJECT            project-slug
SENTRY_AUTH_TOKEN         från sentry.io/settings/auth-tokens
MISTRAL_MODEL             default mistral-large-latest
SELVRA_USE_TOOL_CALL      0 (av) eller 1 (på)
```

### OAuth-källor (kan vänta till efter pilot)

```
STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, ... (8 STRAVA_*-vars)
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ... (7 GOOGLE_*-vars)
```

## Migration mot Railway-DB

Efter `DATABASE_URL` är satt **lokalt** (i `.env.local`):

```bash
# Test-anslut
DATABASE_URL=$(grep DATABASE_URL .env.local | cut -d= -f2-) npx drizzle-kit migrate
```

Migrationerna är idempotenta (`IF NOT EXISTS` + `DO/EXCEPTION` på FK) — kan köras mot befintlig DB utan att smälla.

Resultat: 3 nya tabeller (`consumer_conversation`, `conversation_turn`, `conversation_memory_fact`) + 1 (`system_prompt_version`) skapas. Auth-tabeller (redan finns) skippas.

## Redeploy efter env-vars är satta

```bash
vercel deploy --prod
```

Eller via dashboard: `Deployments → senaste → … → Redeploy`.

## Verifiera deploy

1. Öppna https://selvra-app.vercel.app — ska se landningssidan
2. Klicka login → magic-link skickas → klicka länk i mail
3. Navigera till `/samtal` — empty-state visas
4. Skriv en fråga: "Vad visade Dexcom senaste veckan?"
5. Stream:ade tokens visas live, Källor: rad nederst
6. Öppna `/minne` — empty
7. Skriv "Kom ihåg att jag är T1-diabetiker"
8. Öppna `/minne` igen — fakta syns

## Felsökning

| Symptom | Trolig orsak | Fix |
|---|---|---|
| 500 på `/samtal` | `DATABASE_URL` saknas eller fel | Sätt + redeploy |
| Magic-link kommer aldrig | `RESEND_API_KEY` fel eller `MAIL_FROM`-domain unverified | Verifiera Resend dashboard |
| Login-knapp gör inget | `AUTH_SECRET` saknas | Sätt + redeploy |
| Stream-svar tomt | `MISTRAL_API_KEY` fel | Verifiera console.mistral.ai |
| `/brev` 500 | `SELVRA_PROTOCOL_URL` eller JWT-secret fel | Kolla Railway-deploy status |
| 401 från Selvra-protokollet | `SELVRA_*` IDs inte matchar Selvra-DB | Kör seed-skript igen |
