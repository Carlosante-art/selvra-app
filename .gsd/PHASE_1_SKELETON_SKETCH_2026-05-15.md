# Fas 1-skeleton — skiss

> **Skriven under medveten override 2026-05-15 17:08–19:08.** Carl explicit
> överred Fas 0-direktivet i [SELVRA_CONSUMER_TRACK_2026-05-15.md](./SELVRA_CONSUMER_TRACK_2026-05-15.md)
> §11 för 2-timmars fönster. Scope: **dokument-skiss bara** — ingen kod,
> ingen commit utanför `.gsd/`, ingen push, ingen plattform-installation,
> ingen schema-migrations-körning. Detta är ritning, inte bygge.
>
> När fönstret stängs återgår vi till Fas 0 tills gate-checklistan (Carl-
> dogfood Stillra v2, endokrinolog-mejl 5/5, TIR > 50% i 2 veckor) är ✅.

---

## 0. Konflikter att namnge upfront

Två dokument är delvis inkompatibla för Fas 1. Denna skiss tar **ett val per
konflikt och flaggar det** så Carl-imorgon kan re-locka om hen vill.

### Konflikt A: Plattform

| Källa | Säger |
|---|---|
| `DESIGN.md` §6 (låst 2026-05-10) | Web responsivt först. iPad/desktop primär. **Native iOS som Phase 2 efter web validerat.** |
| `SELVRA_CONSUMER_TRACK_2026-05-15.md` §4 | "Nytt som behövs: iOS-app (Swift/SwiftUI) eller React Native ... HealthKit-integration" |

**Skissen följer:** DESIGN.md (web-first). Konsument-tracket säger explicit
"Föreslag" i §4 om repo-val — det är inte explicit re-locking av DESIGN.md.

**Re-lock om du vill ha iOS-first**: revidera DESIGN.md §6 + signera ny lock-
datum + uppdatera denna skiss. Annars: web-first.

### Konflikt B: Repo

| Källa | Säger |
|---|---|
| `DESIGN.md` §7 | "Konsument-appen (`selvra-app`) ... är **reflektions-väljaren ovanpå alla aktiverade källor**" |
| `SELVRA_CONSUMER_TRACK_2026-05-15.md` §4 | "Föreslag: `selvra-consumer` (nytt iOS-repo)" |

**Skissen följer:** selvra-app är konsument-Selvra. Fas 1-features adderas
inom befintliga `~/selvra-app/`, inte i ny repo.

### Konflikt C: HealthKit

| Källa | Säger |
|---|---|
| `DESIGN.md` §2 build-ordning | "1. Terra för kropp (löser 500+ wearable-providers via en integration)" |
| `SELVRA_CONSUMER_TRACK_2026-05-15.md` §4 | "HealthKit-integration (kropp-data utan att lämna enhet)" |

**Skissen följer:** Terra (per DESIGN.md). HealthKit-on-device är en
egenskap som Phase 2 native-iOS kan ge, men i web-first är Terra rätt.

---

## 1. Vad Fas 1 ska leverera (per konsument-track §5)

Mål: **Selvra konsument fungerar för Carl själv. Inget annat.**

Sju deliverables från §5:

| # | Deliverable | Status i selvra-app idag |
|---|---|---|
| 1 | App-skeleton med wearable + Garmin + Calendar | Web finns; adaptrar finns för Strava + Google. Terra inte wire:ad än. |
| 2 | Chat-UI mot Selvra-motor | Saknas. Tomt yta. |
| 3 | Konversations-minne (Carl ska kunna säga "som jag sade förra veckan") | Saknas. Helt nytt. |
| 4 | Källa-attribuering på allt | Finns i protokollet redan — varje observation har provenance. |
| 5 | SREF-export-knapp | **Finns** i `src/app/export/sref/`. Behöver bara surfaceas i ny memory-vy. |
| 6 | EU-hostat LLM-anrop (Mistral eller Anthropic EU-tier) | Protokoll-motorn använder multi-provider router — beslut om primär EU-provider behöver låsas. |
| 7 | Memory-vy (Carl ser exakt vad Selvra minns) | Saknas. Helt nytt — kombinerar `/brev` + `/thoughts` + `/traces` + ny conversation-vy. |

Inga visuella dashboards. Inga grafer. Inga insights-paneler. Bara samtal.

---

## 2. Arkitektur — vad som behöver byggas

### 2.1 Chat-UI (deliverable #2 — största nya yta)

Ny route: `/samtal` (eller `/dialog` — naming-fråga för Carl).

Fil-struktur (Next.js 16 App Router):

