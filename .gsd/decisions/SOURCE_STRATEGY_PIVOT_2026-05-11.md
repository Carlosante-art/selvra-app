# Source-strategi-pivot: Terra → Open Wearables + Path C

> **⚠️ SUPERSEDED 2026-05-12 för prioritering.**
>
> Se `SOURCE_STRATEGY_V2_2026-05-11.md` (canonical) för aktuell
> integration-prioritering. Den nya strategin flyttar Open Wearables
> från Fas 2 till Fas 3 och introducerar Notion/Readwise som Fas 2.
>
> **Detta dokument kvarstår som referens** för de **arkitektur-beslut**
> som inte ändrats: Terra→Open Wearables-pivot, EU-sovereignty-rationale,
> Path C-cross-DB-read mot Stillra. Använd det här när du behöver veta
> *varför* dessa beslut togs, inte *när* de exekveras.

**Beslut taget 2026-05-11 efter dogfood-loop validerad i prod.**
**Empiriskt verifierat och låst 2026-05-11 (Path C-tillägg).**

---

## TL;DR

Byt source-strategi från Terra API till Open Wearables (themomentum.ai, MIT-licensierad, self-hosted) för aktiva-källor (Garmin, Strava). Dexcom-data adresseras via **Path C — Pattern 1 cross-DB-read mot Stillra-Supabase**, inte via compile-events-migration. Behåll allt annat i selvra-app — intentions-input + tankar-yta är klart, fungerar, oberoende av wearable-broker.

---

## Skälen för pivot

**1. Arkitektonisk konsistens.** Open Wearables kör samma stack som Selvra-protokollet: FastAPI + PostgreSQL + Redis + Celery. Migration är konfiguration, inte refactor.

**2. EU-sovereignty intakt.** Open Wearables är self-hosted. Terra är US-SaaS. Selvras konstitutionella position kräver att wearable-data inte routas genom US-cloud.

**3. Dexcom täcks redan via Stillra.** Stillra → Selvra-pipeline (beslut C: compile-events) hanterar CGM-data. Selvra-app behöver inte egen Dexcom-källa.

**4. Open Wearables täcker mina aktuella behov.** Garmin (har), Strava (framtid). MIT-licensierad, $0 per användare, MCP-server built-in.

**5. Switching-cost är låg nu.** Terra-integration är inte byggd än, bara planerad. Intentions-input + tankar-yta är källagnostik.

**6. Pris skalar rätt.** Terra: $499/månad flat med credit-system. Open Wearables: ~€20-50/månad i hosting-kostnader, skalar med användning av min infra, inte per användare.

---

## Empirisk verifiering 2026-05-11 (gjord innan implementation)

### Resultat av kritisk fråga 1

**NEJ — Dexcom-data flödar inte från Stillra till Selvra idag.** Verifierat
direkt mot prod-Selvras event-log:

```
Stillra-events totalt: 4 st (alla typ stillra.pattern.upserted_by_type)
Senaste compile-event: 2026-05-07 (4 dagar gamla)
CGM/glukos-events: ZERO
```

Pattern-upserts är aggregat, inte rådata. Inga glucose_readings har
någonsin compilats. "Beslut C: compile-events" är delvis implementerad
men har stannat sedan 7 maj.

### Cross-tenant subject-mismatch (separat fynd)

Stillras Carl är `b3a87256-274c-5c87-a73c-3a4e3229eeac` under
Stillra-tenant. Selvra-apps Carl är `2bfe0414-56c6-5692-8ef3-9c7d3991fe90`
under Selvra-tenant. Samma fysiska person, två olika subject_ids.
**Subject-aliasing måste lösas innan synthesis-pipeline byggs.** Se
separat doc `SUBJECT_ALIASING_OPEN_QUESTION_2026-05-11.md`.

### Path C-verifiering: cross-DB readonly-access

Selvra har sedan 2026-05-06 readonly-DB-connection mot Stillra-Supabase
(`SELVRA_STILLRA_READONLY_DB_URL`). Pattern 1 i `~/selvra/`:
`memories.py`-routen läser Stillra-tabeller direkt utan compile-events.

Verifierat 2026-05-11 mot prod:

```
PATTERN 1 MAPPADE (har SELECT-grant):
  ✓ user_memories                  20 rader
  ✓ user_patterns                  12 rader
  ✓ person_models                   2 rader
  ✓ pattern_impressions            50 rader
  ✓ user_wellbeing_snapshots        4 rader

OMAPPADE (selvra_readonly utan SELECT-grant):
  ✗ glucose_readings               permission denied
  ✗ meals                          permission denied
  ✗ doctor_notes                   permission denied
  ✗ life_events                    permission denied
  ✗ chat_messages                  permission denied
```

