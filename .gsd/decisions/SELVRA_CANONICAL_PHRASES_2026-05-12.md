# Selvra — 10 canonical positionerings-fraser

*Konsoliderat 2026-05-12. Lockade fraser från memory + app_focus-doktrin.*

---

Detta dokument är **register**, inte synthesis. Varje fras är redan låst
i memory eller separata canonical-docs. Här samlas de på ett ställe så
framtida sessions (och Carl själv) kan hänvisa till hela paketet utan att
gräva i memory-mappen.

Frasen är **canonical** — den får återanvändas ordagrant i copy, pitch,
manifest, hero-text. Variationer är OK när tonen kräver det, men
substansen i frasen får inte förvanskas utan explicit re-locking.

Tre nivåer:

- **Produkt-frase** (fras 1-7): hur produkten beskrivs för användaren.
- **Konkurrent-frase** (fras 8): hur Selvra skiljer sig från specifika
  konkurrenter i AI-memory-portability-kategorin.
- **Meta-frase** (fras 9-10): kategori-position som styr alla framtida
  produkt- och kommunikations-beslut.

---

## Fras 1 — Hon journalar redan

> *"Hon journalar redan i huvudet eller till ChatGPT — Selvra erbjuder
> bara en yta som dubblar som self-report-källa."*

**Locked:** 2026-05-10.
**Vad den positionerar:** self-report som biprodukt av liv, inte arbete-
för-app. Användaren gör inget extra; Selvra läser där hon redan finns.
**Använd när:** någon frågar om "ännu en journaling-app" eller hur Selvra
får data utan att kräva tid av användaren.

---

## Fras 2 — Reflektionen är ett brev

> *"En reflektion är som ett brev till henne från någon som har observerat
> hennes vecka."*

**Locked:** 2026-05-10.
**Vad den positionerar:** asymmetrisk format. Selvra producerar, hon
konsumerar och annoterar. Brevet står kvar; hon skriver i marginalen.
**Konsekvenser:** ingen tvångs-fråga i slutet (brev avslutas inte med
fråga). Ingen retention-notification ("Selvra saknar dig" är aldrig vad
ett brev säger).
**Använd när:** copy/UI-beslut om format, retention-mekanik, chat-vs-
brev-debatter.

---

## Fras 3 — "Reflektion" som ordval

> *"Reflektion är något som tillhör dig. Brief är vad någon annan ger dig."*

**Locked:** 2026-05-10.
**Tre distinktioner som ordet bär:**

1. *Brief* är vad chef/analytiker ger dig; *reflektion* tillhör dig —
   användar-ägd ner på ordnivå.
2. Engramme har "memory", Mem0 har "memories", Personal AI har "PLM" —
   tekniska/jargong-ord. Selvra har "reflektion" — mänskligt, urgammalt,
   nu strukturerat och longitudinellt.
3. Reflektion är *passiv tills efterfrågad* (matchar design-val: ingen
   prescriptive notification, hon kommer till Selvra) och
   *subjektiv-kompatibel* (observation OK, prescription inte; drift där
   gapet är värdet, inte att Selvra har rätt).

**Använd när:** ord-val-debatter ("ska det stå brief eller reflektion?").

---

## Fras 4 — Reflektionen är produkten

> *"Selvra ger dig rätt reflektion om dig själv när du behöver den."*

**Locked:** 2026-05-10.
**Vad den positionerar:** Selvra är en motor som tar data + kontext + liv
→ producerar reflektions-typ som passar. Samma motor, samma representation,
olika reflektioner per användare-kontext (T1D → läkar-reflektion; founder
→ kvartalsplanering; person i terapi → terapi-reflektion).
**Konsekvens för vertikalerna:** Stillras läkar-reflektion är inte feature
i Stillra — det är första instansen av Selvras reflektions-mekanism.
**Konsekvens för SREF v1:** inte bara portabilitets-spec — specifikation
för strukturerad representation som genererar arbiträra reflektioner.
**Använd när:** retention-frågor (reflektionen är naturligt tidsbunden),
pitch-i-en-mening, vertikal-arkitektur-beslut.

---

## Fras 5 — Gapet mellan tre

