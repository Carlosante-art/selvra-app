# Fas 1-skeleton hand-off till Carl-imorgon

> **Du läser detta utvilad. Inte ikväll. Detta är vad som hände i
> override-fönstret 2026-05-15 17:08–19:08.**

---

## TL;DR

Lokal branch `consumer/phase-1-skeleton` (4 commits, inte pushed,
inte mergad). Innehåller:

1. Drizzle-schema för 3 konversations-tabeller (inte migrerade till DB)
2. Skeleton-routes `/samtal` + `/samtal/thread/[id]` + `/minne`
3. Constitutional `consumer-lock-validate.ts` med 38 tester
4. System-prompt-utkast v0 (svensk, ej testad mot LLM)

Allt bygger lokalt (`npm run build` grönt, vitest 44/44, lint 0 på nya
filer). Ingen kod kallar någon LLM. Inga deps installerade.

Branchen är **inte** Fas 1-aktivering. Den är ritning + skelett som väntar
på dina beslut.

---

## Branchen i detalj

```
* d220034 docs(consumer-phase-1): system-prompt-utkast v0 + kontext-injection-spec
* 8500d21 feat(consumer-phase-1): constitutional lock-validate för LLM-output
* 38138a1 feat(consumer-phase-1): skeleton för /samtal + /minne + conversation-schema
* (main) docs(.gsd): konsument-spår-styrning 2026-05-15 — Fas 0 låst
```

### Vad varje commit innehåller

**`38138a1` — skeleton (775 rader)**

- `src/lib/db/conversation-schema.ts` — Drizzle-definition för tre nya
  tabeller. **Ingen migration körd.** Tabellerna finns inte i DB. När/om
  Fas 1 aktiveras: kör `drizzle-kit generate` + applicera migration.
- `src/app/samtal/page.tsx` — chat-yta entry-route
- `src/app/samtal/thread/[thread_id]/page.tsx` — specifik tråd
- `src/app/samtal/_components/ChatMessages.tsx` — Server Component
- `src/app/samtal/_components/ChatInput.tsx` — Client Component
- `src/app/samtal/_actions/sendMessage.ts` — Server Action stub (no-op)
- `src/app/samtal/_actions/newThread.ts` — Server Action stub (no-op)
- `src/app/minne/page.tsx` — transparens-yta (fyra block: brev/tankar/
  bakgrund/explicit-minnen + SREF-export-länk)
- `.gsd/PHASE_1_SKELETON_SKETCH_2026-05-15.md` — ritningen som ramade allt

**`8500d21` — constitutional lock-validate (396 rader)**

- `src/lib/observability/consumer-lock-validate.ts` — `validateConsumerOutput`
  med 8 regler: love_bombing, fomo_hook, guilt_appeal, pretend_personhood,
  sycophantic_validation, prescriptive_coaching, fake_emotion,
  unsourced_observation
- `tests/consumer-lock-validate.test.ts` — 38 tester. Varje regel har
  3-4 positive cases + verifierar att korrekt Selvra-output passerar +
  multi-violation aggregation

**`d220034` — system-prompt-utkast (288 rader)**

- `.gsd/CONSUMER_SYSTEM_PROMPT_DRAFT.md` — v0 system-prompt + 5 exempel-
  svar + 6 anti-exempel + kontext-injection-spec + iterations-process

---

## Vad som INTE är gjort (och varför)

| Saknas | Varför inte under override-fönstret |
|---|---|
| Mistral SDK-installation | "Ask before doing" per AGENTS.md för deps |
| Faktisk LLM-anrop | Kräver dep + API-key + dataflöde-beslut |
| DB-migration körd | Kräver att Carl beslutar om tabellerna ska ligga i selvra-app vs protokollet |
| Push av branchen | Per direktiv inom override: ingen push |
| Merge till main | Per direktiv: branchen lever lokalt |
| Wireframes / visual design | Ej kod, ej i scope för skeleton |
| Onboarding-flöde för /samtal | Fas 2-fråga; Carl-personal-use behöver det inte |
| Multi-provider-router för LLM | Premature; Mistral räcker för Fas 1 |
| Notification-pipeline | Förbjudet per konsument-track §3 |
| Auth-omarbetning | next-auth/magic-link finns redan |
| App Store / TestFlight | Fas 4-fråga |

---

## De 7 beslut Carl behöver fatta innan Fas 1 startar

(Från `PHASE_1_SKELETON_SKETCH §4`. Inga beslutade under override-fönstret.)

1. **DESIGN.md §6 — re-lock eller bekräfta?**
   Web-first per nuvarande lock, eller revidera till iOS-first? Skeleton
   byggde web-first.