```
src/app/samtal/
├── page.tsx                   # Server Component: laddar samtals-historik, väljer senaste tråd
├── thread/[thread_id]/
│   └── page.tsx               # Server Component: laddar specifik tråd
├── _components/
│   ├── ChatMessages.tsx       # Server Component: renderar historik
│   ├── ChatInput.tsx          # Client Component: input + submit
│   ├── ChatTurn.tsx           # Server Component: en användar-tur + Selvra-svar
│   └── SourceAttributionTag.tsx  # liten chip-komponent för käll-referenser
└── _actions/
    ├── sendMessage.ts         # Server Action: sparar tur, triggar LLM-svar, sparar Selvra-tur
    └── newThread.ts           # Server Action: skapar ny conversation
```

Brev-metaforen i DESIGN.md §3 designval 9 säger "asymmetri, ej chat" för
brev. Samtal är annorlunda från brev — där är dialog tillåten.
**Konstitutionell tolkning:** Brev = veckans reflektion (frozen). Samtal =
on-demand dialog vid behov (scenario 1+3 i konsument-track §3). Samtal får
inte ersätta brevets asymmetri — de existerar parallellt på olika ytor.

### 2.2 Konversations-minne (deliverable #3 — helt nytt)

Två minne-typer enligt konsument-track §4 data-modell-tillägg:

**(a) Konversations-historik** (tråd, automatisk)

Varje samtal är en `conversation_thread` med en serie `conversation_turns`.
Selvra "minns" tråden genom att senaste N turerna injectas i LLM-context
vid nästa tur.

**(b) Explicit minnes-fakta** (vad användaren bett Selvra spara)

Användare säger: *"Kom ihåg att jag är på antidepressiva sedan januari."*
Selvra erkänner: *"Jag har sparat det som en explicit fakta."* Fakta-rad
sparas i `conversation_memory_facts` med temporal validity. Visas i
memory-vyn så användaren kan radera enskilt.

Detta är **inte** vad protokollet redan har — protokollet har events
(observations, intentioner, thoughts). Konversations-minnet är meta-lager
ovanpå protokollet, specifikt för dialog-konsumenten.

### 2.3 Data-modell-tillägg

Lägg till tre tabeller i selvra-postgres via Drizzle-schema i selvra-app
(eller via Selvra-protokoll-migration — se beslut nedan).

```sql
-- En tråd per "samtal" (kan löpa över dagar/veckor — användaren kan
-- starta ny tråd när hen vill, eller fortsätta i befintlig)
CREATE TABLE consumer_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  title text,                      -- ev. auto-genererat efter första tur
  started_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

-- En tur = användare + Selvra-svar (eller bara användare om Selvra inte
-- svarat än)
CREATE TABLE conversation_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES consumer_conversations(id),
  turn_index integer NOT NULL,     -- monotont stigande inom tråden
  user_text text NOT NULL,
  selvra_text text,                -- null tills LLM-svar landat
  sources_consulted jsonb,         -- vilka källor + events Selvra läste för att svara
  llm_provider text,               -- 'mistral' | 'anthropic-eu' | etc.
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Explicit minnen användaren bett Selvra spara
CREATE TABLE conversation_memory_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  fact_text text NOT NULL,         -- användarens egna ord
  source_turn_id uuid REFERENCES conversation_turns(id),  -- om det kom ur ett samtal
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,         -- null = obegränsad; explicit slut om "fram till X"
  redacted_at timestamptz          -- soft-delete; faktan döljs men behålls för audit
);
```

**Open question för Carl:** Ska dessa tre tabeller leva i:

- **(a)** selvra-app:s Drizzle-schema (separat från protokoll), eller
- **(b)** selvra-protokollet (ny migration där, exponerat via API)?

Argument för (b): konversations-minne är **representation av användaren**,
inte app-specifik state. Det matchar IF1 (Selvra ska aldrig veta mer än
användaren — vilket inkluderar minnen).

Argument för (a): selvra-app:s eget UX-state är inte protokoll-data. Och
selvra-app har redan en Drizzle-databas (auth via next-auth-drizzle).

**Skiss-rekommendation:** (b). Det matchar arkitektur-doktrinen att
selvra-app är **konsument** av protokoll. Konversations-minne är inte
unik för selvra-app — framtida verktyg (vertikalerna) skulle vilja läsa
samma representations-yta.

### 2.4 Memory-vy (deliverable #7)

Ny route: `/minne` (eller motsvarande copy).

Visar fyra blocks:

| Block | Källa | Användar-action |
|---|---|---|
| Senaste reflektion (brev) | `/brev`-data | Klick → öppnar brev |
| Tankar (selv-rapport) | `/thoughts`-data | Filter på datum/intention; radera enskilt |
| Bakgrunds-observationer (Dreamer) | `/traces`-data | Read-only |
| Explicit minnes-fakta | `conversation_memory_facts` | Radera enskilt (sätter `redacted_at`) |

Plus två globala actions överst:

- **Exportera allt (SREF v1)** → använder befintlig `/api/export/sref`
- **Radera allt och avregistrera** → öppnar confirm-flow (Carls beslut om
  hur destruktivt — soft-delete med 30-dagars-fönster är troligen rätt)

