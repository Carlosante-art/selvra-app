# Fas 1 setup — ordning + env-vars + DB-migration

Refererar till PR-staplet på `Carlosante-art/selvra-app`. När alla PR:er
är mergade är pipelinen körbar end-to-end.

## PR-merge-ordning

| # | PR | Bas | Beroenden |
|---|---|---|---|
| 1 | ✅ konsument-Fas-1 skeleton | main | — |
| 2 | Mistral SDK + `callMistral` | main | — |
| 3 | DB-migration + queries + persist | main | — |
| 4 | `fetchRelevantEvents` mot Selvra | main | — |
| 5 | Thread-lista + tråd-render | #3 | merge #3 först |
| 6 | `/minne` live + radera | #3 | merge #3 först |

**Konflikter att vänta:** `sendMessage.ts` rörs av #2, #3, #4. Inte
samma rader — `callMistral`-byte (#2), DB-fetch/persist (#3), event-
fetch (#4). Tre-väg-merge går rent om man tar varje ändring oavsett vilken
sida.

**Föreslag merge-ordning:** #3 (störst), sen #2, sen #4, sen #5, sen #6.

## Env-vars för Fas 1

Sätt i `.env.local` (dev) **och** Vercel project-settings (prod):

```bash
# Befintliga (för Auth.js + DB)
DATABASE_URL=postgresql://...
AUTH_SECRET=...
AUTH_RESEND_KEY=...
SELVRA_BASE_URL=https://selvra-production.up.railway.app
SELVRA_JWT_SECRET=...

# Nytt för Fas 1 — Mistral LLM
MISTRAL_API_KEY=...

# Valbar — override default-modell
MISTRAL_MODEL=mistral-large-latest

# Sentry (observability — valfri men rekommenderas för dogfood)
SENTRY_DSN=https://...@.../...
NEXT_PUBLIC_SENTRY_DSN=https://...@.../...

# För source-map-upload (valfri)
SENTRY_ORG=...
SENTRY_PROJECT=...
SENTRY_AUTH_TOKEN=...
```

Sentry: skapa konto på <https://sentry.io>. Välj **EU storage region** vid
org-skapande (uppfyller konsument-track §2). DSN i project-settings →
Client Keys.

Hämta `MISTRAL_API_KEY`: <https://console.mistral.ai/>. EU-baserat företag
med EU-region per default — uppfyller konsument-track §2.

## Migration

Efter att **#3 är merged** mot main:

```bash
DATABASE_URL=$DATABASE_URL npx drizzle-kit migrate
```

Migrationen (`drizzle/0000_conversation.sql`) är idempotent — `IF NOT
EXISTS` på CREATE TABLE och `DO/EXCEPTION` på FK-constraints. Kan köras
mot befintlig DB utan att smälla.

Resultat: 3 nya tabeller (`consumer_conversation`, `conversation_turn`,
`conversation_memory_fact`) skapas, auth-tabeller (redan finns) skippas.

## Verifiera setup

1. `npm run dev`
2. Login via magic-link på `localhost:3000/login`
3. Öppna `/samtal` — ska visa "På riktigt nu" + tom tråd-lista
4. Skriv en fråga: "Hur var min vecka?" — pipelinen kör:
   - `fetchActiveMemoryFacts` → tom
   - `fetchRelevantEvents` → events från Selvra-protokollet
   - `callMistral` → LLM-svar
   - `validateConsumerOutput` → konstitutionell gate
   - `persistTurn` → INSERT (skapar `consumer_conversation`)
   - `revalidatePath` → UI uppdateras
5. Skriv "Kom ihåg att jag är T1D" — kortslut LLM, sparar fakta
6. Öppna `/minne` — explicit minne syns med radera-knapp
7. Klicka radera (klick 1 bekräfta, klick 2 soft-delete)

## Felsökning

| Symptom | Trolig orsak | Fix |
|---|---|---|
| 'MISTRAL_API_KEY env-var saknas' | env-var inte satt | `.env.local` + restart |
| Server Action: 'Inloggning krävs' | session saknas | Login via /login |
| /samtal visar inga trådar | ingen tråd skapad | Skriv första fråga |
| Tråd-render 404 | tråd tillhör annan user | Kolla `user_id` i DB |
| LLM-fallback varje gång | lock-validate rejecter | Justera system-prompt |

## Constitutional iterations-loop

System-prompten lever i `sendMessage.ts` (`SYSTEM_PROMPT_V0`).
Iteration under Carl-dogfood:

1. 20-30 test-frågor första 2 veckorna
2. För varje LLM-output: kör `validateConsumerOutput` (sker auto)
3. Logga violations via logger (auto-scrubbad)
4. False-negative → lägg till pattern i `consumer-lock-validate.ts`
5. False-positive → justera regex
6. LLM genererar violation → revidera system-prompten

Versionera: `SYSTEM_PROMPT_V0` → `_V1` → `_V2` så drift är synligt.

**Mål efter 2 veckor**: 0 violations per 100 LLM-svar.

## Pending

- Auto-genererad tråd-titel efter första tur (separat PR)
- Optimistic UI för upplevd snabbhet (separat PR)
- DB-query-tester (kräver pg-mem)
- "Radera allt och avregistrera" flow (hård delete vs 30-dagars-fönster)
- Streaming LLM-responses (Server Action med ReadableStream)
- Multi-provider router (om Mistral otillräcklig)
