# Selvra.ai Landing — Design Specification v1.0

**Status:** Formell design-spec för selvra.ai landing-sidan. Ersätter ad-hoc iterationer v1-v7 från tidigare sessioner. Lock:as som canonical referens-dokument.

**Kontext:** Sex iterationer har gjorts från SaaS-default till editorial-tradition. Det här spec:et **destillerar** vad som ska byggas. Carl ska kunna lämna detta till Claude Code och få exakt rätt resultat.

**Beslutsregel som styr allt:** Selvras 9:e canonical-fras — *"Selvras värde är subtraktivt, inte additivt."* Varje designval testas mot frågan: *adderar detta eller subtraherar det?*

---

## Avsnitt 1: Designfilosofi (icke-förhandlingsbar)

### 1.1 Tradition

Selvra.ai står i **editorial-tradition**, inte SaaS-tradition.

**Referenspunkter (i prioritetsordning):**
1. **craigmod.com** — typografisk disciplin, generös vit yta, prosa-första
2. **Kinfolk Magazine (web)** — varma neutraler, lugn rytm, ingen marketing-aggression
3. **Stripe Press** — premium-känsla utan tech-startup-stil
4. **NYT långartikel-format** — typografisk hierarki som tjänar text, inte konkurrerar med den
5. **Pentagram Design** — typografiskt självförtroende, restriktion som styrka

**Anti-referenser (vad det INTE ska likna):**
- Shifted (dark mode, neon-accent, card-feed)
- Linear/Vercel/Cursor (tech-SaaS-estetik)
- Notion (vänlig modernitet)
- Substack-default (newsletter-template-känsla)
- Framer-templates (för polerad, för "designad")

### 1.2 Tre-princips-test för varje designval

Innan något implementeras, kör tre tester:

**Test 1 — Adderar eller subtraherar?**
Adderar elementet **möjliga tolkningar** av användaren eller **smalnar av** dem? Subtraktivt är default-svar.

**Test 2 — Editorial eller SaaS?**
Skulle detta element passa i Kinfolk Magazine? Eller i en SaaS-pitch-deck? Editorial är default-svar.

**Test 3 — Tjänar text eller konkurrerar med text?**
Tjänar elementet läsning av prosan, eller drar uppmärksamhet från den? Tjäna är default-svar.

---

## Avsnitt 2: Färgsystem

### 2.1 Palett (komplett, inga andra färger får läggas till)

```
PRIMÄRA FÄRGER
- Bakgrund:        #FAF8F5  (varm off-white, papper-känsla)
- Text primär:     #1A1814  (djup varm svart, ej ren svart)
- Text sekundär:   #6B6660  (varm grå, för meta och käll-attribuering)
- Text tertiär:    #A39E96  (ljusvarm grå, för datum, footer-info)

ACCENT
- Oxblod:          #722F37  (en accent, används sparsamt)

FUNKTIONELLA
- Hairline:        #E8E2D9  (för subtila avdelare)
- Hover-bg:        #F2EEE8  (vid hover på interaktiva element)
```

### 2.2 Användningsregler

- **#FAF8F5** är default-bakgrund över hela sidan. Aldrig vit. Aldrig mörk. Aldrig gradient.
- **#1A1814** för all brödtext och rubriker. Aldrig ren #000.
- **#6B6660** för käll-attribuering, datum, meta-information.
- **#722F37** används **endast** för: aktiva länkar (på hover), CTA-text, och 1-2 typografiska accenter per sida.
- **Inga andra färger.** Inga blå "links". Inga gröna "success". Inga röda "error". All UI-feedback görs typografiskt eller via opacity-shift.

### 2.3 Mörkt läge

**Existerar inte** i v1. Selvra är off-white. Om systemet kräver dark mode senare, behandlas det som **separat designövning**, inte automatisk inversion.

---

## Avsnitt 3: Typografi

### 3.1 Typsnitt

**Brödtext + prosa: Source Serif 4** (variabel, Google Fonts)
- Forskningsstöd: TypeSmith 2026 — *"transitional serif structure, generous x-height, optical size axis that adjusts automatically between text and display sizes"*
- Optimal för långform och editorial
- Open source, ingen licens-kostnad

**Rubriker stora (hero, sektionsrubriker): Source Serif 4 Display**
- Samma familj, optisk storlek för display
- Behåller koherens — inte två typsnitt

