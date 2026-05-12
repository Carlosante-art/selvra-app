import Link from 'next/link'

/**
 * Landing iteration 2 — 2026-05-12.
 *
 * Itererad mot konkret feedback från iteration 1:
 *  1. Brev-exempel matchar nu brev v0.2-register (riktig prosa, multi-
 *     source, specifika datapunkter, observation utan judgment).
 *  2. Konsistent röst: lugn-direkt, specifik, no exclamation, no
 *     marketing-words. Inga växlingar mellan poetisk/teknisk/säljande.
 *  3. "Andra säger / Selvra säger" flyttad till egen sektion direkt
 *     efter hero — det är pitchen mot AI-memory-portability.
 *  4. Insider-språk ("tio låsta reflektions-positioner") borttaget;
 *     ersatt med konkret "aldrig coacha, aldrig predicera, alltid
 *     observera".
 *  5. EU-sovereignty omformulerad offensivt — beslutsregel, inte fotnot.
 *  6. Känslo-ord injicerade: spegling, sedd, närvaro, tystnad, klarhet.
 *  7. CTA: skrivning är direktvärdet; brev kommer veckovis som
 *     biprodukt. Cold-start adresserat.
 *
 * Provisoriska visuella val (mood-board ej låst):
 *  - Paper #FAF8F3, ink #2A2826 (doktrin-låsta)
 *  - Accent oxblood #6E2F2A (swappable när mood-board landar)
 *  - Tailwind font-serif för hero (system fallback)
 *  - Raka kanter, border-t-rules, max-w-prose ~650px
 */

const ACCENT = '#6E2F2A'
const INK = '#2A2826'
const INK_SOFT = '#5C4A3E'
const PAPER = '#FAF8F3'
const RULE = '#D9D2C4'

type SourceStatus = 'live' | 'snart' | 'senare'
type Source = { name: string; status: SourceStatus; label: string }
type Category = { name: string; sources: readonly Source[] }

const CATEGORIES: readonly Category[] = [
  {
    name: 'Kropp',
    sources: [
      { name: 'Dexcom', status: 'snart', label: 'glukos och kroppens rytm' },
      { name: 'Apple Health', status: 'snart', label: 'kroppens samlade signal' },
      { name: 'Garmin', status: 'snart', label: 'puls, sömn, träning' },
      { name: 'Oura', status: 'snart', label: 'sömn och återhämtning' },
      { name: 'Polar', status: 'snart', label: 'träning och hjärtrytm' },
      { name: 'Whoop', status: 'snart', label: 'stress och belastning' },
      { name: 'Withings', status: 'snart', label: 'vikt, sömn, puls' },
    ],
  },
  {
    name: 'Tid',
    sources: [
      { name: 'Google Calendar', status: 'snart', label: 'vad du planerat göra' },
      { name: 'Apple Calendar', status: 'snart', label: 'vad du planerat göra' },
    ],
  },
  {
    name: 'Uppmärksamhet',
    sources: [
      { name: 'Gmail', status: 'snart', label: 'vart uppmärksamheten går' },
      { name: 'Outlook', status: 'snart', label: 'vart uppmärksamheten går' },
    ],
  },
  {
    name: 'Emotion',
    sources: [
      { name: 'Spotify', status: 'snart', label: 'vad du lyssnar på' },
      { name: 'Apple Music', status: 'snart', label: 'vad du lyssnar på' },
      { name: 'Readwise', status: 'snart', label: 'vad du markerar i läsning' },
      { name: 'Kindle', status: 'senare', label: 'vad du läser' },
    ],
  },
  {
    name: 'Aktivitet',
    sources: [
      { name: 'Strava', status: 'snart', label: 'vad kroppen gjorde' },
      { name: 'Garmin Connect', status: 'snart', label: 'vad kroppen gjorde' },
    ],
  },
  {
    name: 'Inre dialog',
    sources: [
      { name: 'Intentioner', status: 'live', label: 'vad du sagt att du vill' },
      { name: 'Tankar', status: 'live', label: 'vad du formulerat i Selvra' },
      { name: 'Notion', status: 'snart', label: 'vad du skrivit utanför Selvra' },
      { name: 'ChatGPT-export', status: 'snart', label: 'vad du tänkt med AI' },
      { name: 'Claude-export', status: 'snart', label: 'vad du tänkt med AI' },
    ],
  },
] as const

