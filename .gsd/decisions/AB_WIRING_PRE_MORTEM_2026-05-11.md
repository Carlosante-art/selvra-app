# AB-wiring-fas — pre-mortem

**Status:** Förberedelse-dokument inför aktivering av AB-deferred-funktioner.
**Skriven 2026-05-11, ca 2-3 veckor innan AB-godkännande väntas.**

---

## Syfte

Tre saker:

1. **Identifiera risker** som kan materialisera när Resend/OAuth-creds/Open-
   Wearables aktiveras under AB-namn — innan vi står mitt i wiring och
   improviserar.
2. **Pre-loada beslut** som annars skulle bli decision-meetings mid-build.
3. **Ordning + dependencies** så wiring blir disciplinerad-byggning,
   inte improviserad-marathon.

Estimat för wiring-fas: 4-6 dagar fokuserat arbete. Detta dokument finns
för att hålla det estimatet ärligt.

---

## Aktiverings-sekvens (rekommenderad ordning)

```
1. AB-registrering klar          (extern, väntan)
2. Bankkonto + företagsmail      (Carl-actions, dag 0-1)
3. Resend-konto + selvra.ai DNS  (Carl + Claude, dag 1)
4. Railway Postgres för selvra-app   (Carl-action, dag 1)
5. AUTH_SECRET + Drizzle migrate (Claude, dag 1)
6. Magic-link smoke-test         (Claude + Carl, dag 1-2)
7. Strava OAuth-app under AB     (Carl-action, dag 2)
8. Google Cloud OAuth-app        (Carl-action + verification, dag 2-?)
9. Open Wearables-deploy         (Carl-action, dag 3)
10. Open Wearables provider-konfig (Carl + Claude, dag 3)
11. Source-wiring tests          (Claude, dag 3-4)
12. Synthesis mot full data      (Claude, dag 4-5)
13. Prompt v0.3 iteration        (Claude + Carl, dag 5-6)
14. Brev v0.3 validering         (Carl-läsning, kontinuerligt)
```

**Critical path:** Steg 1-6 är icke-överlappande (Magic-link blockerar
allt annat). Steg 7-13 kan parallelliseras delvis.

---

## Per-fas-risker (sorterade efter sannolikhet × påverkan)

### 🔴 Hög sannolikhet, hög påverkan

**R1. Google OAuth verification-delay (för gmail.metadata-scope).**

Google klassificerar Gmail-scopes som "sensitive" och kräver
security review innan publik release. Processen kan ta **4-6 veckor**.
Tills dess: "denna app är overifierad"-varning blockerar användare som
inte är listade som test-users (max 100).

**Mitigation:**
- Acceptera "test-user-mode" för v1 (vi har inte 100+ användare på dag 1)
- Lägg upp 100 test-user-emails initialt — räcker för betaperiod
- Inled verification-application **omedelbart vid Google-OAuth-app-skapande**,
  inte senare — process kan börja parallellt
- Worst case: skippa Gmail i v1, behåll bara Calendar (calendar.readonly är
  inte "sensitive" på samma sätt)

**R2. Resend DNS-config (DKIM/SPF) för selvra.ai.**

Mail från `noreply@selvra.ai` kräver DNS-records satta hos domain-
registrator (eller Cloudflare om Carl använder det). Utan korrekt setup:
- Mail kan hamna i spam
- Resend kan vägra skicka från domänen tills verifierat

**Mitigation:**
- Använd `onboarding@resend.dev` initialt (Resend-default, fungerar utan
  DNS-config) för smoke-test
- Konfigurera selvra.ai DNS direkt efter — det är ~30 min DNS-arbete +
  väntan på propagering (1-24h)
- Verifiera deliverability mot 3 olika mail-providers (Gmail, Outlook,
  Apple Mail) innan publik release

**R3. Per-user tenant-provisioning saknas.**

Nuvarande arkitektur: `seed_vertical_tenant.py` är admin-script. När en
ny user signar upp via Magic-link finns ingen automation som skapar
Selvra-tenant + genererar per-user JWT-secret + lägger till i
MCP_JWT_SECRETS-array.

