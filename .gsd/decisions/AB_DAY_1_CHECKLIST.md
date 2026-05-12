# AB Day-1 Checklist — exekverbar wiring-sekvens

**Status:** Operativ checklist för dagen Bolagsverket godkänner KJ Labs AB
och wiring-fasen aktiveras. Komplement till
`AB_WIRING_PRE_MORTEM_2026-05-11.md` (vad kan gå fel) — denna är *vad
du gör i ordning*.

**Skapad:** 2026-05-12.
**Aktiveras:** dagen Bolagsverket-godkännande-mejl landar.

---

## Hur denna doc används

När mejlet "KJ Labs AB är registrerat" landar — öppna denna doc, börja
på Dag 0, exekvera i ordning. Varje steg har:

- **Vad:** konkret action
- **Varför:** vad det blockerar
- **DoD:** definition-of-done (när du får gå vidare)
- **Estimat:** ungefär tidsåtgång
- **Beroenden:** vad som måste finnas före

Pre-loaded beslut från pre-mortem är inbakade — du behöver inte
ompröva i ögonblicket.

**Critical path:** Dag 0 → Dag 2 är seriell (måste i ordning). Dag 3+
parallelliserar delvis.

---

## Pre-conditions (måste vara klart före AB-mejl)

- [x] Pre-mortem-doc läst och förstådd (`AB_WIRING_PRE_MORTEM_2026-05-11.md`)
- [x] Pre-loaded beslut accepterade (X1-tabellen i pre-mortem)
- [x] selvra-app deployad och live på `selvra-app-production.up.railway.app`
- [x] selvra-protokoll deployat och live på `selvra-production.up.railway.app`
- [x] Per-user-tenant-automation klar (2026-05-12) — Auth.js signIn-callback
      anropar `POST /v1/tenants` + `POST /v1/subjects` automatiskt
- [x] Soft-delete + restore + lifecycle-endpoints live (G1-G9)
- [x] Source Strategy V2 låst (canonical doc)
- [x] Context Engine-strategi låst (gated på brev v0.3)
- [x] Karis vilande bolag inskickat för omvandling till KJ Labs AB

Om någon av dessa är `[ ]` när AB landar — fixa den först. Annars är
checklistan inte exekverbar.

---

## Dag 0 — Bolagsverket-godkännande (väntefas)

**Action:** Mottag mejl + spara organisationsnummer. Inga creds-actions
denna dag.

- [ ] Bolagsverket-mejl bekräftat
- [ ] Organisationsnummer noterat (i 1Password eller motsvarande)
- [ ] Företagsnamn officiellt: **KJ Labs AB**
- [ ] Foto/PDF av registreringsbeviset sparat

**Estimat:** 5 min administrativt.
**Beroenden:** Bolagsverket-handläggning klar.
**DoD:** Du vet org-nummer + företagsnamn finns formellt.

---

## Dag 1 — Finansiell + auth-foundation

### 1.1 Företagsbankkonto

- [ ] Skapa företagskonto hos vald bank (Handelsbanken / SEB / Lansforsakringar)
- [ ] Få BIC + IBAN
- [ ] Notera initial deposit-summa för bookkeeping senare

**Estimat:** 30-60 min beroende på bank (många kan göras digitalt med BankID
efter org-nummer finns).
**Beroenden:** Dag 0 klar.
**DoD:** Bankkonto under KJ Labs AB existerar, BIC/IBAN noterade.

### 1.2 Företagsmail

- [ ] Registrera `hello@selvra.ai` (eller annan adress under selvra.ai)
  via Cloudflare Email Routing eller Google Workspace
- [ ] Verifiera DNS för mail-mottagning
- [ ] Bekräfta mottag genom test-mejl från privat-konto

**Estimat:** 15-30 min.
**Beroenden:** Dag 0 klar. Domain selvra.ai redan i ditt namn.
**DoD:** Du kan ta emot mejl på `hello@selvra.ai`.

### 1.3 Railway Postgres för selvra-app (Auth.js DB)

- [ ] Provisionera ny Postgres-tjänst i `distinguished-simplicity`-projektet
  (sidotjänst till selvra + selvra-app)