**Slutsats:** Path C-infrastrukturen funkar. För glucose_readings krävs
ett enradigt GRANT-statement i Stillra-Supabase + en ny Pattern-1-modell
i `~/selvra/src/selvra/db/stillra_models.py`. **Inte** 1–3 dagar
compile-events-migration.

---

## Varför Path C är doktrinärt rätt

Path C löser tre problem samtidigt:

1. **CGM-data utan migration.** Synthesis-pipelinen läser Stillras
   glucose_readings direkt vid render-tid via befintlig readonly-connection.
   Stillra äger sin data (operational concern, real-time UI, alarm-loop);
   Selvra-synthesis komponerar över källor.
2. **Cross-tenant subject-aliasing löses naturligt.** Synthesis vet att
   selvra-apps Carl och Stillras Carl är samma fysiska person.
   Aliasing-mapping ligger i synthesis-kontext, inte i protokoll-kärnan.
3. **Doktrinärt rent.** Stillra är operational-layer för T1D-vertikalen.
   Selvra-synthesis komponerar — inkluderar Stillras DB när relevant.
   Det är exakt vad vertikal-arkitekturen i Selvras dokumentation säger.

Path C är inte kompromiss. Den är arkitektoniskt mer rätt än både
"compile-events" (A) och "dogfood utan CGM" (B).

---

## Verifiering som måste göras INNAN implementation

**Kritisk fråga 1: Är Dexcom-data faktiskt synlig i Selvras event-log för min subject_id idag?**

Beslut C togs i dag — compile-events från Stillra till Selvra. Det är **beslut**, inte nödvändigtvis implementation. Verifiera konkret:

- Query Selvras event-log för subject_id 2bfe0414-... (Carl-tenant)
- Filtrera på events från Stillra (source-attribuering)
- Rapportera: finns CGM/glukos-events? Hur många, vilken event-typ, senaste timestamp?
- Om nej: är beslut C implementerat eller bara beslutat? Vad krävs för att aktivera Stillra → Selvra compile-events?

**Detta blockerar Open Wearables-bytet. Om Dexcom-data INTE strömmar via Stillra, behöver detta byggas först — annars är dogfood utan CGM-data, vilket är allvarligt för en T1-diabetiker som första användare.**

**Kritisk fråga 2: Bekräfta Open Wearables-coverage för mina behov.**

- Garmin: live i Open Wearables 0.5? Vilka data-typer? Specifikt: HRV, sleep, activity, Body Battery (även om proprietär score), workout-data.
- Strava: live? Webhook-driven?
- MCP-server: tillgänglig och kompatibel med vår selvra-protokoll-arkitektur?

**Kritisk fråga 3: Deployment-strategi.**

- Kan Open Wearables co-deployas med Selvra-protokollet på samma Railway/infrastruktur, eller behöver separat instans?
- Resource-krav (RAM, CPU, storage) för Open Wearables minimum-installation?
- Pålitlighet: v0.5-alpha, hur stabil är det för single-user dogfood?

---

## Implementations-plan (om verifieringar landar OK)

### Fas 1: Aktivera Path C för glucose_readings ✅ DONE 2026-05-11

Ursprungligt antagande ("compile-events från Stillra") visade sig
empiriskt falskt. Ersatt med Path C (cross-DB readonly).

**Genomfört:**

1. ✅ **K2-bred GRANT** i Stillra-Supabase — 22 nya tabeller
   (13 K2 + 9 K3) plus de 5 redan-grantade. Carl exekverade SQL:n i
   Supabase SQL-editor. Verifierat med count-query mot alla 27 tabeller
   — alla returnerar rader.
2. ✅ **`StillraGlucoseReading`-modell** i
   `~/selvra/src/selvra/db/stillra_models.py`. Komposit-PK (user_id, time),
   value_mmol+value_mgdl+trend. Commit `b0af34b` på `~/selvra/`-main.
3. ✅ **Verifierat mot Carls riktiga CGM-data**: 5095 readings för
   stillra-user-id `12647887-c723-4bd0-9196-eedeeab1fbd4`, senaste 5
   readings hämtade via modellen — bara minuter gamla, värdena varierar
   8.7–12.6 mmol/L med trend `DoubleDown`. Live-flow från Dexcom-poll
   bevisat åtkomligt för Selvra.