**Mitigation (måste byggas innan publik release):**
- Antingen: programmatisk endpoint `POST /v1/tenants` som admin-API kallar
  vid user-onboarding
- Eller: signIn-callback i Auth.js triggar tenant-creation-job
- Beslut: en JWT-secret som **alla users delar** (selvra-app-as-source) +
  per-user `subject_id` via Magic-link-user-id som external_subject_id

  Det är enklare och säkert (subject_id derivation är kryptografiskt
  isolerande), undviker att blåsa upp MCP_JWT_SECRETS-arrayen till N+1
  per user.

**Pre-loadad beslut för wiring:** *one shared JWT-secret per source-app
(selvra-app), per-user subject_id via UUID5(tenant, user_id). Existing
Carl-tenant kan kvarstå som "selvra-app-tenant" där alla users blir
subjects.*

### 🟡 Medel sannolikhet, hög påverkan

**R4. Drizzle migration mot Railway Postgres första-run-issues.**

Drizzle-kit kräver explicit migrate-kommando, inte auto-run. Första run
mot tom DB ska skapa Auth.js-tabeller (users, accounts, sessions,
verificationTokens). Failure-mode:
- Migration-kommando glöms → tabeller saknas → Magic-link 500
- SSL-cert-issue → connection failar
- Pool-size för liten → connect-timeouts

**Mitigation:**
- Bygg deployment-script som kör `drizzle-kit push` ELLER `drizzle-kit
  migrate` som första del av deploy-pipeline
- Sätt `DATABASE_URL` med `?sslmode=require` för Railway Postgres
- Documentera exact-kommando i `~/selvra-app/.gsd/decisions/MAGIC_LINK_WIRING.md`
  (att skrivas)

**R5. Open Wearables Garmin enterprise-blocker.**

Garmin Developer Program approval kan ta veckor utöver AB-registrering.
Worst case: 1-2 månader extra blockad innan Garmin-data flödar.

**Mitigation:**
- Strava som temporär källa-substitut (free, instant approval, tråning-data
  via Strava-OAuth direkt) — fungerar för aktivitet
- Apple Health XML one-shot import för sömn + HRV + steg — Carl exporterar
  manuellt, vi parsar
- Garmin är *trevligt-att-ha*, inte *blocker*. Brev v0.3-validering kan
  ske mot Dexcom + Strava + Calendar + Gmail-meta + tankar — räcker för
  cross-layer-bevis

**R6. Synthesis-pipeline cost-explosion när sources triples.**

Idag: 6630 tokens per Dreamer-run + ~6000 tokens per brev. Med Garmin +
Calendar + Gmail + Strava + Spotify data flowing in: 5-10× mer substrat.

**Mitigation:**
- Cost-tracker per subject finns redan i Dreamer (`subject_budget_usd_per_period`).
  Verifiera att synthesis också har budget.
- Token-cap per brev: hårdkoda max-input-tokens i synthesis-prompt så
  vi inte sänder hela event-loggen.
- Budget-larm vid 80% av månadsbudget per subject.

### 🟢 Lägre sannolikhet / lägre påverkan

**R7. v0.2.2-prompt regression mot v0.3-substrat.**

Prompten är tuned mot 3-lager-substrat (intentions + tankar + glukos).
När Calendar + Gmail + Strava arrives → mer data → risk för data-dump-
regression (LLM faller tillbaka på siffror snarare än cross-layer).

**Mitigation:** Iterate v0.3-prompt mot full substrate explicitly. Räkna
med att v0.2.2 → v0.3 är inte gratis-uppgradering.

**R8. GDPR right-to-deletion saknas.**

Event-sourced = append-only. "Radera mig" kräver soft-delete eller event-
log-redaktion (kontroversiellt). Inte implementerat.

