# Selvra-app design-audit mot dokument-doktrinen

**Datum:** 2026-05-11
**Doktrin:** Dokument-tradition (editorial publishing), inte app-tradition (SaaS)
**Lockade förebilder:** Kinfolk, Craig Mod, Are.na, The Atlantic
**Anti-förebilder:** Rosebud, Reflectly, Linear, Notion, Welltory

**Status:** Pre-implementation. Detta är diagnos + rivlista. Mood-board
artikuleras separat. Ingen design-implementation aktiverad förrän
fullspec landar.

---

## TL;DR

Nuvarande UI är **kompetent SaaS-default** — Geist Sans, Tailwind
neutral-skala, pill-knappar, rounded-md card-boxar, dark-mode-everywhere,
emerald/red/amber-semantik. Det är inte fult; det är *generic*. Det är
Vercel-stack-default som syns igen i tusen liknande appar.

Det är inte vad doktrinen säger. Doktrinen säger Kinfolk, inte Linear.

**Volymen som behöver rivas:**
- 146 referenser till `text-neutral-*` / `bg-neutral-*` (Tailwind default grayscale, inte våra färger)
- 48 `rounded-*`-utilities (pill-buttons + card-boxar är SaaS-vokabulär)
- 100% av komponenterna har dark-mode-varianter (oklart om dark mode finns i editorial doktrinen)
- 0 serif-fonter (Geist Sans body + headlines — fel typografi-tradition)
- 0 brand-accent-färger (semantic colors finns: emerald/red/amber — men ingen identitet)

**Volymen som redan följer doktrinen:**
- `max-w-prose` (≈65ch ≈ 650-700px) — i nivå med doktrinens "max 650px"
- Generösa padding (`py-16 sm:py-24` på huvudsidor) — generous-whitespace ✓
- "Exempel"-blockcitat på landing med `border-l-2 + pl-6 + italic` — editorial gesture ✓
- "Speglingar" rubrik-label med `text-sm uppercase tracking-wide` — magazine-style ✓
- Brevet renderas som rena `<p>`-stycken utan formatering — prose-first ✓
- Footer är en enda copy-rad — editorial restraint ✓
- Ingen iconografi för känslor någonstans — redan aligned ✓
- Inga grafer, ringar, charts — anti-dashboard ✓

Den editoriala impulsen *finns* — den är begravd under default-Tailwind-frontend.

---

## Cross-cutting (global) violations — rivs först

### CCV-1. Typografi-stacken är fel tradition
**Var:** `src/app/layout.tsx:9-17`, `src/app/globals.css:11-13`
**Vad:** `Geist Sans` (Vercel-developed sans-serif) som body + headlines. `Geist Mono` för "kod-look". Ingen serif.
**Varför fel:** Doktrinen säger serif rubriker (GT Sectra / Tiempos), sans body (Söhne / Inter). Geist är *appstack-default* — den används bokstavligen på Vercel.com, Next.js docs, etc. Editorial-traditionen använder serif för auktoritet, inte sans för readability.
**Rivlista:**
- Ersätt `Geist`-import med two fonts: en serif (GT Sectra om budget tillåter / Tiempos / Source Serif / Cormorant som fallback), en sans (Söhne / Inter / Söhne-fallback IBM Plex Sans)
- Definiera CSS-variabler `--font-serif` och `--font-sans` i `@theme`
- Default body = sans, default heading (h1-h4) = serif
- Behåll Geist Mono ENDAST för provenance/timestamp/event_id-strängar — det är *kod*-tradition där, och det är OK eftersom det signalerar "rådata"
- Ev. introducera small-caps eller italic för section-labels istället för `uppercase tracking-wide` (det är OK men feel free att uppdatera)