- [ ] Verifiera `DATABASE_URL` auto-injekterad i selvra-app-tjänsten
- [ ] Notera connection-string lokalt (för Drizzle-migrations)

**Estimat:** 10 min.
**Beroenden:** Inget — kan göras innan AB om Carl vill.
**DoD:** Railway-env-var `DATABASE_URL` syns i selvra-app.

### 1.4 AUTH_SECRET för Auth.js

- [ ] Generera: `openssl rand -base64 32`
- [ ] Sätt som Railway-env-var i selvra-app: `AUTH_SECRET=<value>`
- [ ] Spara backup i 1Password under "KJ Labs AB → selvra-app secrets"

**Estimat:** 5 min.
**Beroenden:** 1.3 klar (DATABASE_URL).
**DoD:** Railway-env-var AUTH_SECRET satt.

### 1.5 Drizzle migration mot Railway-Postgres

- [ ] Lokalt: `pnpm drizzle-kit push` (eller `migrate` om migrations finns)
- [ ] Verifiera att Auth.js-tabeller skapas: `users`, `accounts`, `sessions`,
  `verificationTokens`
- [ ] Verifiera kolumnerna `selvra_tenant_id` + `selvra_subject_id` på
  `users` (för per-user-tenant-flödet)

**Estimat:** 15-20 min (första gången har ofta små bugs).
**Beroenden:** 1.3 + 1.4 klart.
**DoD:** `\dt` mot Railway-Postgres visar Auth.js-schema + Selvra-linkage-kolumner.

**Pre-mortem-koppling:** R4 (Drizzle första-run-issues). Om migration
failar, debugga lokalt först, inte mot prod.

---

## Dag 2 — Magic-link live + första non-Carl-user kan signa in

### 2.1 Resend-konto under KJ Labs AB

- [ ] Skapa Resend-konto via `hello@selvra.ai`
- [ ] Generera API-key
- [ ] Sätt Railway-env-var: `RESEND_API_KEY=<value>` på selvra-app-tjänsten
- [ ] **MAIL_FROM = `onboarding@resend.dev`** initialt (pre-loaded beslut —
  selvra.ai DNS-config kommer i 2.2 men kan vänta)

**Estimat:** 15 min.
**Beroenden:** 1.2 klart.
**DoD:** Resend-konto under företaget, API-key i selvra-app:s env.

### 2.2 selvra.ai DNS för deliverability (parallell med 2.3)

- [ ] Lägg in SPF + DKIM + DMARC-records för Resend hos
  domain-registrator (Cloudflare/Loopia/etc.)
- [ ] Vänta på propagering (1-24h)
- [ ] Verifiera Resend → "Domain verified"-status
- [ ] Byt `MAIL_FROM` till `noreply@selvra.ai` när verifierat

**Estimat:** 30 min DNS-arbete + 1-24h väntan.
**Beroenden:** 1.2 + 2.1 klart.
**DoD:** Resend-dashboard visar "Verified" för selvra.ai.

**Pre-mortem-koppling:** R2 (Resend DNS). Verifiera mot 3 mail-providers
(Gmail, Outlook, Apple Mail) innan publik release.

### 2.3 Magic-link smoke-test

- [ ] Öppna `selvra-app-production.up.railway.app/login` i incognito
- [ ] Mata in en test-email (din personliga eller dummy)
- [ ] Mottag magic-link
- [ ] Klicka länken, hamna på `/onboarding/intentions`
- [ ] **Verifiera per-user-tenant-automation körde:** queryan i Railway-
  Postgres `SELECT id, email, selvra_tenant_id, selvra_subject_id FROM "user"`
  ska visa båda kolumnerna ifyllda för din nya user
- [ ] Verifiera mot selvra-protokollet: tenant existerar i `tenants`-tabellen
  via direct DB-query eller `railway run -- psql`

**Estimat:** 30 min (inkl. felsökning om något).
**Beroenden:** 1.4 + 1.5 + 2.1 klart.
**DoD:** Du har skapat ett *icke-Carl-konto* i selvra-app, signat in via
magic-link, och kan se det i selvra-protokollets tenants-tabell.

