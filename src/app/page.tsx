import Link from 'next/link'

/**
 * selvra.ai Landing — Implementation av SELVRA_LANDING_DESIGN_SPEC_2026-05-12.md.
 *
 * Spec är canonical. Inga avvikelser från färg-hex, font-storlekar, eller
 * copy-text utan att uppdatera spec:et. Komponenterna är inlined för
 * läsbarhet — om landing växer kan de brytas ut till
 * `components/landing/`.
 *
 * Validerings-checklist (Avsnitt 12.4) följs:
 * - Färg-hex: paper #FAF8F5, ink #1A1814, ink-soft #6B6660, ink-tertiary
 *   #A39E96, oxblod #722F37, hairline #D6CFC2 (v9: höjt från #E8E2D9 för WCAG-läsbarhet)
 * - Inga ikoner utöver CTA-pil (→)
 * - Ingen sekundär CTA, en enda knapp-stil
 * - Inga bilder/illustrationer
 * - Inga box-shadows, ingen scroll-animation
 * - Källor i tre tidsgrupper (Live nu / Kopplas dag 1 / Senare)
 * - Brev-exempel exakt enligt Avsnitt 10.3
 *
 * v9 (2026-05-12) — post-feedback iteration. Förändringar mot v8:
 * - Hairline-kontrast höjd (#E8E2D9 → #D6CFC2): syntes inte på paper-bakgrund
 * - Section-spacing minskat (clamp(160px,12vw,200px) → clamp(96px,8vw,128px))
 * - hr-elementen reducerade från 15 → 7: interna hr i LetterExample,
 *   Sources och Verticals borttagna (gap-spacing räcker som visuell
 *   separator inom en section)
 */

const SECTION_RULE_STYLE = {
  height: '1px',
  backgroundColor: 'var(--color-hairline)',
  border: 'none',
  margin: 0,
}

export default function LandingPage() {
  return (
    <main
      className="landing-page flex flex-1 flex-col items-center"
      style={{ background: 'var(--color-paper)', color: 'var(--color-ink)' }}
    >
      <Hero />
      <SectionDivider />
      <Comparison />
      <SectionDivider />
      <LetterExample />
      <SectionDivider />
      <Sources />
      <SectionDivider />
      <Ownership />
      <SectionDivider />
      <Verticals />
      <SectionDivider />
      <Architecture />
      <SectionDivider />
      <BeginCTA />
      <LandingFooter />
    </main>
  )
}

/* ─── Section divider med generös vit yta (Avsnitt 4.2) ─────────────── */

function SectionDivider() {
  return (
    <div className="w-full flex justify-center" aria-hidden="true">
      <hr
        className="w-full max-w-[640px] my-[clamp(96px,8vw,128px)]"
        style={SECTION_RULE_STYLE}
      />
    </div>
  )
}

/* ─── Hero — Avsnitt 5.1 + canonical copy 10.1 ──────────────────────── */

function Hero() {
  return (
    <section
      className="w-full max-w-[800px] px-6 pt-[clamp(96px,12vw,160px)] pb-0"
      style={{ minHeight: '80vh' }}
    >
      <h1
        className="font-serif font-normal tracking-tight"
        style={{
          fontSize: 'clamp(48px, 5vw + 1rem, 72px)',
          lineHeight: 1.05,
          color: 'var(--color-ink)',
        }}
      >
        Selvra
      </h1>

      <div className="max-w-[640px] mt-[clamp(48px,6vw,80px)] flex flex-col gap-[1.5em]">
        <p
          className="font-serif font-normal"
          style={{
            fontSize: 'clamp(22px, 2vw + 0.5rem, 26px)',
            lineHeight: 1.3,
            color: 'var(--color-ink)',
          }}
        >
          Ett brev till dig själv, varje vecka, från någon som har
          observerat den.
        </p>

        <p
          className="font-serif font-normal"
          style={{
            fontSize: 'clamp(19px, 1.2vw + 0.5rem, 20px)',
            lineHeight: 1.6,
            color: 'var(--color-ink)',
          }}
        >
          Selvra läser det du redan lämnar efter dig: din kalender, din
          kropp, din sömn, din musik, dina ord.
        </p>

        <p
          className="font-serif font-normal"
          style={{
            fontSize: 'clamp(19px, 1.2vw + 0.5rem, 20px)',
            lineHeight: 1.6,
            color: 'var(--color-ink)',
          }}
        >
          Efter en vecka ser du skillnaden mellan vad du säger att du vill
          och vad veckan visade.
        </p>

        <div className="mt-[clamp(32px,4vw,48px)]">
          {/* CTA-href /onboarding/intentions ändrad till /welcome 2026-05-15
              (v1-refaktor Steg 5). Text-copy uppdateras när landing-spec
              re-lockas för v1 (samtal-paradigm). */}
          <CTALink href="/welcome">
            Skriv din första intention
          </CTALink>
        </div>
      </div>
    </section>
  )
}

