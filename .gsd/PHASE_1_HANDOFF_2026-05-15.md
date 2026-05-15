# Fas 1-skeleton hand-off

## TL;DR

Lokal branch `consumer/phase-1-skeleton` med 4 commits, inte pushed,
inte mergad. Innehåller:

1. Drizzle-schema för 3 konversations-tabeller (inte migrerade till DB)
2. Skeleton-routes `/samtal` + `/samtal/thread/[id]` + `/minne`
3. Constitutional `consumer-lock-validate.ts` med 38 tester
4. System-prompt-utkast v0 (svensk, ej testad mot LLM)

Bygger lokalt: `npm run build` grönt, vitest 44/44, lint 0 på nya filer.
Ingen kod kallar någon LLM. Inga deps installerade.

---

## Branchen i detalj

```
* bf864bd docs(consumer-phase-1): hand-off
* d220034 docs(consumer-phase-1): system-prompt-utkast v0 + kontext-injection-spec
* 8500d21 feat(consumer-phase-1): constitutional lock-validate för LLM-output
* 38138a1 feat(consumer-phase-1): skeleton för /samtal + /minne + conversation-schema
* (main) docs(.gsd): konsument-spår-styrning
```

### Vad varje commit innehåller

**`38138a1` — skeleton (775 rader)**

- `src/lib/db/conversation-schema.ts` — Drizzle-definition för tre nya
  tabeller. Ingen migration körd. Tabellerna finns inte i DB.
- `src/app/samtal/page.tsx` — chat-yta entry-route
- `src/app/samtal/thread/[thread_id]/page.tsx` — specifik tråd
- `src/app/samtal/_components/ChatMessages.tsx` — Server Component
- `src/app/samtal/_components/ChatInput.tsx` — Client Component
- `src/app/samtal/_actions/sendMessage.ts` — Server Action stub (no-op)
- `src/app/samtal/_actions/newThread.ts` — Server Action stub (no-op)
- `src/app/minne/page.tsx` — transparens-yta (fyra block: brev/tankar/
  bakgrund/explicit-minnen + SREF-export-länk)
- `.gsd/PHASE_1_SKELETON_SKETCH_2026-05-15.md` — ritningen

**`8500d21` — constitutional lock-validate (396 rader)**

- `src/lib/observability/consumer-lock-validate.ts` — `validateConsumerOutput`
  med 8 regler: love_bombing, fomo_hook, guilt_appeal, pretend_personhood,
  sycophantic_validation, prescriptive_coaching, fake_emotion,
  unsourced_observation
- `tests/consumer-lock-validate.test.ts` — 38 tester

**`d220034` — system-prompt-utkast (288 rader)**

- `.gsd/CONSUMER_SYSTEM_PROMPT_DRAFT.md` — v0 system-prompt + 5 exempel-
  svar + 6 anti-exempel + kontext-injection-spec + iterations-process

**`bf864bd` — detta dokument.**

---

## Vad som INTE är gjort

| Saknas | Varför |
|---|---|
| Mistral SDK-installation | Ny dep — kräver beslut |
| Faktisk LLM-anrop | Kräver dep + API-key + dataflöde-beslut |
| DB-migration körd | Kräver beslut om tabellerna ska ligga i selvra-app vs protokollet |
| Push av branchen | Kräver beslut |
| Merge till main | Kräver beslut |
| Wireframes / visual design | Inte i scope för skeleton |
| Onboarding-flöde för /samtal | Carl-personal-use behöver det inte |
| Multi-provider-router för LLM | Mistral räcker för Fas 1 |
| Notification-pipeline | Förbjudet per konsument-track §3 |

---

## De 7 beslut innan Fas 1 startar

(Från `PHASE_1_SKELETON_SKETCH §4`.)

1. **DESIGN.md §6 — re-lock eller bekräfta?**
   Web-first per nuvarande lock, eller revidera till iOS-first?
   Skeleton byggde web-first.

2. **Konversations-minne — selvra-app vs protokoll?**
   Tabellerna ligger nu i selvra-app:s schema-fil. Rekommendation:
   flytta till protokoll.

3. **EU-LLM-val.**
   Mistral först (rekommendation), Anthropic EU-tier fallback,
   eller annan kandidat?

4. **Naming.**
   `/samtal` valdes. Alternativ: `/dialog`, `/prata`, annat?

5. **Delete-radikalitet.**
   Soft-delete med 30-dagars-fönster, eller hård delete direkt?

6. **Constitutional enforcement.**
   `consumer-lock-validate.ts` är ny. Utvidga Stillras lock-validate, eller
   behåll separat? Skeleton tog separat.

7. **Fas 1-start-tidpunkt.**
   Per gate-checklistan.

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