### CCV-2. Färgpaletten är Tailwind-default-neutral
**Var:** Hela applikationen, 146+ referenser
**Vad:** `bg-neutral-50` (#FAFAFA) som ljus bg, `text-neutral-900` (#171717) som text. Tailwind:s neutrala kalla grå-skala.
**Varför fel:** Doktrinen säger bg #FAF8F3 (off-white, varm) och text #2A2826 (deep varm grå). Skillnaden är att Tailwind-neutral är kall (#FAFAFA är ren grå), medan doktrinen är varm (#FAF8F3 har en hint av cream/beige).
**Rivlista:**
- Lägg till CSS-vars `--bg-paper` (#FAF8F3) och `--text-ink` (#2A2826) i `@theme`
- Definiera Tailwind custom-colors: `bg-paper`, `text-ink`, `border-rule` (subtil hint av samma cream-grå för avskiljare)
- Sweep replace alla `bg-neutral-50` → `bg-paper`
- Sweep replace alla `text-neutral-900` → `text-ink`
- Sweep replace alla `text-neutral-700 dark:text-neutral-300` → en enda `text-ink-soft` (för subordinate prose)
- Border-färger: ersätt `border-neutral-200/800` med en enda `border-rule` som är subtilt synlig men inte hård

### CCV-3. Brand-accent-färgen saknas helt
**Var:** Hela applikationen
**Vad:** Inga accent-färger för länkar, knappar, höjdpunkter. Allt är gråskala. Den enda färgen som finns är *semantisk* (emerald för success, red för error, amber för warning).
**Varför fel:** Doktrinen säger "accent en enda färg [du väljer]". En brand-accent ger identitet — utan den blir appen anonym. Kinfolk-traditionen använder t.ex. dim ochre, oxblood, tobacco, ink-blue, deep-forest. Inte primary-blue eller fluorescent-anything.
**Rivlista:**
- Definiera **ETT** accent-färg när mood-boarden landar. Förslag-spektrum: dim ochre #BE7C4D / oxblood #6E2F2A / tobacco #7D5A3F / ink-blue #2C3E5B / forest #2E4830 / oat #C4A86A
- Ersätt knappar `bg-neutral-900 text-neutral-50` → `bg-ink text-paper` (huvudknapp), `border-accent text-accent` (sekundär)
- Länkar: ersätt `underline underline-offset-2 hover:text-neutral-900` → `text-accent underline underline-offset-4 decoration-accent/40 hover:decoration-accent`
- Behåll semantiska färger (emerald/red) men dämpa intensiteten — current är Tailwind-default, doktrinen vill desaturated

### CCV-4. Dark mode finns överallt utan tydligt syfte
**Var:** Hela applikationen — varje komponent har `dark:`-varianter
**Vad:** Auto-switching dark mode med `bg-neutral-950 text-neutral-100`.
**Varför potentiellt fel:** Dokument-tradition är inte primärt dark. Editorial publishing är *paper* — off-white background, ink text. Dark-mode finns i tech-tradition (Linear, GitHub, Notion). Kinfolk har inte dark mode.
**Öppen fråga för Carl:** Vill du ha dark mode alls? Tre alternativ:
- A) Drop dark mode helt — Selvra är paper, alltid paper. Mindre kod, starkare identitet.
- B) Behåll men förenkla — en enda dark-variant där bg = warm-deep-charcoal (#1C1A18, inte Tailwind:s kalla #0A0A0A), text = warm-off-white. Inte stark switch utan subtil.
- C) Behåll som idag med Tailwind-default — sämsta alternativet (mest kod, svagast identitet)

**Default-rekommendation:** A. Editorial = paper. Om Carl vill ha dark mode senare, addera då, inte nu.

### CCV-5. Pill-knappar är SaaS-vokabulär
**Var:** Brev, account, landing, onboarding — alla CTA-knappar
**Vad:** `inline-flex h-12 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 px-8`
**Varför fel:** `rounded-full` (pill shape) är Vercel/Linear/Stripe-default. Editorial-tradition använder antingen (a) ingen knapp alls — bara länkar, eller (b) raka rektangulära knappar med tunn border, eller (c) text-knapp med pil-glyph.
**Rivlista:**
- Ersätt `rounded-full` → `rounded-none` (rak) eller subtle `rounded-[2px]`
- Primärknapp: `bg-ink text-paper px-6 h-11 font-serif tracking-tight` (serif på knapp ger editorial-känsla — kontroversiellt men distinkt)
- Sekundärknapp: `border border-rule text-ink px-6 h-11` — ingen fyllning, bara kontur
- Text-link-action ("Öppna arkivet →") kvarstår som de är — de är redan editorial