/* ─── Comparison — Avsnitt 5.2 + canonical copy 10.2 ────────────────── */

function Comparison() {
  return (
    <section className="w-full max-w-[640px] px-6">
      <p
        className="font-serif font-normal italic"
        style={{
          fontSize: 'clamp(15px, 1vw + 0.4rem, 15px)',
          color: 'var(--color-ink-soft)',
        }}
      >
        Andra säger
      </p>
      <p
        className="font-serif font-normal mt-[0.4em]"
        style={{
          fontSize: 'clamp(22px, 2vw + 0.5rem, 26px)',
          lineHeight: 1.4,
          color: 'var(--color-ink-soft)',
        }}
      >
        att din ChatGPT-memory kan flyttas.
      </p>

      <p
        className="font-serif font-normal italic mt-[clamp(48px,6vw,72px)]"
        style={{
          fontSize: 'clamp(15px, 1vw + 0.4rem, 15px)',
          color: 'var(--color-ink)',
        }}
      >
        Selvra säger
      </p>
      <p
        className="font-serif font-normal mt-[0.4em]"
        style={{
          fontSize: 'clamp(32px, 3vw + 0.5rem, 44px)',
          lineHeight: 1.15,
          color: 'var(--color-ink)',
        }}
      >
        att din ChatGPT-memory är fattig representation av dig.
      </p>

      <div
        className="font-serif font-normal mt-[clamp(32px,4vw,56px)] flex flex-col gap-[1.5em]"
        style={{
          fontSize: 'clamp(19px, 1.2vw + 0.5rem, 20px)',
          lineHeight: 1.6,
          color: 'var(--color-ink)',
        }}
      >
        <p>Den vet vad du sagt till ChatGPT. Inte vad ditt liv visar.</p>
        <p>
          Selvra läser kropp, tid, uppmärksamhet, emotion, intention. Den
          följer med dig till varje AI-konversation. Den växer med dig.
        </p>
      </div>
    </section>
  )
}

/* ─── Letter example — Avsnitt 5.3 + canonical copy 10.3 ────────────── */

function LetterExample() {
  return (
    <section className="w-full max-w-[640px] px-6">
      <h2
        className="font-serif font-normal tracking-tight"
        style={{
          fontSize: 'clamp(32px, 3vw + 0.5rem, 44px)',
          lineHeight: 1.15,
          color: 'var(--color-ink)',
        }}
      >
        Så här kan ett brev läsa
      </h2>

      <p
        className="font-sans mt-[clamp(48px,6vw,72px)]"
        style={{
          fontSize: '15px',
          lineHeight: 1.4,
          color: 'var(--color-ink-soft)',
        }}
      >
        Vecka 19 · söndag morgon
      </p>

      <div
        className="font-serif font-normal mt-[clamp(32px,4vw,48px)] flex flex-col gap-[1.5em]"
        style={{
          fontSize: 'clamp(19px, 1.2vw + 0.5rem, 20px)',
          lineHeight: 1.6,
          color: 'var(--color-ink)',
        }}
      >
        <p>
          Du skrev på lördagen att du vill att allt du gör ska ha ett
          syfte. På söndag-kvällen var schemat på Calendar tomt efter
          18:00 och spellistan &ldquo;kvälls-flow&rdquo; fick samma fyra
          timmar igen.
        </p>
        <p>
          Kropp som arbetade hårt mitt i veckan. Från måndag till onsdag
          sjönk tiden över 10 mmol/L från 82% till 58%, för att sedan
          stiga till 95% på fredag-lördag. Garmin loggade ett pass —
          tisdag morgon, 47 minuter, måttlig puls. Din intention från
          mars säger fyra pass i veckan.
        </p>
        <p>
          På torsdag-kvällen skrev du att veckan varit avvikande. Du
          angav inget skäl. Sömn-snitt: 6h 12min — under din egen
          markering på 7h. Två nätter under 6.
        </p>
      </div>

      <p
        className="font-sans mt-[clamp(32px,4vw,48px)]"
        style={{
          fontSize: '15px',
          lineHeight: 1.4,
          color: 'var(--color-ink-soft)',
        }}
      >
        Källor: Dexcom · Garmin · Spotify · Calendar · dina tankar · dina
        intentioner
      </p>

      <p
        className="font-serif font-normal mt-[clamp(48px,6vw,72px)]"
        style={{
          fontSize: 'clamp(19px, 1.2vw + 0.5rem, 20px)',
          lineHeight: 1.6,
          color: 'var(--color-ink)',
        }}
      >
        Inga råd. Inga slutsatser. Bara det som var där, sett från flera
        håll samtidigt. Det som var högt och det som var tyst, sida vid
        sida.
      </p>
    </section>
  )
}