> *"Produkten är gapet mellan vad du säger att du vill, vad du säger att
> du gör, och vad datan visar att du faktiskt gör."*

**Locked:** 2026-05-10 (canonical doktrin per `project_selvra_app_focus.md`).
**Vad den positionerar:** Selvra är inte en dashboard, inte en AI-coach,
inte en memory-recall-produkt. Den läser tre källor sida vid sida och
låter friktion mellan dem stå kvar.
**Använd när:** beskrivning av core-värdet i en mening; investerare-pitch;
användar-onboarding där tesen ska landa snabbt.

---

## Fras 6 — Agency in practice, not philosophy

> *"Agency in practice, not philosophy. Öppna /export/ai-context."*

**Locked:** 2026-05-11 (när Export-till-AI Nivå 1 deployades till prod).
**Vad den positionerar:** Selvra som **infrastruktur över AI-kategorin**
snarare än konkurrent inom AI-kategorin. Pitch-modus tidigare var
abstrakt ("förståelse-lagret över AI-fragmentering"); nu är värdet
empiriskt inom 30 sekunder via demonstration.
**Mot kategorin:** Personal AI, Engramme, Mem0 — alla inlåsta i sina
egna minnen.
**Använd när:** investor-pitch, demo-tillfällen, jämförelse mot AI-
memory-konkurrenter.

---

## Fras 7 — Fyra synliga lager

> *"Selvra visar fyra distinkta UI-lager som ingen annan i kategorin har
> som första-klass-yta: Reflektion, Tankar, Bakgrund, Agency."*

**Locked:** 2026-05-11.
**Vad den positionerar:** konstitutionell visuell arkitektur. Process-
transparens-by-default är arkitektoniskt mångårigt att kopiera (kräver
event-sourcing + Dreamer-likt consolidation + multi-provider-router).
**De fyra lagren:**

1. **Reflektion** (`/brev`) — vad systemet observerar om dig
2. **Tankar** (`/thoughts` + `/brev` tankar-sektion) — vad du säger, med
   per-event provenance synligt
3. **Bakgrund** (`/traces`) — Dreamer-output, vad systemet reasonar
   autonomt i bakgrunden
4. **Agency** (`/export` + ownership-banner) — exporterbar SREF, "du äger
   detta" görs synligt

**Konkurrent-position:** Rosebud=journaling, Engramme=memory-recall,
Mem0=infrastructure, Personal AI=minne-paradigm. **Ingen visar background
reasoning som första-klass-yta.**
**Empirisk validering:** Dreamer producerade `weekly_letter_redundancy_
pattern` autonomt 2026-05-11 utan prompt.
**Använd när:** arkitektur-pitch, navigation-design-beslut, jämförelser
mot AI-memory-konkurrenter.

---

## Fras 8 — Riktig representation (konkurrent-position)

> *"Andra säger din ChatGPT-memory kan flyttas. Selvra säger att din
> ChatGPT-memory är fattig representation av dig — den vet vad du sagt
> till ChatGPT, inte vad ditt liv visar. Selvra är riktig representation:
> kropp, tid, uppmärksamhet, emotion, intention. Den följer med dig till
> varje AI-konversation. Den växer med dig."*

**Locked:** 2026-05-12. Memory: `project_selvra_pitch_phrase.md`.
**Mot kategorin:** AI memory portability (Plurality Network, AI Context
Flow, AI Migrator, Anthropic claude.com/import-memory). Alla USA-baserade.
Alla baseras på ChatGPT-memory-export.
**Why distinkt:** Frasen är inte teknisk feature-jämförelse — den är
**arkitektonisk identitet**. Konkurrenter kan inte kopiera utan att riva
om sina datakällor från grunden (ChatGPT-memory → multi-source
livsobservation).
**Använd när:** hero-text, manifest-copy, kategori-beskrivning,
jämförelse-frågor från extern.

---

## Fras 9 — Subtraktivt värde (meta-position)

> *"Selvras värde är subtraktivt, inte additivt. Den smalnar av vad
> användaren kan tro om sig själv genom att låta källor stå sida vid
> sida. Berättelsen ligger i bortskalningen."*

**Locked:** 2026-05-12. Memory: `project_selvra_subtractive_value.md`.

**Distilled i en mening:**