### CCV-6. Card-box-pattern (rounded-md borders) är SaaS-default
**Var:** `src/app/onboarding/sources/page.tsx`, `src/app/brev/arkiv/page.tsx`, `src/app/export/page.tsx`, `src/app/account/page.tsx`, alla notice-blocks i brev
**Vad:** `rounded-md border border-neutral-200 px-5 py-5` som container för "card", "section", "alert"
**Varför fel:** Cards är SaaS-tradition (Stripe Dashboard, Linear, Notion). Editorial-tradition använder typografi-hierarki + horisontella regler (`<hr>` eller `border-t`) för att separera sektioner, inte boxes.
**Rivlista:**
- Sweep replace `rounded-md border border-neutral-*` → ingenting (separera med `<hr class="border-rule">` eller `border-t border-rule pt-6 mt-6`)
- Notice-blocks (emerald/red/amber) → ersätt med margin-left-bar (`border-l-2 border-accent pl-4 italic`) eller enbart kursiv-text utan box
- Source-listan i `/onboarding/sources` → omdesigna som listing à la magazine TOC, inte cards

### CCV-7. Vertikal rytm är inkonsekvent
**Var:** Hela applikationen, alla `gap-*`-värden
**Vad:** `gap-3` (12px), `gap-4` (16px), `gap-5` (20px), `gap-6` (24px), `gap-8` (32px), `gap-10` (40px) blandas friskt
**Varför fel:** Doktrinen säger "24px baseline vertikal rytm". Det betyder att alla vertikala avstånd ska vara multiplar av 24 (eller halv-multiplar för täta paragrafer): 12 / 24 / 48 / 72.
**Rivlista:**
- Etablera baseline-system: `--baseline: 24px`, `space-y-baseline` (24), `space-y-baseline-2` (48), `space-y-baseline-3` (72)
- Sweep audit av alla `gap-*` och `space-y-*`: byt ut godtyckliga värden mot baseline-multiplar
- Inom samma typografi-hierarki: gap-3 (12) endast för tight inline-grupper (button + flash-text)
- Mellan paragrafer: 24px (en baseline)
- Mellan sektioner: 48px (två baselines)
- Mellan major sections (header → body, footer): 72px (tre)

### CCV-8. Mono-font används för provenance — diskutabel
**Var:** `/brev` tankar-listan, `/brev/arkiv` synthesis_type-label, alla event_id-snippets
**Vad:** `font-mono` på timestamps + event-ids
**Varför möjligen fel:** Mono säger "kod / raw data". Det signalerar tech-look, vilket är emot doktrinen. Editorial signalerar samma sak med small-caps eller tabular-nums + italic.
**Rivlista (svagare än övriga):**
- Behåll `font-mono` ENDAST för event_id-strängar (de är bokstavligen kod) — där är det informativt
- Ersätt `font-mono` på *timestamps* med `tabular-nums` (siffer-rytm) + ev. small-caps via `font-variant-caps: all-small-caps` för label-typ "synthesis_type" → "SYNTHESIS TYPE"

---

## Per-page audit-summary

| Sida | Aligned-grader | Värsta brott |
|---|---|---|
| `/` (landing) | ⭐⭐⭐⭐ | Knapp-pillshape + Geist-font |
| `/brev` | ⭐⭐⭐ | Card-boxar i ownership + thoughts-section, neutral-grays, knapparna |
| `/brev/arkiv` | ⭐⭐ | Listan är cards-medium snarare än TOC-magazine. `font-mono` på "reflection" |
| `/brev/arkiv/[id]` | (ej granskad — sannolikt OK; samma som /brev) | — |
| `/traces` | ⭐⭐ | Dreamer-insights som SaaS-feed snarare än editorial-snippets |
| `/thoughts` | ⭐⭐⭐ | Form-inputs är SaaS-default rounded-md |
| `/onboarding/intentions` | ⭐⭐ | Radio-knappar inline, generic form-inputs, gap-rytm-inkonsekvent |
| `/onboarding/sources` | ⭐ | Tyngst med cards + emerald/red flash-boxar |
| `/onboarding/signal` | ⭐⭐⭐ | OK form, men knapp-stil |
| `/onboarding/done` | ⭐⭐⭐⭐ | Nästan editorial; bara knappar |
| `/login` | ⭐⭐ | Magic-link-form är inputbox + pillbutton |
| `/login/check-email` | ⭐⭐⭐⭐ | Ren prose, nästan rätt redan |
| `/export` | ⭐⭐ | Card-boxar för "SREF v1 — full export" |
| `/export/ai-context` | (ej granskad) | — |
| `/account` | ⭐⭐ | Notice-blocks, röd-pillknapp för delete |
| `/privacy` | ⭐⭐⭐⭐ | Ren prose med h2-sektioner, nästan rätt — bara typografin behöver bytas |
| `/not-found`, `/error` | ⭐⭐⭐ | Enkla, OK, bara knapparna |