### 2.4 Custom domain `app.selvra.ai`

- [ ] Lägg till custom domain i Railway för selvra-app-tjänsten
- [ ] CNAME-record `app.selvra.ai` → Railway-target
- [ ] Vänta på SSL-cert (automatisk via Railway)
- [ ] Verifiera `https://app.selvra.ai/` fungerar
- [ ] **Uppdatera `NEXT_PUBLIC_SITE_URL` env-var** till `https://app.selvra.ai`
- [ ] **Uppdatera Auth.js callback-URLs** för Resend om de är hårdkodade

**Estimat:** 30 min + DNS-propagering.
**Beroenden:** 2.3 funkar mot Railway-default-domain.
**DoD:** Magic-link landing-flow fungerar via `app.selvra.ai`.

**Pre-mortem-koppling:** R9 (custom domain blockerar OAuth-callbacks).
Måste vara klart innan OAuth-apps registreras i 2.5+.

---

## Dag 3 — OAuth-källor (Fas 1 source-acquisition)

Per Source Strategy V2 Fas 1: Magic-link (klart 2.3) + Google + Gmail
+ Spotify + Strava. Magic-link är källan via Auth.js; resten är externa.

### 3.1 Strava OAuth-app under KJ Labs AB

- [ ] Skapa Strava API-app på developers.strava.com
- [ ] Application Name: `Selvra`
- [ ] Authorization Callback Domain: `app.selvra.ai`
- [ ] Notera Client ID + Client Secret
- [ ] Sätt Railway-env-vars: `STRAVA_CLIENT_ID` + `STRAVA_CLIENT_SECRET`
- [ ] Verifiera scaffold-flödet i `selvra-app/src/app/api/oauth/strava/*`
  (init + callback finns redan)
- [ ] Smoke-test: klicka "Koppla Strava" från `/onboarding/sources`,
  authorize, kolla tokens persisteras i Selvra-events

**Estimat:** 60 min.
**Beroenden:** 2.4 klart (callback-domain behöver vara live).
**DoD:** Carl själv kan koppla sin Strava → events flödar in i Selvra-
protokollets event-log för hans subject.

### 3.2 Spotify OAuth-app under KJ Labs AB

- [ ] Skapa Spotify Developer-app på developer.spotify.com
- [ ] App name: `Selvra`
- [ ] Redirect URI: `https://app.selvra.ai/api/oauth/spotify/callback`
- [ ] Scopes: `user-read-recently-played`, `user-read-playback-state`,
  `user-top-read` (read-only; inga write)
- [ ] Notera Client ID + Client Secret
- [ ] Sätt Railway-env-vars: `SPOTIFY_CLIENT_ID` + `SPOTIFY_CLIENT_SECRET`
- [ ] Bygg ut scaffold om saknas (jämför med Strava-pattern)
- [ ] Smoke-test

**Estimat:** 60-90 min (scaffold-bygge utöver creds).
**Beroenden:** 2.4 klart.
**DoD:** Carl kan koppla Spotify → recent listening flödar in.

**Notera:** Spotify-scaffold existerar inte än i selvra-app (Strava och
Google har scaffolds; Spotify behöver byggas). ~1h utöver creds-arbete.

### 3.3 Google OAuth-app + verification-application (KRITISK)

- [ ] Skapa Google Cloud Project: `selvra-app-prod`
- [ ] Aktivera Calendar API + Gmail API
- [ ] OAuth consent screen: External, Production
- [ ] App name: `Selvra`
- [ ] Scopes:
  - `https://www.googleapis.com/auth/calendar.readonly`
  - `https://www.googleapis.com/auth/gmail.metadata` (SENSITIVE)
- [ ] Authorized redirect URIs: `https://app.selvra.ai/api/oauth/google/callback`
- [ ] Notera Client ID + Client Secret
- [ ] Sätt Railway-env-vars
- [ ] **VIKTIGT — Verification-application:** skicka in idag, parallellt
  med wiring. Process tar 4-6 veckor.
- [ ] **Test-user-mode initialt:** lägg in 100 test-emails (Carl + early
  beta-users) så de slipper "unverified app"-varning