export default function LandingPage() {
  return (
    <main
      className="flex flex-1 flex-col items-center px-6"
      style={{ background: PAPER, color: INK }}
    >
      {/* Hero */}
      <section className="w-full max-w-prose flex flex-col gap-8 pt-24 sm:pt-32 pb-24">
        <p
          className="text-xs uppercase tracking-[0.18em]"
          style={{ color: INK_SOFT }}
        >
          Selvra
        </p>
        <h1
          className="font-serif text-4xl sm:text-5xl leading-[1.1] tracking-tight"
          style={{ color: INK }}
        >
          Ett brev till dig själv, varje vecka, från någon som har
          observerat den.
        </h1>
        <p className="text-lg leading-relaxed" style={{ color: INK_SOFT }}>
          Selvra läser källor du redan har och skriver tillbaka. En
          spegling i veckan av vad mönstren visar — utan tolkning, utan
          råd, utan dom.
        </p>
        <p
          className="font-serif text-xl leading-snug"
          style={{ color: INK }}
        >
          Efter en vecka ser du skillnaden mellan vad du säger att du
          vill och vad veckan visade.
        </p>
        <div className="pt-2">
          <Link
            href="/onboarding/intentions"
            className="inline-flex h-12 items-center justify-center px-7 text-sm tracking-wide transition-colors"
            style={{ background: INK, color: PAPER }}
          >
            Börja
          </Link>
        </div>
      </section>

      {/* Sektion 2 — Pitch mot AI-memory-portability */}
      <Divider />
      <section className="w-full max-w-prose flex flex-col gap-10 py-24">
        <SectionLabel>Vad det här är, vad det inte är</SectionLabel>
        <div className="flex flex-col gap-6">
          <p
            className="text-sm uppercase tracking-[0.12em]"
            style={{ color: INK_SOFT }}
          >
            Andra säger
          </p>
          <p className="text-lg leading-relaxed" style={{ color: INK_SOFT }}>
            att din ChatGPT-memory kan flyttas.
          </p>
          <p
            className="text-sm uppercase tracking-[0.12em] pt-4"
            style={{ color: ACCENT }}
          >
            Selvra säger
          </p>
          <p
            className="font-serif text-2xl leading-snug"
            style={{ color: INK }}
          >
            att din ChatGPT-memory är fattig representation av dig.
          </p>
          <p className="text-lg leading-relaxed">
            Den vet vad du sagt till ChatGPT. Inte vad ditt liv visar.
          </p>
          <p className="text-lg leading-relaxed pt-2">
            Selvra läser kropp, tid, uppmärksamhet, emotion, intention.
            Den följer med dig till varje AI-konversation. Den växer med
            dig.
          </p>
        </div>
      </section>

      {/* Sektion 3 — Brev visualiserat (brev v0.2-register) */}
      <Divider />
      <section className="w-full max-w-prose flex flex-col gap-10 py-24">
        <SectionLabel>Så här kan ett brev läsa</SectionLabel>
        <figure
          className="border-l-2 pl-7 py-3 flex flex-col gap-6"
          style={{ borderColor: ACCENT }}
        >
          <p
            className="text-xs uppercase tracking-[0.18em] not-italic"
            style={{ color: INK_SOFT }}
          >
            Vecka 19 · söndag morgon
          </p>

          <div className="flex flex-col gap-5 text-base leading-relaxed">
            <p>
              Du skrev på lördagen att du vill att allt du gör ska ha ett
              syfte. På söndag-kvällen var schemat på Calendar tomt efter
              18:00 och spellistan &ldquo;kvälls-flow&rdquo; fick samma
              fyra timmar igen.
            </p>
            <p>
              Kropp som arbetade hårt mitt i veckan. Från måndag till
              onsdag sjönk tiden över 10 mmol/L från 82% till 58%, för att
              sedan stiga till 95% på fredag-lördag. Garmin loggade ett
              pass — tisdag morgon, 47 minuter, måttlig puls. Din
              intention från mars säger fyra pass i veckan.
            </p>
            <p>
              På torsdag-kvällen skrev du att veckan varit avvikande. Du
              angav inget skäl. Sömn-snitt: 6h 12min — under din egen
              markering på 7h. Två nätter under 6.
            </p>
          </div>

          <figcaption
            className="text-xs not-italic"
            style={{ color: INK_SOFT }}
          >
            Källor: Dexcom · Garmin · Spotify · Calendar · dina tankar ·
            dina intentioner
          </figcaption>
        </figure>
        <p
          className="text-base leading-relaxed"
          style={{ color: INK_SOFT }}
        >
          Inga råd. Inga slutsatser. Bara det som var där, sett från flera
          håll samtidigt. Det som var högt och det som var tyst, sida vid
          sida.
        </p>
      </section>

      {/* Sektion 4 — Vad du redan har (responsive: text-lista mobil, typografi-grid desktop) */}
      <Divider />
      <section className="w-full flex flex-col items-center gap-10 py-24">
        <div className="w-full max-w-prose">
          <SectionLabel>Vad du redan har</SectionLabel>
        </div>
        <div className="w-full max-w-prose">
          <p className="text-lg leading-relaxed">
            Selvra är ingenting utan dig. Den läser bara det du explicit
            kopplar — och de flesta människor har redan källor som beskriver
            dem.
          </p>
        </div>

        {/*
          Mobil (< md): Alt 2 — text-only kategori-lista, ingen logos.
          Kinfolk-dokument-tradition. Stilla. Kategori → källornas namn
          som flytande text. Samma editorial-rhythm som övriga listor
          på sidan.
        */}
        <ul className="md:hidden w-full max-w-prose flex flex-col gap-5 text-base leading-relaxed">
          {CATEGORIES.map((cat) => (
            <li
              key={cat.name}
              className="grid grid-cols-[7rem_1fr] gap-x-6 gap-y-1"
            >
              <span
                className="text-sm uppercase tracking-[0.12em] pt-0.5"
                style={{ color: ACCENT }}
              >
                {cat.name}
              </span>
              <span className="text-base leading-relaxed">
                {cat.sources.map((s) => s.name).join(', ')}
              </span>
            </li>
          ))}
        </ul>

        {/*
          Desktop (md+): 2-kolumns × 3-rader typografi-grid. Per source
          renderas brand-namnet som typografisk "logo" i serif — inte
          extern CDN-logo, eftersom Kinfolk-editorial-tradition behandlar
          brand-omnämnanden som typografi, inte grafiska markörer.
          Status (snart/senare) som tiny italic eyebrow. Live = ingen
          markör (mest framträdande).
        */}
        <div className="hidden md:grid w-full max-w-3xl grid-cols-2 gap-x-14 gap-y-14">
          {CATEGORIES.map((cat) => (
            <div key={cat.name} className="flex flex-col gap-5">
              <h3
                className="text-xs uppercase tracking-[0.18em]"
                style={{ color: ACCENT }}
              >
                {cat.name}
              </h3>
              <ul className="flex flex-col gap-4">
                {cat.sources.map((src) => (
                  <li key={src.name} className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-2.5">
                      <span
                        className="font-serif text-lg leading-tight"
                        style={{ color: INK }}
                      >
                        {src.name}
                      </span>
                      {src.status !== 'live' && (
                        <span
                          className="text-[10px] italic tracking-wide"
                          style={{ color: INK_SOFT }}
                        >
                          {src.status}
                        </span>
                      )}
                    </div>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: INK_SOFT }}
                    >
                      {src.label}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="w-full max-w-prose">
          <p
            className="text-base leading-relaxed pt-2"
            style={{ color: INK_SOFT }}
          >
            En domän räcker. Selvra blir rikare med flera. Den kräver aldrig
            att du börjar göra något nytt — bara att du låter den läsa det
            du redan gör.
          </p>
        </div>
      </section>

      {/* Sektion 5 — Du äger / agency */}
      <Divider />
      <section className="w-full max-w-prose flex flex-col gap-10 py-24">
        <SectionLabel>Det är ditt</SectionLabel>
        <div className="flex flex-col gap-7 text-lg leading-relaxed">
          <p>
            Det Selvra skriver om dig är ditt. Inte upplåst. Inte hyrt.
            Inte beroende av att vi finns kvar om fem år.
          </p>
          <p>
            Hela representationen — intentioner, tankar, brev, källor,
            observerade mönster — kan exporteras som ett enskilt dokument.
            Du kan ge det till en annan AI så att den AI:n läser dig som
            Selvra läser dig. Du kan radera det. Du kan gå.
          </p>
          <p style={{ color: INK_SOFT }}>
            Det här är inte feature-lista. Det är arkitektur. Selvra är
            byggt runt principen att representation av dig själv inte ska
            vara något du måste be om tillgång till.
          </p>
        </div>
      </section>

      {/* Sektion 6 — Vertikalerna som bevis */}
      <Divider />
      <section className="w-full max-w-prose flex flex-col gap-10 py-24">
        <SectionLabel>Selvra är protokoll-lager</SectionLabel>
        <p className="text-lg leading-relaxed">
          Selvra-appen du läser om nu är en av flera vertikaler ovanpå
          samma protokoll. Var och en prövar idén i en specifik domän.
        </p>
        <dl className="flex flex-col gap-7">
          <VerticalLine
            name="Stillra"
            description="Förståelse-lager för T1-diabetiker. Det vi lär oss om kropp och tystnad i kronisk sjukdom."
          />
          <VerticalLine
            name="Motiq"
            description="Reflektions-yta för kreativa människor. Det vi lär oss om motiv och tystnad i skapande."
          />
          <VerticalLine
            name="Forsyne"
            description="Förståelse-lager för uthållighets-atleter. Det vi lär oss om träning och rörelse mot mål."
          />
          <VerticalLine
            name="Elefant"
            description="Spegling av digital närvaro. Det vi lär oss om gapet mellan intention och faktisk handling."
          />
        </dl>
        <p
          className="text-base leading-relaxed pt-2"
          style={{ color: INK_SOFT }}
        >
          Selvras värde sitter inte i en av dem. Det sitter i att de delar
          samma protokoll. Det du skrev i en följer med till nästa.
        </p>
      </section>

      {/* Sektion 7 — Beslutsregeln */}
      <Divider />
      <section className="w-full max-w-prose flex flex-col gap-10 py-24">
        <SectionLabel>Hur Selvra är byggd</SectionLabel>
        <div className="flex flex-col gap-7 text-lg leading-relaxed">
          <p>
            Selvra körs på europeisk infrastruktur. Inte för att
            regleringen kräver det — utan för att representation av
            människor inte ska routas genom amerikansk molnlagring. Det är
            beslutsregeln som styrde allt annat.
          </p>
          <p>
            Av samma skäl är brevet bundet till regler det aldrig får
            bryta. Det får aldrig coacha. Aldrig predicera. Aldrig
            motivera. Aldrig döma. Det får bara observera, namnge källan,
            och låta dig dra slutsatserna själv.
          </p>
          <p style={{ color: INK_SOFT }}>
            Det är gränsen som gör spegeln användbar. Utan den blir Selvra
            ännu en röst som tycker något om dig. Med den blir den en yta
            där du kan se dig själv klarare.
          </p>
        </div>
      </section>

      {/* Sektion 8 — CTA: skrivningen är direktvärdet */}
      <Divider />
      <section className="w-full max-w-prose flex flex-col gap-10 py-24 pb-32">
        <SectionLabel>Börja</SectionLabel>
        <div className="flex flex-col gap-6 text-lg leading-relaxed">
          <p>
            Det första du gör i Selvra är att skriva. En intention — vad
            du vill att veckan ska handla om. En tanke — vad som rör sig
            nu, oavsett om det är klart eller inte.
          </p>
          <p>
            Det är inte förarbete inför brevet. Det är värdet i sig. Att
            artikulera vad man vill, och att skriva ner det som rör sig,
            är handlingar som klarnar tänkandet — innan Selvra hunnit göra
            något.
          </p>
          <p>
            Brevet kommer enligt rytmen du väljer. Tills dess har du en
            yta att skriva i som inte är journaling-app och inte är
            todo-lista. Det är substrat för spegeln.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-6 pt-2">
          <Link
            href="/onboarding/intentions"
            className="inline-flex h-12 items-center justify-center px-7 text-sm tracking-wide transition-colors"
            style={{ background: INK, color: PAPER }}
          >
            Skriv din första intention
          </Link>
          <Link
            href="/privacy"
            className="text-base underline underline-offset-4 transition-colors"
            style={{ color: ACCENT, textDecorationColor: ACCENT }}
          >
            Hur datan hanteras
          </Link>
        </div>
        <p className="text-sm pt-4" style={{ color: INK_SOFT }}>
          Pre-launch. Pris vid publik release: 99–149 kr/månad. Tills dess
          gratis.
        </p>
      </section>
    </main>
  )
}

/* ─── Editorial primitives — local-only, inte design-system än ─────── */

function Divider() {
  return (
    <div
      className="w-full max-w-prose border-t"
      style={{ borderColor: RULE }}
    />
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs uppercase tracking-[0.18em]"
      style={{ color: INK_SOFT }}
    >
      {children}
    </p>
  )
}

function SourceLine({
  domain,
  sources,
}: {
  domain: string
  sources: string
}) {
  return (
    <li className="grid grid-cols-[7rem_1fr] gap-x-6 gap-y-1">
      <span
        className="text-sm uppercase tracking-[0.12em] pt-0.5"
        style={{ color: ACCENT }}
      >
        {domain}
      </span>
      <span className="text-base leading-relaxed">{sources}</span>
    </li>
  )
}

function VerticalLine({
  name,
  description,
}: {
  name: string
  description: string
}) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-x-6 gap-y-1">
      <dt
        className="font-serif text-lg pt-0.5"
        style={{ color: INK }}
      >
        {name}
      </dt>
      <dd
        className="text-base leading-relaxed"
        style={{ color: INK_SOFT }}
      >
        {description}
      </dd>
    </div>
  )
}