**Hierarki för rivning, prioriterad:**
1. `/onboarding/sources` (mest SaaS) — kommer påverka alla nya users
2. `/brev` (kärnsidan — där varumärket möter användaren)
3. `/account` (privacy + delete sker här)
4. `/traces` (process-transparens-sidan — ska feel editorial, inte log-viewer)
5. Övriga sidor — mer mekanisk sweep

---

## Komponenter

### `site-header.tsx`
**Status:** Nästan rätt. Wordmark + 5 nav-länkar + login.
**Brott:**
- `text-base font-medium tracking-tight` på wordmark — det är fine, men editorial-tradition skulle ha wordmark i serif med högre visuell vikt (det är *masthead*)
- Login-länken som right-side action — feels app-tradition. Magazine-tradition har ingen "login"-knapp i nav; login finns på en sub-sida bara
**Rivlista:**
- Wordmark i serif, större (text-xl eller text-2xl), letter-spacing-normal
- Ev. centrera wordmark om vi vill ha symmetric mastheads à la NYT/Atlantic
- Login flyttas till footer (alla magazines har "log in" i footer)

### `site-footer.tsx`
**Status:** Bra. En rad copy + nav-länkar. Editorial.
**Brott:** Ingen
**Rivlista:** Behåll. Eventuellt: byt typsnitt till serif-mini (samma serif men x-höjd liten), eller small-caps på länkar

### `nav-link.tsx`
**Status:** SaaS-style med rounded-md + bg-on-hover
**Brott:** `rounded-md`, `hover:bg-neutral-100`
**Rivlista:**
- Drop rounded-bg-on-hover
- Active-state: `text-ink font-medium` (samma som idag) + underline med decoration-accent
- Inactive: `text-ink-soft hover:text-ink`
- Inget bg, ingen border, ingen radius

### `trigger-button.tsx`, `delete-submit.tsx`, `copy-button.tsx`
**Status:** Pill-buttons (rounded-full) — alla brott samma som CCV-5
**Rivlista:** Konsolidera till ett par `<EditorialButton variant="primary | secondary | danger" />` med raka kanter

---

## Rivlista — sammanställd teardown spec

När mood-boarden är låst och du säger "kör": dessa filer ändras. Estimat per fas.

**Fas 1 — Foundation (1-2h):**
- `layout.tsx` — byt font-importer (serif + sans)
- `globals.css` — definiera color-tokens, baseline-system, base-typografi för h1-h6 och prose
- `tailwind.config.*` (skapa om saknas) — registrera bg-paper, text-ink, border-rule, accent-*, font-serif, font-sans

**Fas 2 — Komponent-sweep (2-3h):**
- `site-header.tsx`, `site-footer.tsx`, `nav-link.tsx` → editorial-redesign
- `trigger-button.tsx`, `delete-submit.tsx`, `copy-button.tsx` → konsolidera till `<EditorialButton>`
- Skapa `<EditorialDivider />`, `<EditorialNotice variant="ok | warn | error" />` (margin-left-bar istället för box)

**Fas 3 — Sida-för-sida (4-6h):**
- `/brev` (kärnsidan, mest synlig — ta längst)
- `/onboarding/sources` (mest brott — tyngst rivlast)
- `/onboarding/intentions`, `/onboarding/signal`, `/onboarding/done`
- `/account`, `/privacy`, `/login`, `/login/check-email`
- `/traces`, `/thoughts`
- `/export`, `/export/ai-context`
- `/brev/arkiv`, `/brev/arkiv/[id]`
- `/`, `/not-found`, `/error`

**Fas 4 — Detalj-pass (1-2h):**
- Sweep `gap-*` → baseline-multiplar
- Sweep `text-neutral-*` → `text-ink` / `text-ink-soft`
- Sweep `bg-neutral-*` → `bg-paper` / `bg-paper-darker` (om finns)
- Verifiera att inget dark:-pattern är kvar (om alternativ A i CCV-4 valdes)
- Dark-mode-keep om alternativ B: separat sweep att uppdatera dark-tokens
- A11y-pass: focus-ring-färg behöver vara accent (synlig mot paper)