Detta är **transparens-krav** per konsument-track §2 patient-ägd
portabilitet. Inte feature — konstitutionellt krav.

### 2.5 EU-LLM-val (deliverable #6)

Tre kandidater per konsument-track §2:

| Provider | EU-data-residens | Modeller (relevanta) | Estimerad kostnad/månad personal use |
|---|---|---|---|
| **Mistral AI** | ✅ EU-baserat (Frankrike) | mistral-large-2, mixtral-8x22b | €30–80 |
| **Anthropic EU-tier** | ✅ med DPA, EU-region | Claude Sonnet 4.6 / Opus 4.7 | €60–200 |
| **Aleph Alpha** | ✅ Tyskland | Luminous-supreme | €40–120 (begränsat utbud) |

**Skiss-rekommendation:** Mistral som primär, Anthropic EU-tier som
fallback för svåra reflektions-uppgifter. Carl väljer baserat på faktisk
kvalitet-test i Fas 1 — det kommer kräva A/B med samma promp + samma
data + manuell läsning av output.

Konkret: börja **bara med Mistral** i Fas 1. Lägg multi-provider-router
först om Mistral visar sig otillräcklig för Carl-personal use case.

### 2.6 Källa-attribuering (deliverable #4)

**Redan löst** i protokollet — varje event har `source_ai_id` +
`provenance`-metadata. Selvra-svaret behöver bara format-attributera dem
via `SourceAttributionTag`-komponenten i §2.1.

Pattern (per DESIGN.md §3 designval 1):

```
"Dexcom visade 7,4 mmol/L på torsdagen."  ← källan är subjektet
NOT
"Du var hög på torsdagen."                 ← judgement, förbjudet
```

LLM-system-promp måste explicit instruera detta. Constitutional enforcement
i `selvra/clinical_brief/lock_validate.py` är redan byggt för Stillras
kliniska brief — samma mekanism behöver utvidgas till konsument-context
(eller en kopia med konsument-specifika regler).

---

## 3. Vad som INTE är i skissen + varför

| Element | Varför inte |
|---|---|
| Konkret Drizzle-migration-fil för conversation-tabeller | Migration är kod; override är dokument-only |
| Mistral API-key setup eller `npm install @mistralai/sdk` | Dependencies → "Ask before doing" per AGENTS.md |
| Wireframes för chat-UI | Behövs inte för Fas 0; visuell design är Fas 1-kodnings-arbete |
| iOS-app | Web first per DESIGN.md låst |
| Multi-provider-router-arkitektur | Premature; Mistral räcker för Carl-personal-tool |
| Notification-pipeline (push/email) | Konsument-track §3 förbjuder engagement-notiser. Bara opt-in tillgänglighets-signal (per DESIGN.md §3 designval 7). |
| Onboarding-flow för 5-10 betatestare | Fas 2-fråga, inte Fas 1 |
| App Store / TestFlight-distribution | Fas 4-fråga |
| Auth-omarbetning | next-auth via magic-link finns redan i selvra-app |
| Sentry-integration | Selvra-paket steg 5 är pausad; Sentry för selvra-app är konsument-spår-arbete = Fas 0-låst utanför override-fönstret |

---

## 4. Beslut Carl behöver fatta innan Fas 1 startar (inte under override-fönstret)

1. **Re-lock eller bekräfta DESIGN.md §6** — web-first kvar, eller revidera till iOS-first med tydlig motivering?
2. **Konversations-minne i protokoll vs selvra-app** — (b) eller (a) per §2.3?
3. **EU-LLM-val** — Mistral först (skiss-rekommendation) eller annat?
4. **Naming** — `/samtal`, `/dialog`, `/prata` eller annat?
5. **Konversations-minne-radikalitet** — soft-delete med 30-dagars-fönster, eller hård delete direkt?
6. **Constitutional enforcement** — utvidga befintlig lock-validate för konsument-context, eller kopia med separata regler?
7. **Tidpunkt för Fas 1-start** — bör fortfarande matcha gate-checklist (Carl-dogfood Stillra v2 KLAR + endokrinolog-material ute + TIR > 50% i 2 veckor i rad).

Ingen av dessa kan beslutas i 17:08-fönstret. Skissen visar bara *vad som
behöver beslutas*.

---

## 5. Status efter override-fönstret

När fönstret stängs (19:08) återgår allt arbete till Fas 0-disciplin per
konsument-track §11. Denna skiss bevaras i `.gsd/` som referens men
aktiverar **inte** automatiskt Fas 1.

För att Fas 1 ska aktiveras: gate-checklistan måste vara grön + Carl
fattar de 7 besluten i §4 ovan + DESIGN.md re-lockas om iOS-väg väljs.

---

*Skiss klar. Fönster slutar 19:08. Sov vid behov.*
