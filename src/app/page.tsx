import Link from 'next/link'

/**
 * Landing-rewrite v1 — test-iteration 2026-05-12.
 *
 * Skrota tidigare landing. Bygg från grunden mot:
 * - 10 lock-positioner för reflektions-format
 * - 8 canonical positionerings-fraser
 * - Source Strategy v2 (Fas 1-3 + Domain-modell)
 * - Design-doktrin (Kinfolk/Craig Mod/Are.na — dokument, inte SaaS)
 * - Konkurrent-position vs AI-memory-portability
 * - Pris-modell 99-149 kr/månad
 *
 * Provisoriska visuella val för denna iteration (mood-board ej låst än):
 * - Paper-bg #FAF8F3, ink-text #2A2826 (doktrin-låsta)
 * - Accent oxblood #6E2F2A (swappable när mood-board lockar accent)
 * - Geist Sans för body, Tailwind font-serif (system fallback Georgia/Times)
 *   för hero/h1 — sann serif-import väntar mood-board
 * - Raka knappar, border-t-sektion-rules, max-w-prose ~650px, py-multiplar
 *
 * INTE slutgiltig produktion. Test-iteration för Carl att se och iterera mot.
 */

const ACCENT = '#6E2F2A'
const INK = '#2A2826'
const INK_SOFT = '#5C4A3E'
const PAPER = '#FAF8F3'

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
          Selvra läser källor du redan använder och speglar mönster mellan
          vad du säger att du vill, vad du säger att du gör, och vad datan
          visar att du faktiskt gör.
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

      {/* Sektion 2 — Vad Selvra gör konkret */}
      <Divider />
      <section className="w-full max-w-prose flex flex-col gap-10 py-24">
        <SectionLabel>Vad Selvra gör</SectionLabel>
        <div className="flex flex-col gap-8 text-lg leading-relaxed">
          <p>
            Selvra läser passivt. Du fortsätter göra det du gör — kalendern,
            mailen, Spotify, träningen, kroppen. Selvra lägger sig som ett
            lager ovanpå och observerar.
          </p>
          <p>
            Selvra söker gapet. Mellan vad du sagt att du vill, vad du sagt
            att du gör, och vad källorna visar. Det är där rörelsen finns —
            inte i siffrorna själva.
          </p>
          <p>
            Selvra skriver tillbaka. Varje vecka, ett brev. Inte en
            dashboard. Inte en coach. Ett dokument du läser, sparar, går
            tillbaka till.
          </p>
        </div>
      </section>

      {/* Sektion 3 — Vad du redan har */}
      <Divider />
      <section className="w-full max-w-prose flex flex-col gap-10 py-24">
        <SectionLabel>Vad du redan har</SectionLabel>
        <p className="text-lg leading-relaxed">
          Selvras tes är enkel: de flesta människor har redan källor som
          beskriver dem. Selvra läser de du explicit kopplar — inget annat.
        </p>
        <ul className="flex flex-col gap-5 text-base leading-relaxed">
          <SourceLine
            domain="Kropp"
            sources="Dexcom (via Stillra), Apple Health, Garmin"
          />
          <SourceLine
            domain="Tid"
            sources="Google Calendar, Apple Calendar"
          />
          <SourceLine
            domain="Uppmärksamhet"
            sources="Gmail-metadata (frekvens och avsändare, aldrig innehåll)"
          />
          <SourceLine
            domain="Emotion"
            sources="Spotify, Apple Music, Readwise"
          />
          <SourceLine
            domain="Aktivitet"
            sources="Strava, Garmin Connect"
          />
          <SourceLine
            domain="Inre dialog"
            sources="Din intention, dina tankar, Notion, AI-konversation-import"
          />
        </ul>
        <p
          className="text-sm leading-relaxed italic pt-2"
          style={{ color: INK_SOFT }}
        >
          Selvra fungerar med en domän. Den blir rikare när du kopplar fler.
          Den kräver aldrig att du börjar göra något nytt.
        </p>
      </section>

      {/* Sektion 4 — Brev-metaforen visualiserad */}
      <Divider />
      <section className="w-full max-w-prose flex flex-col gap-10 py-24">
        <SectionLabel>Så här kan ett brev se ut</SectionLabel>
        <figure
          className="border-l-2 pl-7 py-3 flex flex-col gap-5"
          style={{ borderColor: ACCENT }}
        >
          <p
            className="text-xs uppercase tracking-[0.18em] not-italic"
            style={{ color: INK_SOFT }}
          >
            Vecka 19 · söndag morgon
          </p>
          <p className="text-base leading-relaxed italic">
            &ldquo;Garmin visade ett träningspass förra veckan. Din intention
            från mars säger fyra. På torsdagen skrev du att veckan varit
            avvikande.
          </p>
          <p className="text-base leading-relaxed italic">
            Sömn-snitt: 6h 12min — under din egen markering på 7h. Spotify-
            spellistan &lsquo;kvälls-flow&rsquo; fick 4h igen, samma som
            föregående vecka. Kalendern visade inget efter 18:00 på söndag-
            kvällen.
          </p>
          <p className="text-base leading-relaxed italic">
            Du sa att du ville röra dig mer. Datan säger att rörelsen har
            tystnat. Tankarna du skrev säger att veckan kändes
            avvikande.&rdquo;
          </p>
          <figcaption
            className="text-xs not-italic pt-2"
            style={{ color: INK_SOFT }}
          >
            Källor: Garmin · Strava · Spotify · Calendar · dina tankar ·
            dina intentioner
          </figcaption>
        </figure>
        <p className="text-base leading-relaxed" style={{ color: INK_SOFT }}>
          Brevet är spegling, inte rekommendation. Det säger inte vad du
          bör göra. Det visar vad som finns där.
        </p>
      </section>

      {/* Sektion 5 — Agency-position */}
      <Divider />
      <section className="w-full max-w-prose flex flex-col gap-10 py-24">
        <SectionLabel>Du äger representationen</SectionLabel>
        <div className="flex flex-col gap-8 text-lg leading-relaxed">
          <p>
            Allt Selvra vet om dig — intentioner, tankar, reflektioner,
            källor, observationer — kan exporteras som ett enskilt dokument
            (SREF v1). Kryptografiskt signerat. Portabelt. Standard.
          </p>
          <p>
            Det betyder du kan ta det med dig. Du kan dela det med en annan
            AI — ChatGPT, Claude, Gemini — så att den AI:n förstår dig
            bättre. Selvra blir lagret över alla AI-konversationer du har.
          </p>
          <p style={{ color: INK_SOFT }}>
            <em>
              Andra säger att din ChatGPT-memory kan flyttas. Selvra säger
              att din ChatGPT-memory är fattig representation av dig — den
              vet vad du sagt till ChatGPT, inte vad ditt liv visar. Selvra
              är riktig representation. Den följer med dig.
            </em>
          </p>
          <p>
            Och om du vill bort — markera kontot för radering. Inom 30 dagar
            kan du ångra. Efter 30 dagar är all event-historik borta.
            Slutgiltigt.
          </p>
        </div>
      </section>

      {/* Sektion 6 — Vertikalerna som bevis */}
      <Divider />
      <section className="w-full max-w-prose flex flex-col gap-10 py-24">
        <SectionLabel>Selvra är protokoll-lager</SectionLabel>
        <p className="text-lg leading-relaxed">
          Selvra-appen du läser om är en av flera vertikaler ovanpå samma
          protokoll. Var och en testar idén i en specifik domän.
        </p>
        <dl className="flex flex-col gap-7">
          <VerticalLine
            name="Stillra"
            description="CGM-app som översätter glukos-siffror till sammanhang för T1-diabetiker. Det vi lär oss om kropp och tystnad."
          />
          <VerticalLine
            name="Motiq"
            description="Reflektions-yta för kreativa människor. Det vi lär oss om motiv och tystnad i skapande."
          />
          <VerticalLine
            name="Forsyne"
            description="Förståelse-lager för svenska uthållighetsatleter. Det vi lär oss om träning, återhämtning och rörelse mot mål."
          />
          <VerticalLine
            name="Elefant"
            description="Yta som mäter gapet mellan intention och faktisk handling i digital aktivitet. Det vi lär oss om uppmärksamhet."
          />
        </dl>
        <p
          className="text-base leading-relaxed pt-2"
          style={{ color: INK_SOFT }}
        >
          Selvras värde sitter inte i en av dem. Det sitter i att de delar
          samma protokoll. Det du sparar i en följer med till nästa.
        </p>
      </section>

      {/* Sektion 7 — EU-sovereignty + constitutional reasoning */}
      <Divider />
      <section className="w-full max-w-prose flex flex-col gap-10 py-24">
        <SectionLabel>Var datan ligger</SectionLabel>
        <div className="flex flex-col gap-8 text-lg leading-relaxed">
          <p>
            Selvra körs i Frankfurt. EU. Inget tredjepartsföretag utanför EU
            har permanent kopia av dina events. CLOUD Act-exponering är inte
            tillämplig. EU AI Act-kompatibel sedan grundläggning.
          </p>
          <p>
            Det är inte marknadsföring. Det är arkitektoniskt beslut som
            påverkar vilka konkurrenter som finns kvar 2027-2028 när
            regleringen är hård.
          </p>
          <p>
            Selvra har också tio låsta reflektions-positioner som styr vad
            brevet får och inte får göra. Aldrig coach-språk. Aldrig
            prediktion. Aldrig motivation. Alltid käll-attribuerat. Alltid
            observation. Det är systemets <em>karaktär</em>, inte stil-val.
          </p>
        </div>
      </section>

      {/* Sektion 8 — CTA */}
      <Divider />
      <section className="w-full max-w-prose flex flex-col gap-10 py-24 pb-32">
        <SectionLabel>Börja</SectionLabel>
        <p className="text-xl leading-relaxed">
          Skriv din första intention. Koppla en källa du redan använder.
          Vänta en vecka. Läs brevet. Iterera.
        </p>
        <div className="flex flex-wrap items-center gap-6 pt-2">
          <Link
            href="/onboarding/intentions"
            className="inline-flex h-12 items-center justify-center px-7 text-sm tracking-wide transition-colors"
            style={{ background: INK, color: PAPER }}
          >
            Börja nu
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
          gratis dogfood.
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
      style={{ borderColor: '#D9D2C4' }}
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