**Total estimat: 8-13 timmar fokuserat arbete.**

---

## Keep-list — vad som redan följer doktrinen

Behåll dessa gestures när du sweepingar:
- `max-w-prose` overall layout-bredd ✓
- Generösa `py-16 sm:py-24`-paddings ✓
- "Exempel"-blockcitat på landing — `border-l-2 + pl-6 + italic` ✓
- Section-labels med `text-sm uppercase tracking-wide` (acceptable; mood-board kan ev. styra om till small-caps) ✓
- Brevet som ren `<p>`-prosa utan grafik ✓
- Footer som en-rads-copy ✓
- Källattribuering som sista paragraph i kursiv-stil ✓
- ISO-veckonummer + datum i header för brev ✓
- "Förstå vad SREF är"-länk-pattern (kontextuell, inte popover) ✓
- Tankar-under-brev som *separat tråd*, inte annotations i brevet ✓
- Inga ikoner för känslor/states ✓
- Inga charts, grafer, ringar ✓
- Inga emojier i copy ✓

---

## Öppna mood-board-frågor

Att svara på när du samlar referenserna:

1. **Vilken serif?** Budget-fråga. GT Sectra är premium (~$300/license). Tiempos liknande. Source Serif Pro är gratis och bra. PT Serif gratis men mindre distinkt. Recoleta är gratis-via-fontshare och har viss publishing-känsla. **Rekommendation att utvärdera mot mood-board:** Source Serif Pro (4 vikter) eller Recoleta. Båda är gratis och har editorial-feel.

2. **Vilken sans?** Söhne är premium (~$300+). Inter är gratis-default. **Rekommendation:** Inter v4 — den används av Linear/Stripe/etc ALSO, men i kombo med en stark serif primärfont blir totalintrycket editorial, inte SaaS. Söhne kan komma senare när cashflow tillåter.

3. **Vilken accent-färg?** Det här är *den* identitets-frågan. Mood-boarden ska tala om för dig vad som känns rätt. Mitt råd: titta på 20 Kinfolk-spreads, 20 Craig Mod-essäer, 20 Are.na-channels och se vilka *accentfärger* som återkommer i material du gillar. Det är inte ett tekniskt beslut, det är ett smak-beslut.

4. **Dark mode: ja/nej?** Bestäm tidigt — påverkar hela komponent-arkitekturen.

5. **Subtle texture/noise på bakgrunden?** Kinfolk har ibland en subtil paper-texture. Det är kontroversiellt på web. Det kan vara ditt distinkt-signature, eller kan det vara overdone. Mood-boarden får svara.

6. **Bilder/illustration alls?** Idag har Selvra-appen 0 bilder. Editorial-tradition har ofta ett enskilt *foto* per spread eller en *illustration*. Är detta något du vill introducera, eller är prose-only-positionen distinkt nog?

7. **Knappformer:** Raka rektanglar med tunn border? Text-länkar med pil-glyph? Inga knappar alls (allt är länkar med understruken)? Det här är detaljen där SaaS och editorial skiljs mest.

---

## Vad detta dokument inte är

- **Inte mood-board.** Mood-board är dina referenser (Kinfolk-spreads, Craig Mod-essäer, Are.na-channels). Jag kan inte göra det jobbet — det är ditt smak-jobb.
- **Inte implementation-plan.** Implementation-plan kommer när mood-boarden är låst.
- **Inte design-system-spec.** Tokens, komponenter, konventioner specificeras när du säger "kör implementera".

Detta är *diagnos + rivlista*. Det är vad du kan referera till när du går igenom Kinfolk-spreads och tänker "OK, det här gör jag inte".

---

## Nästa steg (din ordning)

1. ✅ Audit klar (detta dokument)
2. ⏭ Du samlar mood-board (1-2 dagar)
3. ⏭ Du svarar på de öppna frågorna ovan (eller delar av dem)
4. ⏭ Säg "kör design-implementation" → jag exekverar rivlistan + bygger nytt enligt mood-boardens lock

Inget från (3-4) händer förrän du säger det.