> *"Selvra är spegeln som hjälper dig se vad som kvarstår när du tagit
> bort det du tror om dig själv."*

**Mot:** hela impulsen att addera värde till användaren — råd, prediktioner,
optimeringar, motivation.

**Research-anchor:**
- Natasha Dow Schüll (NYU 2019): *Addiction by Design* + senare arbete
  om quantified self som *omsorgs-praktik*
- Quantified Self-rörelsen (2007-pågående): ursprungligt etos *"self-
  knowledge through numbers"* — inte *"self-improvement through numbers"*

**Beslutsregel:** Före varje produkt-, copy-, eller arkitektur-beslut:
fråga om det adderar eller subtraherar möjliga sanningar om användaren.

| Adderar (FEL) | Subtraherar (RÄTT) |
|---|---|
| "Du kanske borde..." | "Källan X visade Y" |
| Predikterad framtida-känsla | Observerad faktisk-mätning |
| Genomsnitts-jämförelse | Användarens egen markering |
| Pattern-as-identity | Tystnad om identitet |
| Coachande prompt | Spegel-prompt |
| Wellness-rekommendation | Observation utan slutsats |
| Goal-tracker-celebration | Närvaro av frånvaro |

**Använd när:** feature-pushback, copy-iteration, prompt-iteration,
arkitektur-beslut.

---

## Fras 10 — Pre-kategorisk (meta-position)

> *"Selvra är pre-kategorisk. Den passar inte i App Store-taxonomi,
> analytics-kategorier eller investerar-decks. Kategorier byggs av
> användare över tid, inte av grundare i förväg. Detta är medvetet val."*

**Locked:** 2026-05-12. Memory: `project_selvra_pre_categorical.md`.

**Kategori-frestelser att avvisa:**

- Journaling app — användaren skriver inte aktivt; Selvra läser passivt
- AI-tool — fel kategori-nivå; Selvra observerar, är inte assistent
- Quantified self — för smalt; Selvra läser fler domäner
- Reflection-app — för generiskt; Selvra *möjliggör* reflektion
- Wellness-tool — fel värdesystem; wellness antyder förbättring
- Personal AI memory — för nära konkurrent-kategori (per fras 8)

**Research-anchor (forsknings-vokabulär, inte konsument-kategorier):**
- Northeastern GLOSS (2025): "longitudinal sensemaking"
- Cornell MIND (2026): "narrative scaffolding for self-knowledge"
- NYU Schüll (2019): "passive self-observation as care-practice"
- Springer Longitudinal (2022): "big/medium/small story-weaving"

**Reaktion vid frestelse:**

1. Identifiera vilken kategori frestelsen pekar mot
2. Notera *varför* den känns lockande (oftast: snabb intelligibility)
3. Acceptera friktionen som kommer med icke-kategori
4. Formulera Selvra strukturellt: "Selvra läser X, Y, Z och skriver
   tillbaka Q" — inte "Selvra är en [kategori]"

**Använd när:** App Store-beskrivning, press-frågor, investerar-decks,
användar-onboarding-copy.

---

## Distinktion mellan 8, 9, 10

| Fras | Positionerar mot |
|---|---|
| **8:e** (ChatGPT-memory är fattig) | Specifik konkurrent-kategori |
| **9:e** (Subtraktivt, inte additivt) | Hela impulsen att addera värde |
| **10:e** (Pre-kategorisk) | Själva *akten* att kategorisera |

Tillsammans utgör de en strukturell defensiv-trio. Inga konkurrenter har
alla tre samtidigt.

---

## Hur framtida sessions ska använda detta dokument

- Vid copy-iteration: kontrollera mot fras 1-7 för produkt-språk
- Vid konkurrent-jämförelse: använd fras 8 som öppning
- Vid feature-/copy-pushback: använd fras 9 (subtraktiv) som beslutsregel
- Vid kategoriserings-frestelse: använd fras 10 som veto
- Vid revision av ny canonical-fras: lägg till numrerat nästa platshållare
  (fras 11+) och uppdatera detta dokument tillsammans med memory-entry

**Vad detta dokument *inte* är:** synthesis eller nya argument. Bara
konsolidering. Substansen lever i memory-entries och `app_focus.md`-
doktrinen; detta är index.