- [ ] Smoke-test mot Carls Google-konto

**Estimat:** 90 min wiring + verification-form-arbete.
**Beroenden:** 2.4 klart.
**DoD:** Carl kan koppla Google (Calendar + Gmail), verification-process
inskickad till Google.

**Pre-mortem-koppling:** R1 (Google verification 4-6 veckor). Beslut låst
i pre-mortem X1: kör test-user-mode i mellantiden, inled verification-
ansökan dag-1 inte senare.

---

## Dag 4 — Selvra-app + Stillra Path C-verifiering

### 4.1 Path C cross-DB-read mot Stillra-Supabase

- [ ] Verifiera `SELVRA_STILLRA_READONLY_DB_URL` env-var fortfarande satt
  i selvra-protokollets Railway-tjänst (sattes 2026-05-06 per memory)
- [ ] Smoke-test: anropa `/v1/subjects/{id}/memories` med Carls JWT,
  verifiera glukos-data flödar in från Stillras Supabase
- [ ] Verifiera Path C-pipeline producerar `stillra.glucose.reading`-
  events i Selvra-event-loggen

**Estimat:** 30 min.
**Beroenden:** Stillras Supabase-creds fortfarande giltiga.
**DoD:** Glukos-data syns i selvra-app:s `/brev`-substrate.

### 4.2 Per-user tenant integration test

- [ ] Skapa en andra test-account (alice@test.com) via magic-link
- [ ] Verifiera `selvra_tenant_id` är *annan* än Carls
- [ ] Verifiera Alice INTE kan se Carls data (RLS-isolation)
- [ ] Verifiera Alice kan skriva sin första intention
- [ ] Verifiera Alice får sitt eget brev när rytmen triggar

**Estimat:** 45 min.
**Beroenden:** 2.3 fungerar för icke-Carl.
**DoD:** Multi-user-isolation verifierad i prod.

---

## Dag 5-7 — Brev v0.3 mot fullständig data

### 5.1 Synthesis-trigger mot full source-set

- [ ] Vänta 24-48h efter att Carl kopplat alla källor (Strava + Spotify
  + Google + Stillra) — låt data ackumulera
- [ ] Trigga synthesis manuellt via internal-admin-endpoint
- [ ] Läs brevet på `/brev`
- [ ] Notera reaktion: vad fångar, vad missar, var hallucinerar

**Estimat:** 30 min trigger + iterativ läs-feedback.
**Beroenden:** Dag 3-4 klart, 24-48h data-ackumulering.
**DoD:** Du har ett brev mot full data du kan reagera på.

### 5.2 Prompt-iteration v0.3

- [ ] Baserat på 5.1-reaktion: justera `reflection_synthesis.py`-prompten
- [ ] Re-trigga synthesis
- [ ] Jämför nya brevet mot v0.2 + 5.1-versionen
- [ ] Iterera 2-3 gånger tills brevet kvalitativt landar

**Estimat:** 2-3 dagar iterativt arbete (inte heltid).
**Beroenden:** 5.1 klart, baseline-känsla för vad som fungerar.
**DoD:** Brev v0.3 är låst och dokumenterat.

**Pre-mortem-koppling:** R7 (v0.2.2-prompt-regression mot v0.3-substrat).
Räkna med att v0.2.2 → v0.3 inte är gratis-uppgradering.

---

## Dag 8+ — Validerings-grindar

När brev v0.3 är låst — det är *gaten* som låser upp resten:

- [ ] **Tesen validerad?** → kör Fas 2-källor (Notion API, Readwise API,
  AI-konversation-import). Per Source Strategy V2.
- [ ] **Inte landat?** → ompröva. Antingen prompt fortsätter iterera,
  eller arkitektur-pivot. Inte gå vidare till Fas 2 förrän tesen håller.
- [ ] **PWA-dogfood-feedback samlad?** → kan starta Expo-rewrite (mobil-
  arkitektur B). Trigger: brev v0.3 validerar tesen + 4-6 veckor dogfood.
- [ ] **50-100 beta-users som dogfoodat?** → bygg Nivå 1 av Context
  Engine. Per `SELVRA_CONTEXT_ENGINE_2026-05-11.md`.