**Meta + UI (datum, käll-attribuering, navigation): Inter** (variabel, Google Fonts)
- Endast för icke-prosa-element
- Aldrig för brödtext eller rubriker
- Max 5% av sidans typografi

**Aldrig använd:**
- System-fonts som default
- Display-serifer (Playfair, Cormorant) — för dekorativa
- Slab-serifs — fel ton
- Tech-sans (Geist, Söhne, Inter Display) — fel kategori
- Variabla "experimentella" typsnitt — fel tradition

### 3.2 Storlekssystem (mobile-first, skala upp för desktop)

```
MOBIL (default)
- Hero rubrik:      48px / line-height 1.05 / weight 400
- H2 sektioner:     32px / line-height 1.15 / weight 400
- H3 underrubriker: 22px / line-height 1.3 / weight 500
- Brödtext:         19px / line-height 1.55 / weight 400
- Meta/källor:      15px / line-height 1.4 / weight 400 (Inter)
- Footer:           14px / line-height 1.4 / weight 400 (Inter)

DESKTOP (≥1024px)
- Hero rubrik:      72px / line-height 1.05 / weight 400
- H2 sektioner:     44px / line-height 1.15 / weight 400
- H3 underrubriker: 26px / line-height 1.3 / weight 500
- Brödtext:         20px / line-height 1.6 / weight 400
- Meta/källor:      15px / line-height 1.4 / weight 400 (Inter)
- Footer:           14px / line-height 1.4 / weight 400 (Inter)
```

### 3.3 Mätstock (line length)

**Forskningsstöd (TypeSmith 2026):** *"Long-form editorial content performs best at 18-20px on screens with a line height of 1.5-1.6 and a measure (line length) of 45-75 characters."*

**Implementation:**
- Brödtext max-width: **640px** (≈ 65 tecken/rad i Source Serif 4 vid 20px)
- Hero-rubrik max-width: **800px**
- Aldrig text som sträcker sig över hela skärmen

### 3.4 Brytningar och flöde

- **Inga avstavningar** (hyphens: manual)
- **Inga rakhögra kanter** med ojämn höger-marginal (text-align: left, ragged right)
- **Inga indrag** vid styckesbörjan (paddings handlas via margin-top)
- **En tom rad mellan stycken** (margin-bottom: 1.5em)
- **Italic används sparsamt** — endast för titlar (Kinfolk, NYT) eller emfaserade ord (max 1-2 per stycke)
- **Inga utropstecken** någonstans på sidan

---

## Avsnitt 4: Layout

### 4.1 Grundstruktur

```
┌─────────────────────────────────────────┐
│  [Navigation — minimal, höger-justerad] │
│                                          │
│                                          │
│  [HERO — vänster-justerad]              │
│  Selvra                                  │
│  Ett brev till dig själv...              │
│  [payoff-rad]                            │
│                                          │
│  [Skriv din första intention]            │
│                                          │
│                                          │
│  [Sektion: Vad det här är]              │
│  Andra säger / Selvra säger              │
│                                          │
│                                          │
│  [Sektion: Så här kan ett brev läsa]    │
│  Vecka 19 · söndag morgon                │
│  [Brev-exempel]                          │
│                                          │
│                                          │
│  [Sektion: Vad du redan har]            │
│  [Källor grupperade per kategori]        │
│                                          │
│                                          │
│  [Sektion: Det är ditt]                 │
│  [Agency-doktrin]                        │
│                                          │
│                                          │
│  [Sektion: Selvra är protokoll-lager]   │
│  [Vertikalerna]                          │
│                                          │
│                                          │
│  [Sektion: Hur Selvra är byggd]         │
│  [EU + lock-positioner]                  │
│                                          │
│                                          │
│  [CTA — Skriv din första intention]      │
│                                          │
│                                          │
│  [Footer — minimal]                      │
└─────────────────────────────────────────┘
```

### 4.2 Vit yta (generös, icke-förhandlingsbar)

**Forskningsstöd (Digital Silk 2026):** *"White space defines structure and hierarchy, helping users process information faster and with less effort."*

**Implementation:**
- **Mellan sektioner:** minst 160px på mobil, 200px på desktop
- **Inom sektioner:** minst 64px mellan rubrik och innehåll
- **Sida-marginaler mobil:** 24px
- **Sida-marginaler desktop:** all text centrerad i max-width 800px (inom 1200px container)
- **Linje-spacing inom prosa:** generös (1.55-1.6)