/* ─── Sources — Avsnitt 5.4 + canonical copy 10.4 ───────────────────── */

function Sources() {
  return (
    <section className="w-full max-w-[640px] px-6">
      <h2
        className="font-serif font-normal tracking-tight"
        style={{
          fontSize: 'clamp(32px, 3vw + 0.5rem, 44px)',
          lineHeight: 1.15,
          color: 'var(--color-ink)',
        }}
      >
        Vad du redan har
      </h2>

      <p
        className="font-serif font-normal mt-[clamp(48px,6vw,72px)]"
        style={{
          fontSize: 'clamp(19px, 1.2vw + 0.5rem, 20px)',
          lineHeight: 1.6,
          color: 'var(--color-ink)',
        }}
      >
        Selvra läser bara det du explicit kopplar. De flesta människor
        har redan källor som beskriver dem.
      </p>

      <div className="mt-[clamp(64px,7vw,96px)] flex flex-col gap-[clamp(48px,6vw,72px)]">
      <SourceGroup heading="Live nu">
        <SourceLine
          name="Intentioner"
          description="vad du säger att du vill"
        />
        <SourceLine
          name="Tankar"
          description="vad du formulerar i Selvra"
        />
        <SourceLine
          name="Dexcom"
          description="glukos och kroppens rytm"
        />
      </SourceGroup>

      <SourceGroup heading="Kopplas dag 1">
        <SourceCategory label="Kropp" items="Garmin · Apple Health" />
        <SourceCategory label="Tid" items="Google Calendar" />
        <SourceCategory label="Uppmärksamhet" items="Gmail" />
        <SourceCategory label="Emotion" items="Spotify · Readwise" />
        <SourceCategory label="Aktivitet" items="Strava" />
      </SourceGroup>

      <SourceGroup heading="Senare">
        <p
          className="font-serif font-normal"
          style={{
            fontSize: 'clamp(19px, 1.2vw + 0.5rem, 20px)',
            lineHeight: 1.6,
            color: 'var(--color-ink)',
          }}
        >
          Oura · Whoop · Polar · Withings · Apple Music · Outlook · Apple
          Calendar · Notion · Kindle · ChatGPT-export · Claude-export
        </p>
      </SourceGroup>
      </div>

      <p
        className="font-serif font-normal mt-[clamp(64px,7vw,96px)]"
        style={{
          fontSize: 'clamp(19px, 1.2vw + 0.5rem, 20px)',
          lineHeight: 1.6,
          color: 'var(--color-ink)',
        }}
      >
        En domän räcker. Selvra blir rikare med flera. Den kräver aldrig
        att du börjar göra något nytt — bara att du låter den läsa det
        du redan gör.
      </p>
    </section>
  )
}

function SourceGroup({
  heading,
  children,
}: {
  heading: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h3
        className="font-serif font-medium tracking-tight"
        style={{
          fontSize: 'clamp(22px, 1.5vw + 0.5rem, 26px)',
          lineHeight: 1.3,
          color: 'var(--color-ink)',
        }}
      >
        {heading}
      </h3>
      <div className="mt-[clamp(32px,4vw,48px)] flex flex-col gap-[1.2em]">
        {children}
      </div>
    </div>
  )
}

function SourceLine({
  name,
  description,
}: {
  name: string
  description: string
}) {
  return (
    <p
      className="font-serif font-normal"
      style={{
        fontSize: 'clamp(19px, 1.2vw + 0.5rem, 20px)',
        lineHeight: 1.6,
        color: 'var(--color-ink)',
      }}
    >
      <span style={{ color: 'var(--color-ink)' }}>{name}</span>
      <span style={{ color: 'var(--color-ink-soft)' }}>
        {' '}— {description}
      </span>
    </p>
  )
}

function SourceCategory({ label, items }: { label: string; items: string }) {
  return (
    <p
      className="font-serif font-normal"
      style={{
        fontSize: 'clamp(19px, 1.2vw + 0.5rem, 20px)',
        lineHeight: 1.6,
        color: 'var(--color-ink)',
      }}
    >
      <span style={{ color: 'var(--color-ink-soft)' }}>{label}: </span>
      <span style={{ color: 'var(--color-ink)' }}>{items}</span>
    </p>
  )
}