---

## Cross-cutting: vad du ska göra om något fail:ar

**Magic-link mejl kommer inte fram:**
1. Kolla Railway-logs för selvra-app — Resend-respons-koden
2. Kolla Resend-dashboard för delivery-status
3. Kolla SPAM-mappen
4. Om 2.2 inte verifierad — gå tillbaka till `onboarding@resend.dev`
   tills selvra.ai är klar

**Per-user-tenant skapas inte vid signIn:**
1. Kolla Railway-logs för selvra-app — error-trace från
   `ensureSelvraIdentity()`
2. Kolla att admin-JWT genereras med rätt scope (`['admin']`)
3. Kolla att `POST /v1/tenants` returnerar 201 i selvra-protokollets logs
4. Worst case: kör `ensureSelvraIdentity(userId)` manuellt via skript

**OAuth callback failar:**
1. Kolla att callback-URL i providern matchar `app.selvra.ai` exakt
2. Kolla att Client ID + Secret är rätt env-vars i Railway
3. Kolla att DNS för custom domain är fullt propagerat
4. Test mot Strava först (enklast), sen Spotify, sen Google (mest komplex)

**Google "unverified app"-varning blockerar Gmail:**
1. Bekräfta att test-user-mode är aktivt
2. Bekräfta att din email är i test-user-listan
3. Acceptera varningen för dogfood-fasen
4. Verification-application är redan inskickad (3.3)

---

## Pre-loaded beslut (referens från pre-mortem X1)

| Beslut | Förvalt svar | Skäl |
|---|---|---|
| JWT-secret per app eller per user? | Per app (selvra-app shared) | Skalbarhet, simpler ops. Per-user-tenant via JWT-claims (tid), inte secrets. |
| Soft-delete model? | DELETION_EVENT + 30-day hard ✅ KLART | GDPR + event-sourcing samexistens |
| selvra-app-custom-domain? | app.selvra.ai | Brand-konsistens, OAuth-callback-stabilitet |
| AI-context-export default-layers? | intentions + thoughts | Privacy: Dreamer-insights är känsligaste |
| Open Wearables Garmin failover? | Strava + Apple-XML | Open Wearables nu Fas 3 per Source Strategy V2 |
| Dreamer-trigger-rhythm? | TBD post-v0.3-validering | Måste se kvalitet först |
| MAIL_FROM under wiring? | onboarding@resend.dev → noreply@selvra.ai | Pragmatik |
| Test-user-modus för Google? | Ja, 100 emails initialt | Verification-delay-buffert |
| Tenant-model? | **Per-user-tenant** ✅ KLART | RLS defense-in-depth (uppdaterat från pre-mortem) |

---

## När checklistan är klar

Du har:
- KJ Labs AB live med org-nummer + bankkonto + företagsmail
- Magic-link-auth live på `app.selvra.ai`
- Per-user-tenant-provisioning verifierad i prod
- Tre OAuth-källor wirade (Strava + Spotify + Google)
- Google verification-application inskickad (4-6v till godkännande)
- Brev v0.3 mot full data — låst och validerat
- Klar gate till Fas 2 (Notion + Readwise) och mobile Expo-build

**Total tidåtgång realistiskt:** 5-7 fokuserade arbetsdagar för Dag 1-5,
plus 2-3 dagars prompt-iteration för Dag 5-7. Cirka 8-10 dagar från
AB-godkännande till "v1 redo för beta-onboarding".

**Inget annat hinner inte hända parallellt** — Stillra-bygge,
mood-board-samling, Selvra-app-design-iteration kan rulla bredvid.

---

## Vad denna doc INTE är

- **Inte plan B om Bolagsverket nekar AB.** Det är annan beslutsregel
  (sannolikt inte ett scenario värt att förbereda för).
- **Inte garanti.** Smågrejor kommer alltid fail:a. Pre-mortem-doc:en
  och cross-cutting-failsafes-sektionen ovan är skyddsnätet.
- **Inte slutgiltig.** Justera när du faktiskt kör — verkligheten
  överraskar. Uppdatera doc:en post-mortem så Carl-i-framtiden får
  uppdaterade insikter.