### 4.3 Hierarki

Endast tre typografiska hierarki-nivåer:
1. **Hero** — sidans titel, en gång
2. **H2** — sektionsrubriker
3. **H3** — underrubriker inom sektioner (sparsamt, max 2-3 per sida)

Inga H4, H5, H6. Om en sektion behöver fler nivåer, skriv om sektionen.

### 4.4 Asymmetri

**Inga centerade textblock** för brödtext. All prosa är vänster-justerad.

**Centerat tillåts endast för:**
- Avslutande mening i en sektion (1-3 ord, typografiskt-kraftfullt)
- Footer-information
- Ensamstående CTA-knapp

---

## Avsnitt 5: Komponenter

### 5.1 Hero

```
┌──────────────────────────────────────┐
│                                       │
│  Selvra                               │
│                                       │
│  Ett brev till dig själv, varje      │
│  vecka, från någon som har           │
│  observerat den.                      │
│                                       │
│  Selvra läser det du redan lämnar    │
│  efter dig: din kalender, din kropp,│
│  din sömn, din musik, dina ord.      │
│                                       │
│  Efter en vecka ser du skillnaden    │
│  mellan vad du säger att du vill     │
│  och vad veckan visade.              │
│                                       │
│  [Skriv din första intention →]      │
│                                       │
└──────────────────────────────────────┘
```

**Specifika regler:**
- "Selvra" som **wordmark**, inte logotype-bild
- Underrubrik i lugn ton, inte säljande
- Payoff-rad **direkt efter** beskrivning, inte uppslukad i texten
- En enda CTA, ingen sekundär knapp
- Hero-höjd: cirka 80vh på desktop, inte 100vh (visa att det finns mer)

### 5.2 "Andra säger / Selvra säger"-sektion

Två-spalts-layout som **kontrasterar** position:

```
┌──────────────────────────────────────┐
│                                       │
│  Andra säger                          │
│  att din ChatGPT-memory kan flyttas. │
│                                       │
│  Selvra säger                         │
│  att din ChatGPT-memory är fattig    │
│  representation av dig.              │
│                                       │
│  Den vet vad du sagt till ChatGPT.   │
│  Inte vad ditt liv visar.            │
│                                       │
└──────────────────────────────────────┘
```