/* ─── Ownership — canonical copy 10.5 ───────────────────────────────── */

function Ownership() {
  return (
    <section className="w-full max-w-[640px] px-6">
      <h2
        className="font-serif font-normal tracking-tight"
        style={{
          fontSize: 'clamp(32px, 3vw + 0.5rem, 44px)',
          lineHeight: 1.15,
          color: 'var(--color-ink)',
        }}
      >
        Det är ditt
      </h2>

      <div
        className="font-serif font-normal mt-[clamp(48px,6vw,72px)] flex flex-col gap-[1.5em]"
        style={{
          fontSize: 'clamp(19px, 1.2vw + 0.5rem, 20px)',
          lineHeight: 1.6,
          color: 'var(--color-ink)',
        }}
      >
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
        <p style={{ color: 'var(--color-ink-soft)' }}>
          Det här är inte feature-lista. Det är arkitektur. Selvra är
          byggt runt principen att representation av dig själv inte ska
          vara något du måste be om tillgång till.
        </p>
      </div>
    </section>
  )
}

/* ─── Verticals — Avsnitt 5.5 + canonical copy 10.6 ─────────────────── */

function Verticals() {
  return (
    <section className="w-full max-w-[640px] px-6">
      <h2
        className="font-serif font-normal tracking-tight"
        style={{
          fontSize: 'clamp(32px, 3vw + 0.5rem, 44px)',
          lineHeight: 1.15,
          color: 'var(--color-ink)',
        }}
      >
        Selvra är protokoll-lager
      </h2>

      <p
        className="font-serif font-normal mt-[clamp(48px,6vw,72px)]"
        style={{
          fontSize: 'clamp(19px, 1.2vw + 0.5rem, 20px)',
          lineHeight: 1.6,
          color: 'var(--color-ink)',
        }}
      >
        Selvra-appen du läser om nu är en av flera vertikaler ovanpå
        samma protokoll. Var och en prövar idén i en specifik domän.
      </p>

      <div className="mt-[clamp(48px,6vw,72px)] flex flex-col gap-[1.8em]">
        <VerticalEntry
          name="Stillra"
          description="för T1-diabetiker. Det vi lär oss om kropp och tystnad i kronisk sjukdom."
        />
        <VerticalEntry
          name="Motiq"
          description="för kreativa människor. Det vi lär oss om motiv och tystnad i skapande."
        />
        <VerticalEntry
          name="Forsyne"
          description="för uthållighets-atleter. Det vi lär oss om träning och rörelse mot mål."
        />
        <VerticalEntry
          name="Elefant"
          description="spegling av digital närvaro. Det vi lär oss om gapet mellan intention och faktisk handling."
        />
      </div>

      <p
        className="font-serif font-normal text-center mt-[clamp(48px,6vw,72px)]"
        style={{
          fontSize: 'clamp(19px, 1.2vw + 0.5rem, 20px)',
          lineHeight: 1.6,
          color: 'var(--color-ink)',
        }}
      >
        Selvras värde sitter inte i en av dem. Det sitter i att de delar
        samma protokoll. Det du skrev i en följer med till nästa.
      </p>
    </section>
  )
}

function VerticalEntry({
  name,
  description,
}: {
  name: string
  description: string
}) {
  return (
    <p
      className="font-serif font-normal"
      style={{
        fontSize: 'clamp(19px, 1.2vw + 0.5rem, 20px)',
        lineHeight: 1.6,
        color: 'var(--color-ink)',
      }}
    >
      <span style={{ color: 'var(--color-ink)' }}>{name}</span>
      <span style={{ color: 'var(--color-ink-soft)' }}> — {description}</span>
    </p>
  )
}

/* ─── Architecture — canonical copy 10.7 ────────────────────────────── */

function Architecture() {
  return (
    <section className="w-full max-w-[640px] px-6">
      <h2
        className="font-serif font-normal tracking-tight"
        style={{
          fontSize: 'clamp(32px, 3vw + 0.5rem, 44px)',
          lineHeight: 1.15,
          color: 'var(--color-ink)',
        }}
      >
        Hur Selvra är byggd
      </h2>

      <div
        className="font-serif font-normal mt-[clamp(48px,6vw,72px)] flex flex-col gap-[1.5em]"
        style={{
          fontSize: 'clamp(19px, 1.2vw + 0.5rem, 20px)',
          lineHeight: 1.6,
          color: 'var(--color-ink)',
        }}
      >
        <p>
          Selvra körs på europeisk infrastruktur. Inte för att regleringen
          kräver det — utan för att representation av människor inte ska
          routas genom amerikansk molnlagring. Det är beslutsregeln som
          styrde allt annat.
        </p>
        <p>
          Av samma skäl är brevet bundet till regler det aldrig får
          bryta. Det får aldrig coacha. Aldrig predicera. Aldrig
          motivera. Aldrig döma. Det får bara observera, namnge källan,
          och låta dig dra slutsatserna själv.
        </p>
        <p style={{ color: 'var(--color-ink-soft)' }}>
          Det är gränsen som gör spegeln användbar. Utan den blir Selvra
          ännu en röst som tycker något om dig. Med den blir den en yta
          där du kan se dig själv klarare.
        </p>
      </div>
    </section>
  )
}