**Faktisk tid: ~25 minuter** (matchar estimat).

Andra K3-tabeller (sleep_guard_events 654 rader, chat_messages 128 rader,
meals 2 rader, etc.) är grantade men har **inte** Pattern-1-modeller än
— de byggs on-demand när synthesis-pipelinen faktiskt behöver läsa dem.

**Öppna sub-frågor som Fas 1 INTE löste** (per Carl-notering 2026-05-11):

- *Audit-loggning på cross-DB-reads* — registreras Pattern-1-queries med
  vem/när/för-vilket-subject? Compliance-relevant. Verifieras innan
  synthesis börjar läsa K2-data i större skala.
- *Subject-aliasing* — selvra-app:s Carl (`2bfe0414-...`) ≠ Stillras
  Carl (`12647887-...` → `b3a87256-...`). Måste lösas innan synthesis.
  Se `SUBJECT_ALIASING_OPEN_QUESTION_2026-05-11.md` med fyra alternativ.

### Fas 2: Deploya Open Wearables

- Clone från github.com/the-momentum/open-wearables
- Konfigurera för EU-region (Frankfurt, samma som Selvra)
- Setup admin-konto, API-keys
- Verifiera Swagger UI och developer-portal accessible
- Smoke-test: tom Garmin-koppling fungerar

Tids-estimat: 0.5-1 dag.

### Fas 3: Koppla Open Wearables → Selvra-protokoll

Open Wearables har webhooks för data-events. Behöver:

- Webhook-receiver i Selvras http-fasad
- Mapping från Open Wearables event-schema till SelvraEvent-schema
- Provenance-tracking (source: "open-wearables", specific-provider: "garmin")
- ComplianceModerator-pass per existerande pattern
- Persist till event-log

Tids-estimat: 1-2 dagar.

### Fas 4: Selvra-app källtoggling-vy

Per DESIGN.md Steg 4 i onboarding-flödet:

- "Kropp och aktivitet" → Koppla Open Wearables (Garmin för start)
- Användaren omdirigeras till Open Wearables connection-flow
- Callback tillbaka till selvra-app efter OAuth
- Bekräftelse-vy

Tids-estimat: 1-2 dagar.

### Fas 5: Carl kopplar sin egen Garmin

Dogfood-test: jag (Carl) kopplar Garmin Connect via selvra-app → Open Wearables → events flödar in i Selvra. Verifiera med query mot subject_id 2bfe0414-...

Tids-estimat: 1 dag (inkluderar debug om något inte fungerar end-to-end).

---

## Vad som INTE ändras

- Intentions-input (klart, fungerar, oberoende)
- Tankar-yta (klart, fungerar, oberoende)
- Onboarding-flöde i selvra-app (5 steg, oförändrat)
- Tio lock-positioner för reflektions-format
- Tre-lagers self-report-arkitektur
- Brev-metaforen, "reflektion"-ordvalet, "hon journalar redan"
- Stillra som existerande vertikal (fortsätter fungera, kopplad till Selvra)
- Synthesis-pipeline-arkitektur (när den byggs)

---

## Avbrytspunkter (om något går fel)

**Om Stillras Dexcom → Selvra-pipeline inte fungerar och tar > 5 dagar att fixa:**
Stanna. Återgå till diskussion. Möjligen behöver Terra ändå vara fallback för dogfood om beslut C-implementation visar sig vara större än väntat.

**Om Open Wearables 0.5-alpha har kritiska bugs i Garmin-integration:**
Stanna. Rapportera till Momentum-teamet via Discord. Återgå till Terra som backup tills Open Wearables stabiliserats.

**Om deployment-komplexitet visar sig vara större än 2 dagar för single-user-instans:**
Stanna. Open Wearables är möjligen för tidig fas för v1. Återgå till Terra med möjlighet att migrera vid v2 när Open Wearables är 1.0.

---

## Förväntat resultat

Efter komplett implementation: selvra-app v1 med Garmin-data flödandes från Open Wearables, Dexcom-data flödandes från Stillra, allt i samma Selvra event-log under min subject_id. Klart för synthesis-pipeline-arbete.

Total tids-estimat: 5-10 dagar fokuserat arbete, beroende på Stillra-pipeline-status.

---

## Nästa steg

1. Verifiera kritisk fråga 1 (Dexcom via Stillra) först
2. Rapportera tillbaka med konkret status
3. Sedan beslut: kör Open Wearables eller revidera plan