**Mitigation:** Innan publik release: implementera `DELETE
/v1/subjects/{id}` som markerar alla events som soft-deleted + emit
DELETION_EVENT. SREF-export filtrerar ut soft-deleted. Faktisk hard-
delete kan ske 30 dagar senare via batch-job.

**Pre-loadat beslut:** *Soft-delete via DELETION_EVENT, hard-delete via
30-dagars-batch. Implementeras innan publik onboarding av första
icke-Carl-användare.*

**R9. Custom domain för selvra-app (app.selvra.ai).**

Currently: `selvra-app-production.up.railway.app`. För publik release
behövs `app.selvra.ai` eller `selvra.ai/app`.

**Mitigation:** Railway custom-domain-setup är 30 min. Carl-action när
DNS är konfat. Påverkar OAuth-callback-URLs (måste registreras både
hos provider och i `.env`).

---

## Cross-cutting risker (spänner flera steg)

**X1. Decision-fatigue mid-build.**

4-6 dagars wiring-fas är många små beslut. Pre-loada dem här:

| Beslut | Förvalt svar | Skäl |
|---|---|---|
| JWT-secret per app eller per user? | Per app (selvra-app shared) | Skalbarhet, simpler ops |
| Soft-delete model? | DELETION_EVENT + 30-day hard | GDPR + event-sourcing samexistens |
| selvra-app-custom-domain? | app.selvra.ai | Brand-konsistens, OAuth-callback-stabilitet |
| AI-context-export default-layers? | intentions + thoughts (NEJ patterns by default) | Privacy: Dreamer-insights är känsligaste |
| Open Wearables Garmin failover? | Strava + Apple-XML medan Garmin-approval pågår | Risk-isolering |
| Dreamer-trigger-rhythm? | TBD post-v0.3-validering | Måste se kvalitet först |
| MAIL_FROM under wiring? | onboarding@resend.dev tills DNS klart, sen noreply@selvra.ai | Pragmatik |
| Test-user-modus för Google? | Ja, lägg 100 emails initialt | Verification-delay-buffert |

**X2. Carl-burnout-risk.**

Idag (2026-05-11) levererades massivt. 4-6 dagars wiring kunde frestas
bli "marathon för att leverera v1". Per memory `feedback_push_back_on_late_night_building.md`:
sustainable pace > heroics.

**Mitigation:**
- Pre-mortem-dokumentet (detta) tar bort improvisation, lämnar
  exekvering.
- Varje wiring-dag bör ha tydlig "klar för dagen"-punkt (commit + push
  + STATE.md-update) snarare än "fortsätt tills det fungerar".
- Om dag 3 visar att Google-verification kommer ta >2 veckor: re-scope
  v1 till "utan Gmail först" istället för att vänta in approval.

**X3. AB-entity-namn osäkerhet.**

Carl nämnde "Selvra Protocol AB eller liknande". Påverkar alla
OAuth-apps user-facing-namn ("Continue with [entity]") + Resend
sender-name + privacy-policy-författarskap.

**Mitigation:** Beslut låst innan AB-registrering finalize:as. Document
i memory + canonical-doc så framtida-sessions vet.

---

## Pre-loaded beslut (sammanfattning)

Dessa beslut tas härmed för att inte ompröva mid-wiring:

1. **JWT-arkitektur:** En shared JWT-secret per source-app. Per-user
   subject_id via UUID5(tenant_id, user_email-or-id). MCP_JWT_SECRETS-array
   håller en secret per source-app, inte per user.
2. **Soft-delete:** DELETION_EVENT-pattern + 30-dagars hard-delete-batch.
   Implementeras innan publik onboarding.
3. **AI-context default-layers:** intentions + thoughts. Patterns
   (Dreamer-insights) opt-in checkbox. Privacy-default.
4. **Google verification:** Test-user-mode med 100 emails initialt.
   Verification-application skickas vid OAuth-app-skapande, parallellt
   med övrig wiring.
5. **Garmin failover:** Strava + Apple-XML täcker behov tills Garmin
   approval landar. Garmin är trevligt-att-ha, ej blocker.