/* ─── BeginCTA — canonical copy 10.8 ────────────────────────────────── */

function BeginCTA() {
  return (
    <section className="w-full max-w-[640px] px-6">
      <h2
        className="font-serif font-normal tracking-tight"
        style={{
          fontSize: 'clamp(32px, 3vw + 0.5rem, 44px)',
          lineHeight: 1.15,
          color: 'var(--color-ink)',
        }}
      >
        Börja
      </h2>

      <div
        className="font-serif font-normal mt-[clamp(48px,6vw,72px)] flex flex-col gap-[1.5em]"
        style={{
          fontSize: 'clamp(19px, 1.2vw + 0.5rem, 20px)',
          lineHeight: 1.6,
          color: 'var(--color-ink)',
        }}
      >
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

      <div className="mt-[clamp(48px,6vw,72px)]">
        {/* CTA-href /onboarding/intentions ändrad till /welcome 2026-05-15
            (v1-refaktor Steg 5). Text-copy uppdateras när landing-spec
            re-lockas för v1 (samtal-paradigm). */}
        <CTALink href="/welcome">
          Skriv din första intention
        </CTALink>
      </div>
    </section>
  )
}

/* ─── Landing footer — Avsnitt 5.7 + canonical copy 10.9 ────────────── */

function LandingFooter() {
  return (
    <footer
      className="w-full max-w-[640px] px-6 mt-[clamp(96px,8vw,128px)] mb-[clamp(64px,6vw,96px)]"
      aria-label="Site footer"
    >
      <p
        className="font-serif font-normal"
        style={{
          fontSize: 'clamp(22px, 1.5vw + 0.5rem, 26px)',
          lineHeight: 1.3,
          color: 'var(--color-ink)',
        }}
      >
        Selvra
      </p>

      <p
        className="font-sans mt-[1.5em]"
        style={{
          fontSize: '14px',
          lineHeight: 1.4,
          color: 'var(--color-ink-soft)',
        }}
      >
        Pre-launch. Pris vid publik release: 99–149 kr/månad. Tills dess
        gratis.
      </p>

      <nav
        className="font-sans mt-[1.5em] flex gap-4 flex-wrap"
        style={{
          fontSize: '14px',
          color: 'var(--color-ink-soft)',
        }}
        aria-label="Footer-nav"
      >
        <Link
          href="/privacy"
          className="hover:underline underline-offset-2 transition-colors hover:text-[var(--color-oxblod)]"
          style={{ color: 'var(--color-ink-soft)' }}
        >
          Hur datan hanteras
        </Link>
        <span style={{ color: 'var(--color-ink-tertiary)' }}>·</span>
        <Link
          href="/privacy"
          className="hover:underline underline-offset-2 transition-colors hover:text-[var(--color-oxblod)]"
          style={{ color: 'var(--color-ink-soft)' }}
        >
          Kontakt
        </Link>
      </nav>

      <p
        className="font-sans mt-[1.5em]"
        style={{
          fontSize: '14px',
          color: 'var(--color-ink-tertiary)',
        }}
      >
        ©2026
      </p>
    </footer>
  )
}

/* ─── CTA link — Avsnitt 5.6, single style för hela sidan ───────────── */

function CTALink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="cta-link inline-block font-serif font-normal transition-colors"
      style={{
        fontSize: 'clamp(19px, 1.2vw + 0.5rem, 20px)',
        color: 'var(--color-ink)',
        textDecoration: 'none',
        padding: '0.25em 0',
      }}
    >
      {children}{' '}
      <span
        className="cta-arrow inline-block transition-transform"
        style={{ marginLeft: '0.2em' }}
        aria-hidden="true"
      >
        →
      </span>
      <style>{`
        .cta-link:hover {
          color: var(--color-oxblod) !important;
          text-decoration: underline !important;
          text-underline-offset: 0.2em;
        }
        .cta-link:hover .cta-arrow {
          transform: translateX(4px);
        }
      `}</style>
    </Link>
  )
}