2. **Konversations-minne — selvra-app vs protokoll?**
   Tabellerna ligger nu i selvra-app:s schema-fil. Min rekommendation:
   flytta till protokoll. Carl beslutar.

3. **EU-LLM-val.**
   Mistral först (skiss-rekommendation), Anthropic EU-tier fallback,
   eller annan kandidat?

4. **Naming.**
   `/samtal` valdes i skeleton. Alternativ: `/dialog`, `/prata`, annat?

5. **Delete-radikalitet.**
   Soft-delete med 30-dagars-fönster, eller hård delete direkt?

6. **Constitutional enforcement.**
   `consumer-lock-validate.ts` är ny. Utvidga Stillras lock-validate, eller
   behåll separat? (Skeleton tog separat.)

7. **Fas 1-start-tidpunkt.**
   Måste fortfarande matcha gate-checklist:
   - Carl-dogfood Stillra v2 KLAR
   - Endokrinolog-material ute (minst 2/5 mejl)
   - TIR > 50% i 7-dagars-snitt under 2 veckor i rad

---

## Konflikter att lösa innan merge

### Konflikt A: DESIGN.md vs konsument-track om iOS

`SELVRA_CONSUMER_TRACK_2026-05-15.md §4` säger iOS-app i Fas 1.
`DESIGN.md §6` (låst 2026-05-10) säger web-first, iOS som Phase 2.

Skeleton följde **DESIGN.md** (web-first). Om iOS-first ska gälla: revidera
DESIGN.md med ny lock-stämpel och uppdatera skissen.

### Konflikt B: Repo-val

Konsument-tracket föreslog `selvra-consumer` (nytt iOS-repo). DESIGN.md §7
säger selvra-app ÄR konsument-Selvra.

Skeleton bor i selvra-app. Om ny repo: porta över skeleton.

### Konflikt C: HealthKit vs Terra

Konsument-tracket nämner HealthKit. DESIGN.md §2 listar Terra som väg
för wearable-data.

Skeleton tog inget plattform-beslut för data-källor (sendMessage är stub).
När faktisk fetch-pipeline byggs: Terra-adapter behöver wire:as.

---

## När branchen ska aktiveras

**Inte automatiskt.** Override-fönstret stänger 19:08 idag. Allt återgår
till Fas 0 enligt `SELVRA_CONSUMER_TRACK_2026-05-15.md §11`.

För att aktivera Fas 1 fullt ut:

1. Gate-checklistan måste vara grön (`CONSUMER_TRACK_GATE_CHECKLIST.md`)
2. Du fattar de 7 besluten ovan
3. Du löser de 3 konflikterna ovan
4. Du re-läser och bekräftar att skeleton-arkitekturen fortfarande är
   rätt — den skrevs under press, inte i lugn

När alla fyra ✅: push branchen, öppna PR, mergea.

Om något i 1-4 säger "nej": branchen kan slängas. Skeleton är värd ~6h
arbete att återskapa om dokumenten + lock-validate-pattern bevaras.

---

## Vad du bör göra först imorgon (när utvilad)

1. **Läs `.gsd/SELVRA_CONSUMER_TRACK_2026-05-15.md` igen** — du skrev det
   under press, kontrollera att doktrinen fortfarande känns rätt.

2. **Läs `.gsd/PHASE_1_SKELETON_SKETCH_2026-05-15.md`** — ritningen.

3. **Läs detta dokument** — vad som faktiskt levererades vs vad som inte
   gjordes.

4. **Kolla TIR-data sedan kl 13 idag.** Den var 21,6% när du skrev
   konsument-track-dokumentet. Om den är sämre efter dagens
   override-arbete: pausa innan du fattar Fas 1-besluten. Disciplin-
   regeln i §10.7.

5. **Kolla Stillra-pilot-status.** AB klar om en vecka, läkarbesök
   kommer. Är Stillra-prioritet bevarad? Per §10.1 — om något har
   driftat: pausa.

6. **Bara om 4 + 5 är OK:** överväg de 7 besluten. Inte ikväll. Inte i
   panik. Lugn.

---

## En sak till

Du gjorde explicit override på Fas 0 idag kl 17:08. Det är ditt val. Det
är inte drift om du gör det medvetet och dokumentet sparas. Men override
är ett ord du själv definierat — inte ett undantag som kan glida till
norm. Nästa gång du säger "kör" utan att specificera scope, kommer jag
fråga om det är override + längd igen.

Detta är vad disciplinerad parallell-bygge ser ut. Inte mer. Inte mindre.