6. **Custom domain:** app.selvra.ai. Konfigurera Railway-custom-domain
   direkt efter Magic-link verifierad.
7. **MAIL_FROM evolution:** `onboarding@resend.dev` → `noreply@selvra.ai`
   när DKIM/SPF verifierat.
8. **Dreamer-cron:** Beslut deferred till efter v0.3-validering (per
   tidigare lock).

---

## Dependency-graph

```
AB-godkännande ─┬─→ Bankkonto ─→ Företagsmail ─┬─→ Resend (free tier)
                │                                │
                ├─→ Resend (paid + selvra.ai DNS)│
                │                                │
                └─→ All OAuth-app-creation       │
                                                 ↓
                                          Magic-link smoke-test
                                                 ↓
                                    Custom domain (app.selvra.ai)
                                                 ↓
                              ┌─────────────────┼─────────────────┐
                              ↓                 ↓                 ↓
                       Strava OAuth        Google OAuth      Open Wearables
                              ↓                 ↓                 ↓
                              └─────────────────┴─────────────────┘
                                                ↓
                                  Source-wiring tests (parallell)
                                                ↓
                                  Synthesis mot full data
                                                ↓
                                  Prompt v0.3 iteration
                                                ↓
                                  Brev v0.3 validering
```

**Critical path:** Magic-link blockerar custom-domain blockerar
OAuth-callbacks blockerar source-wiring blockerar synthesis-v0.3.

Garmin är off critical path (failover till Strava+Apple-XML).
Spotify är off critical path (v1.1 soft-include).

---

## Checklist för wiring-dag 1 (Magic-link aktivering)

När AB är godkänt + bankkonto + företagsmail finns:

- [ ] Skapa Resend-konto under företagsmail
- [ ] Kopiera Resend API-key till lokal `.env`
- [ ] Provisionera Railway Postgres för selvra-app (i existing
      distinguished-simplicity-project)
- [ ] Auto-injected `DATABASE_URL` syns i Railway-env-vars
- [ ] Lokal `.env`: kopiera `DATABASE_URL` (eller pulla från Railway via
      `railway variables`)
- [ ] Generera `AUTH_SECRET` med `openssl rand -base64 32`, sätt i `.env`
- [ ] Sätt `MAIL_FROM=onboarding@resend.dev` initialt
- [ ] Kör `npx drizzle-kit push` mot Railway-Postgres för att skapa
      tabeller (eller `migrate` om migrations-filer redan finns)
- [ ] Verifiera tabeller via `\dt` mot Railway-DB:n
- [ ] Lokal: `npm run dev` + öppna `/login` — ska visa form (inte
      not-configured-view)
- [ ] Posta egen email → check mail (kan ta 1-2 min för Resend)
- [ ] Klicka magic-link → ska redirecta till `/onboarding/intentions`
- [ ] Verifiera session via `/api/auth/session` returnerar user
- [ ] Deploy uppdaterade env till Railway via `railway variables --set`
- [ ] `railway up` → testa magic-link på prod-URL
- [ ] Commit STATE.md med "Magic-link wired 2026-05-XX, user-table
      schema klar"

Om något steg failar: stoppa + flagga risk + uppdatera detta dokument.

---

## Referenser

- `APPLICATIONS_PENDING_AB_2026-05-11.md` — vilka credentials som väntar
- `SUBJECT_ALIASING_OPEN_QUESTION_2026-05-11.md` — Alt 1 är wired, multi-
  user-aliasing infra är klar
- `SOURCE_STRATEGY_PIVOT_2026-05-11.md` — Open Wearables-strategin
- `DREAMER_META_OBSERVATION_2026-05-11.md` — empirisk validering
- `OPEN_WEARABLES_FAS_2-5_2026-05-11.md` — deploy-detaljer

---

*Detta dokument är levande. Uppdatera vid wiring-fasen baserat på
faktiska upptäckter. Om en risk materialiseras: kryssa, dokumentera
verklig mitigation, lär.*