**Specifika regler:**
- "Andra säger" i sekundär färg (#6B6660)
- "Selvra säger" i primär färg (#1A1814)
- Aldrig nämna konkurrent-namn (ej Luna, AI Migrator, etc.)
- Två-spalt på desktop, staplat på mobil

### 5.3 Brev-exempel

**Detta är sidans hjärta.** Det är inte illustration. Det är **bevis**.

```
┌──────────────────────────────────────┐
│                                       │
│  Så här kan ett brev läsa             │
│                                       │
│  ─────────────                        │
│                                       │
│  Vecka 19 · söndag morgon             │
│                                       │
│  Du skrev på lördagen att du vill    │
│  att allt du gör ska ha ett syfte.   │
│                                       │
│  [Hela brevet — prosa, käll-         │
│   attribuerat, lock-position-        │
│   konformt]                           │
│                                       │
│  Källor: Dexcom · Garmin · Spotify   │
│  · Calendar · dina tankar · dina     │
│  intentioner                          │
│                                       │
│  ─────────────                        │
│                                       │
│  Inga råd. Inga slutsatser. Bara     │
│  det som var där, sett från flera    │
│  håll samtidigt.                      │
│                                       │
└──────────────────────────────────────┘
```

**Specifika regler:**
- Brevet renderas **exakt som det skulle se ut i Selvra-appen**
- Käll-attribuerad rad i sekundär färg (#6B6660), mindre storlek
- Tunna hairlines (#E8E2D9) som avgränsning ovan och under
- Aldrig "Detta är ett exempel"-disclaimer — brevet talar för sig självt
- I framtid: byt ut mot **riktigt arkiverat brev** med subject-redaktion när lämpligt

### 5.4 Källor-sektion

**Critical insight från ChatGPT/Perplexity-feedback:** Många "snart"-källor utan tydlig grupering känns ihåligt. Lösning: **gruppera efter tidsstatus**.

```
┌──────────────────────────────────────┐
│                                       │
│  Vad du redan har                     │
│                                       │
│  Selvra läser bara det du explicit   │
│  kopplar. De flesta människor har    │
│  redan källor som beskriver dem.     │
│                                       │
│  ─────────────                        │
│                                       │
│  Live nu                              │
│                                       │
│  Intentioner — vad du säger att du   │
│  vill                                 │
│  Tankar — vad du formulerar i Selvra │
│  Dexcom — glukos och kroppens rytm   │
│                                       │
│  ─────────────                        │
│                                       │
│  Kopplas dag 1                        │
│                                       │
│  Kropp:    Garmin · Apple Health     │
│  Tid:      Google Calendar           │
│  Uppmärksamhet: Gmail                 │
│  Emotion:  Spotify · Readwise        │
│  Aktivitet: Strava                    │
│                                       │
│  ─────────────                        │
│                                       │
│  Senare                               │
│                                       │
│  Oura · Whoop · Polar · Withings ·   │
│  Apple Music · Outlook · Apple       │
│  Calendar · Notion · Kindle · AI-    │
│  konversation-export                  │
│                                       │
│  ─────────────                        │
│                                       │
│  En domän räcker. Selvra blir        │
│  rikare med flera. Den kräver        │
│  aldrig att du börjar göra något     │
│  nytt — bara att du låter den läsa   │
│  det du redan gör.                    │
│                                       │
└──────────────────────────────────────┘
```

**Specifika regler:**
- **Tre tidsgrupper** istället för 22 individuella "snart"-rader
- Källnamn i primär färg, beskrivning i sekundär (när finns)
- **Inga logos.** Endast text. (Logos drar mot SaaS-tradition)
- **Inga ikoner.** (Bryter mot designdoktrin)
- Domän-rubriker (Kropp, Tid, etc.) inom "Kopplas dag 1" som subtila etiketter
- Hairlines mellan grupper

### 5.5 Vertikalerna

```
┌──────────────────────────────────────┐
│                                       │
│  Selvra är protokoll-lager            │
│                                       │
│  Selvra-appen du läser om nu är en   │
│  av flera vertikaler ovanpå samma    │
│  protokoll.                           │
│                                       │
│  ─────────────                        │
│                                       │
│  Stillra — för T1-diabetiker.        │
│  Det vi lär oss om kropp och         │
│  tystnad i kronisk sjukdom.          │
│                                       │
│  Motiq — för kreativa människor.     │
│  Det vi lär oss om motiv och         │
│  tystnad i skapande.                  │
│                                       │
│  Forsyne — för uthållighets-         │
│  atleter. Det vi lär oss om          │
│  träning och rörelse mot mål.        │
│                                       │
│  Elefant — spegling av digital       │
│  närvaro. Det vi lär oss om gapet    │
│  mellan intention och faktisk        │
│  handling.                            │
│                                       │
│  ─────────────                        │
│                                       │
│  Selvras värde sitter inte i en av   │
│  dem. Det sitter i att de delar      │
│  samma protokoll. Det du skrev i en  │
│  följer med till nästa.              │
│                                       │
└──────────────────────────────────────┘
```

**Specifika regler:**
- Vertikal-namnet i primär färg, kort förklaring i prosa
- Inga separata kort eller boxar — flytande prosa
- Subtila hairlines som avdelare
- Avslutande mening centrerad

### 5.6 CTA-knapp

**Endast en knapp-stil på hela sidan:**

```
Skriv din första intention →
```

**Specifika regler:**
- Text-länk-stil, ingen "knapp"-yta
- Underline på hover, inte i default-state
- Pil (→) som indikerar handling
- Färg: primär (#1A1814) i default, oxblod (#722F37) på hover
- Padding kring för klickbarhet, men ingen visuell border

**Inga andra knappar.** Aldrig "Learn more". Aldrig "Get started". Aldrig sekundär CTA.

### 5.7 Footer

Minimal. Aldrig massiv "Selvra"-typografi i footer (matchar inte editorial-tradition).

```
┌──────────────────────────────────────┐
│  Selvra                               │
│                                       │
│  Pre-launch. Pris vid publik         │
│  release: 99–149 kr/månad. Tills     │
│  dess gratis.                         │
│                                       │
│  Hur datan hanteras  ·  Kontakt      │
│                                       │
│  ©2026                                │
└──────────────────────────────────────┘
```

**Specifika regler:**
- Wordmark, inte 800px Shifted-stil-logotyp
- Pre-launch-info som textrad
- Två länkar: Privacy + kontakt
- Sekundär färg (#6B6660), liten storlek

---

## Avsnitt 6: Interaktion

### 6.1 Hover-states

- Länkar: underline framträder, färg shiftar till #722F37 (oxblod)
- Inga box-shadows
- Inga scale-transforms
- Inga "lift"-effekter
- Transition: 200ms ease

### 6.2 Scroll

- **Inga parallax-effekter**
- **Inga scroll-triggered animations**
- **Inga "appear on scroll"-fades**
- Vanlig scroll. Innehållet är där eller där inte.

### 6.3 Animation

**Default: inga animationer.**

Undantag (om absolut nödvändigt):
- Fade-in på initial page load (300ms, opacity 0→1, hela sidan samtidigt)
- CTA-pil (→) shift på hover (4px höger)

Aldrig:
- Floating elements
- Bouncing CTAs
- Pulse-animationer
- Particle effects
- 3D-tilts
- Lottie-animations

### 6.4 Bilder och illustrationer

**Inga illustrationer.** Inga AI-genererade bilder. Inga foton (i v1).

Designdoktrin: **typografi som primärt visuellt element**.

Om framtida version kräver bild: ett **enskilt foto** (svartvitt, dokumentärt, inte stiliserat) per sektion max. Aldrig "produkt-illustrationer" eller "explainer-grafik".

---

## Avsnitt 7: Responsivt beteende

### 7.1 Mobil-first

Spec:et är skrivet med mobil som default. Desktop är **utökning**, inte separat design.

### 7.2 Brytpunkter

```
Mobil:      < 768px
Tablet:     768-1023px
Desktop:    ≥ 1024px
```

### 7.3 Typografi-skalning

Inom tablet-spann, interpolera mellan mobil och desktop-storlekar med `clamp()`:

```css
font-size: clamp(48px, 5vw + 1rem, 72px);  /* hero */
font-size: clamp(19px, 1.2vw + 0.5rem, 20px);  /* brödtext */
```

### 7.4 Layout-skift

- Hero behåller vänster-justering på alla storlekar
- Brev-exempel centreras i max-width 640px på desktop
- Källor-sektion staplas vertikalt på mobil, grupperade horisontellt på desktop
- Vertikalerna staplas alltid (en per rad)

---

## Avsnitt 8: Performance

### 8.1 Mål

- **First Contentful Paint:** < 1.0s
- **Largest Contentful Paint:** < 1.8s
- **Total Blocking Time:** < 100ms
- **Cumulative Layout Shift:** < 0.1
- **Total page weight:** < 200KB (inkl. typsnitt)

### 8.2 Typsnitt-laddning

- Source Serif 4: preload via `<link rel="preload">`
- Inter: lazy-load (används bara i meta/footer)
- `font-display: swap` för alla
- Endast variabla typsnitt — inga separata weight-filer

### 8.3 JavaScript

**Mål: noll JS för MVP-versionen av landing.**

Allt ska fungera utan JavaScript. Endast HTML + CSS. JS läggs till bara för waitlist-formulär (om implementerat) och CTA-routing.

---

## Avsnitt 9: Tillgänglighet

### 9.1 Krav

- WCAG 2.1 AA-nivå minst
- Kontrastratio: #1A1814 på #FAF8F5 = 15.8:1 (AAA)
- Kontrastratio: #6B6660 på #FAF8F5 = 5.4:1 (AA)
- Kontrastratio: #722F37 på #FAF8F5 = 8.2:1 (AAA)
- Semantisk HTML (h1, h2, h3, article, section)
- Alt-text på alla bilder (inga bilder i v1, så irrelevant)
- Fokus-states synliga via underline + opacity-shift
- Tab-ordning logisk (top till botten)

### 9.2 Reduced motion

`prefers-reduced-motion: reduce` respekteras — initial page-fade tas bort.

---

## Avsnitt 10: Innehåll (exakt copy att använda)

Detta är **canonical text för v1-launch**. Inga ändringar utan att uppdatera detta spec.

### 10.1 Hero

```
Selvra

Ett brev till dig själv, varje vecka, från någon som har observerat den.

Selvra läser det du redan lämnar efter dig: din kalender, din kropp, din sömn, din musik, dina ord.

Efter en vecka ser du skillnaden mellan vad du säger att du vill och vad veckan visade.

[Skriv din första intention →]
```

### 10.2 "Andra säger / Selvra säger"

```
Andra säger
att din ChatGPT-memory kan flyttas.

Selvra säger
att din ChatGPT-memory är fattig representation av dig.

Den vet vad du sagt till ChatGPT. Inte vad ditt liv visar.

Selvra läser kropp, tid, uppmärksamhet, emotion, intention. Den följer med dig till varje AI-konversation. Den växer med dig.
```

### 10.3 Brev-exempel

```
Så här kan ett brev läsa

Vecka 19 · söndag morgon

Du skrev på lördagen att du vill att allt du gör ska ha ett syfte. På söndag-kvällen var schemat på Calendar tomt efter 18:00 och spellistan "kvälls-flow" fick samma fyra timmar igen.

Kropp som arbetade hårt mitt i veckan. Från måndag till onsdag sjönk tiden över 10 mmol/L från 82% till 58%, för att sedan stiga till 95% på fredag-lördag. Garmin loggade ett pass — tisdag morgon, 47 minuter, måttlig puls. Din intention från mars säger fyra pass i veckan.

På torsdag-kvällen skrev du att veckan varit avvikande. Du angav inget skäl. Sömn-snitt: 6h 12min — under din egen markering på 7h. Två nätter under 6.

Källor: Dexcom · Garmin · Spotify · Calendar · dina tankar · dina intentioner

Inga råd. Inga slutsatser. Bara det som var där, sett från flera håll samtidigt. Det som var högt och det som var tyst, sida vid sida.
```

### 10.4 Källor

```
Vad du redan har

Selvra läser bara det du explicit kopplar. De flesta människor har redan källor som beskriver dem.

Live nu
- Intentioner — vad du säger att du vill
- Tankar — vad du formulerar i Selvra
- Dexcom — glukos och kroppens rytm

Kopplas dag 1
Kropp:        Garmin · Apple Health
Tid:          Google Calendar
Uppmärksamhet: Gmail
Emotion:      Spotify · Readwise
Aktivitet:    Strava

Senare
Oura · Whoop · Polar · Withings · Apple Music · Outlook · Apple Calendar · Notion · Kindle · ChatGPT-export · Claude-export

En domän räcker. Selvra blir rikare med flera. Den kräver aldrig att du börjar göra något nytt — bara att du låter den läsa det du redan gör.
```

### 10.5 Det är ditt

```
Det är ditt

Det Selvra skriver om dig är ditt. Inte upplåst. Inte hyrt. Inte beroende av att vi finns kvar om fem år.

Hela representationen — intentioner, tankar, brev, källor, observerade mönster — kan exporteras som ett enskilt dokument. Du kan ge det till en annan AI så att den AI:n läser dig som Selvra läser dig. Du kan radera det. Du kan gå.

Det här är inte feature-lista. Det är arkitektur. Selvra är byggt runt principen att representation av dig själv inte ska vara något du måste be om tillgång till.
```

### 10.6 Vertikalerna

```
Selvra är protokoll-lager

Selvra-appen du läser om nu är en av flera vertikaler ovanpå samma protokoll. Var och en prövar idén i en specifik domän.

Stillra — för T1-diabetiker. Det vi lär oss om kropp och tystnad i kronisk sjukdom.

Motiq — för kreativa människor. Det vi lär oss om motiv och tystnad i skapande.

Forsyne — för uthållighets-atleter. Det vi lär oss om träning och rörelse mot mål.

Elefant — spegling av digital närvaro. Det vi lär oss om gapet mellan intention och faktisk handling.

Selvras värde sitter inte i en av dem. Det sitter i att de delar samma protokoll. Det du skrev i en följer med till nästa.
```

### 10.7 Hur Selvra är byggd

```
Hur Selvra är byggd

Selvra körs på europeisk infrastruktur. Inte för att regleringen kräver det — utan för att representation av människor inte ska routas genom amerikansk molnlagring. Det är beslutsregeln som styrde allt annat.

Av samma skäl är brevet bundet till regler det aldrig får bryta. Det får aldrig coacha. Aldrig predicera. Aldrig motivera. Aldrig döma. Det får bara observera, namnge källan, och låta dig dra slutsatserna själv.

Det är gränsen som gör spegeln användbar. Utan den blir Selvra ännu en röst som tycker något om dig. Med den blir den en yta där du kan se dig själv klarare.
```

### 10.8 Börja

```
Börja

Det första du gör i Selvra är att skriva. En intention — vad du vill att veckan ska handla om. En tanke — vad som rör sig nu, oavsett om det är klart eller inte.

Det är inte förarbete inför brevet. Det är värdet i sig. Att artikulera vad man vill, och att skriva ner det som rör sig, är handlingar som klarnar tänkandet — innan Selvra hunnit göra något.

Brevet kommer enligt rytmen du väljer. Tills dess har du en yta att skriva i som inte är journaling-app och inte är todo-lista. Det är substrat för spegeln.

[Skriv din första intention →]
```

### 10.9 Footer

```
Selvra

Pre-launch. Pris vid publik release: 99–149 kr/månad. Tills dess gratis.

Hur datan hanteras  ·  Kontakt

©2026
```

---

## Avsnitt 11: Vad detta spec inte är

- **Inte estetisk preferens.** Det är dokumenterat beslut förankrat i Selvras konstitutionella position och 2026-forskning.
- **Inte slutgiltigt.** Itereras mot Carls läsning och eventuell extern validering, men varje ändring kräver explicit beslut.
- **Inte komplett designsystem.** Detta är landing-spec. Selvra-appen själv har separat designsystem.
- **Inte fritt för Claude Code att tolka kreativt.** Color hex, font sizes, spacing values är **specifika**. Avvikelse kräver beslut.

---

## Avsnitt 12: Implementation-instruktioner för Claude Code

### 12.1 Stack

- **Next.js 15** (app router)
- **CSS:** Tailwind CSS endast för utility classes, ingen komponent-library
- **Typografi:** Google Fonts via `next/font` för Source Serif 4 och Inter
- **Hosting:** Existerande Railway-setup (samma som selvra-app)
- **URL:** selvra.ai (root)

### 12.2 Filstruktur

```
selvra-app/
└── apps/
    └── web/
        └── app/
            └── (landing)/
                ├── page.tsx           # huvudsidan
                ├── layout.tsx          # font-loading, meta
                └── components/
                    ├── Hero.tsx
                    ├── Comparison.tsx  # "Andra säger / Selvra säger"
                    ├── LetterExample.tsx
                    ├── Sources.tsx
                    ├── Ownership.tsx
                    ├── Verticals.tsx
                    ├── Architecture.tsx
                    ├── BeginCTA.tsx
                    └── Footer.tsx
```

### 12.3 Implementation-ordning

1. **Layout + typografi** — sätt upp font-loading, color tokens, max-widths
2. **Hero + CTA** — enklaste sektion, definierar typografisk ton
3. **Brev-exempel** — central komponent, måste vara perfekt
4. **Källor-sektion** — gruppera i tre tidskategorier
5. **Övriga sektioner** — i ordning enligt layout
6. **Footer + responsivt** — sista polish
7. **Performance audit** — kontrollera mot Avsnitt 8-mål
8. **Tillgänglighets-audit** — kontrollera mot Avsnitt 9-mål

### 12.4 Validerings-checklist

Innan deploy, verifiera:

- [ ] Alla färg-hex-värden matchar exakt
- [ ] Alla font-storlekar matchar exakt
- [ ] Inga animationer utöver de tillåtna
- [ ] Inga bilder eller illustrationer
- [ ] Inga ikoner (utöver CTA-pil)
- [ ] Inga sekundära CTA-knappar
- [ ] Brev-exempel-text exakt enligt 10.3
- [ ] Källor grupperade i tre tidskategorier exakt enligt 10.4
- [ ] Mobil-responsivt utan layout-skift
- [ ] Performance-mål uppnådda
- [ ] WCAG AA-compliance
- [ ] Ingen JavaScript utöver CTA-routing och eventuell waitlist

### 12.5 Status

**Konstitutionellt godkänt.** Implementation kan börja omedelbart.

Spec sparas som `~/selvra-app/.gsd/decisions/SELVRA_LANDING_DESIGN_SPEC_2026-05-12.md` och fungerar som canonical referens. Framtida sessions ska följa spec:et, inte göra om designarbetet.
