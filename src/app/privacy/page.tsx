export const metadata = {
  title: 'Integritet',
  description:
    'Hur Selvra hanterar din data — vad samlas, var lagras det, hur du tar med dig det när du går.',
}

export default function PrivacyPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="max-w-prose w-full flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-medium tracking-tight">Integritet</h1>
          <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
            Selvra är byggt så du äger din representation. Det här är
            data-flödet som faktiskt sker — tekniskt-ärlig beskrivning av
            vad som hamnar var. Inte juridik-text.
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            Senast uppdaterad: 2026-05-16. Pre-launch utkast. Juridisk
            granskning + DPIA innan publik release.
          </p>
        </header>

        <Section title="Vad Selvra samlar">
          <p>Endast det du aktivt skriver, kopplar eller ger permission för:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <strong>HealthKit-data</strong> (iOS-app, vecka 4+): sömn,
              hjärtfrekvens, HRV, stegmängd, aktivitet. Native iOS-permissions
              via dialog. Du väljer per metric vad Selvra får läsa.
            </li>
            <li>
              <strong>Kalender-events</strong> (EventKit på iOS): bara titlar
              och tider — aldrig deltagare eller mötes-beskrivningar.
            </li>
            <li>
              <strong>Dina ord</strong> i samtal med Selvra (text, tidsstämpel,
              tråd-koppling).
            </li>
            <li>
              <strong>Källor du kopplar</strong> (Garmin, Strava, Spotify,
              Google Calendar, Gmail-metadata): OAuth-tokens + källornas data.
              Aldrig mail-innehåll för Gmail (bara metadata via gmail.metadata-
              scope).
            </li>
            <li>
              <strong>Apple Sign-in identity</strong>: pseudonymiserat Apple
              User ID + valfri email (privaterelay om du väljer dölja).
            </li>
          </ul>
          <p>
            Selvra-protokollet processar denna data och härleder:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <strong>Spegling-observationer</strong> — käll-attribuerade
              påståenden (&quot;Garmin visar 5h 40min sömn snitt&quot;) i samtals-svar.
            </li>
            <li>
              <strong>Conversation facts</strong> — extraherade fakta från
              samtal: &quot;du sagt&quot; (user-stated) eller &quot;din källa
              visat&quot; (source-observed). Visas i appens minne-vy.
            </li>
            <li>
              <strong>Explicita minnen</strong> — sak du explicit bett Selvra
              komma ihåg (&quot;Kom ihåg att jag är T1-diabetiker&quot;).
            </li>
          </ul>
          <p>
            All härledd data lagras med tydlig provenance: du kan spåra vilket
            event som ledde till vilken observation.
          </p>
        </Section>

        <Section title="Var datan lagras">
          <p>
            <strong>EU-deployed.</strong> Selvra-protokollet och backend körs
            på Railway-infrastruktur i EU-region (Frankfurt, Hetzner).
            Inget tredjepartsföretag utanför EU har permanent kopia av din data.
          </p>
          <p>Sub-processors:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <strong>Railway</strong> (Hetzner Frankfurt) — hostar Selvra-
              protokollet, selvra-app backend, PostgreSQL-databaser.
            </li>
            <li>
              <strong>Vercel</strong> (EU Function Region) — hostar landing-
              sidan + auth-flöden + REST-API för iOS-klient.
            </li>
            <li>
              <strong>Mistral</strong> (Paris) — primär LLM-leverantör. EU-
              hostat. Inga sub-processors utanför EU per default. Vi tränar
              inte modeller på din data.
            </li>
            <li>
              <strong>Anthropic EU-tier</strong> — fallback-LLM (DPA + no-
              training-commitment). Aktiveras endast om Mistral inte räcker.
            </li>
            <li>
              <strong>Sentry</strong> (EU-region) — error-tracking. PII
              scrubbas innan event skickas (recursive object-redaction).
            </li>
            <li>
              <strong>Resend</strong> (USA, EU-region launch H2 2026) —
              endast magic-link mail. Vid AB-aktivering re-evalueras EU-
              mail-provider om Resend EU inte klar.
            </li>
            <li>
              <strong>Apple</strong> — Sign-in-token-validering går till
              Apple. iOS-app sparar token i Keychain (lokalt, ej cloud-sync).
            </li>
          </ul>
          <p>
            <strong>Aldrig:</strong> OpenAI consumer-tier (tränings-policy
            oklar). Inga US-baserade analytics-tjänster (Google Analytics,
            Mixpanel, etc.).
          </p>
        </Section>

        <Section title="Hur datan används">
          <p>
            <strong>Endast för dig.</strong> Din data används för att generera
            samtals-svar och spegling till dig. Inte för marknadsföring,
            profilering åt tredje part, eller försäljning.
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <strong>Spegling</strong>: din data + dina ord skickas till LLM
              med strikt prompt-disciplin (observation, ej coach). Käll-
              attribuering valideras på varje output via{' '}
              <code className="text-sm bg-neutral-100 dark:bg-neutral-900 px-1 rounded">
                consumer-lock-validate
              </code>
              .
            </li>
            <li>
              <strong>Fact-extraction</strong>: efter varje samtals-turn
              körs en LLM-anrop som extraherar 0-N strukturerade fakta
              (Mistral json_schema-mode). Sparas i conversation_facts-tabell.
              Du ser dem i minne-vyn och kan radera när du vill.
            </li>
            <li>
              <strong>Cross-subject-aggregation</strong>: ej aktiverad i v1.
              Om aktiverad senare kommer du explicit ge consent.
            </li>
          </ul>
        </Section>

        <Section title="EU AI Act-compliance">
          <p>
            Selvra är byggd för efterlevnad av EU AI Act från grunden:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <strong>Artikel 5(1)(a)</strong> — förbud mot manipulativa
              AI-system. Implementerat som 11 forbidden patterns enforced
              i koden (love bombing, FOMO, prediktion, diagnos, m.fl.).
              Validering körs server-side innan output når dig.
            </li>
            <li>
              <strong>Artikel 26(2)</strong> — transparens om AI. Varje
              data-claim käll-attribuerad inline.
            </li>
            <li>
              <strong>Artikel 50</strong> — disclosure att du interagerar
              med AI. Tydligt i app-namn, landing-copy och samtals-inledning.
            </li>
            <li>
              <strong>Artikel 11(2)</strong> — data-styrning. Implementerat
              via SREF v1 export + patient-ägd portabilitet.
            </li>
          </ul>
        </Section>

        <Section title="Dina rättigheter (GDPR)">
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <strong>Tillgång (Art. 15)</strong>: alla dina facts, samtal,
              källor visas i appens minne-vy. Inget gömt.
            </li>
            <li>
              <strong>Rättelse (Art. 16)</strong>: explicita minnen kan
              redigeras direkt. Facts från samtal kan raderas och om-extraheras
              vid nästa relevanta turn.
            </li>
            <li>
              <strong>Radering (Art. 17)</strong>: account-delete cascade:ar
              alla relaterade tabeller. 30-dagars retention-fönster med
              restore-möjlighet. Hard-delete efter fönstret.
            </li>
            <li>
              <strong>Portabilitet (Art. 20)</strong>: SREF v1 är öppen
              specifikation — komplett JSON-export. Du kan importera till
              annan kompatibel framtida tjänst.
            </li>
            <li>
              <strong>Återkalla källor</strong>: OAuth-kopplingar kan kopplas
              bort via app-inställningar. Tidigare hämtad data kan raderas
              på begäran.
            </li>
            <li>
              <strong>Invändning (Art. 21)</strong>: skicka mail till{' '}
              <a
                href="mailto:hello@selvra.ai"
                className="underline underline-offset-2"
              >
                hello@selvra.ai
              </a>
              .
            </li>
            <li>
              <strong>Klagomål</strong>: till Integritetsskyddsmyndigheten
              (IMY) på <a href="https://imy.se" className="underline underline-offset-2">imy.se</a>.
            </li>
          </ul>
        </Section>

        <Section title="Säkerhets-headers + lagring">
          <p>HTTP-säkerhetsåtgärder:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <strong>Strict-Transport-Security</strong> 1 år + includeSubDomains
              — endast HTTPS
            </li>
            <li>
              <strong>X-Frame-Options DENY</strong> — anti-clickjacking
            </li>
            <li>
              <strong>Content-Security-Policy</strong> — restrektiv allowlist
              (sentry.io, mistral.ai, railway.app)
            </li>
            <li>
              <strong>Permissions-Policy</strong> — kamera/mikrofon/geo
              blockerade by default
            </li>
            <li>
              <strong>iOS Keychain</strong> — JWT-token lagras i Keychain
              (encrypted-at-rest, ej cloud-sync)
            </li>
            <li>
              <strong>DB encryption-at-rest</strong> — PostgreSQL via
              Railway, encryption tillhandahållen av Hetzner-infrastruktur
            </li>
          </ul>
        </Section>

        <Section title="Cookies (endast webb-yta)">
          <p>
            iOS-appen använder inga cookies — JWT-token i Keychain. Webb-
            ytan (denna sida + login) använder:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <strong>Session-cookie</strong> (Auth.js) — magic-link-sessioner.
              HttpOnly, Secure, SameSite=Lax. Signerat session-token, inte
              din data.
            </li>
            <li>
              <strong>OAuth-state-cookies</strong> — temporära (10 min) för
              CSRF-skydd vid OAuth-koppling.
            </li>
          </ul>
          <p>
            Inga analytics-cookies. Inga reklam-cookies. Inga tredjeparts-
            spårare.
          </p>
        </Section>

        <Section title="Förändringar">
          <p>
            När denna policy uppdateras dokumenteras ändringarna med datum.
            Större förändringar (ny sub-processor, breddat data-collection,
            ändrade rättigheter) meddelas via in-app-notis och mail till
            aktiva användare.
          </p>
        </Section>

        <Section title="Kontakt">
          <p>
            Frågor:{' '}
            <a
              href="mailto:hello@selvra.ai"
              className="underline underline-offset-2"
            >
              hello@selvra.ai
            </a>
            . Företaget bakom Selvra anges här när AB är formellt registrerat.
          </p>
        </Section>

        <p className="border-t border-neutral-200 dark:border-neutral-800 pt-6 text-sm text-neutral-500 dark:text-neutral-500 italic">
          Pre-launch utkast. Formell DPIA + dataskyddsombud + AB-formaliering
          tillkommer innan publik release.
        </p>
      </article>
    </main>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-medium tracking-tight">{title}</h2>
      <div className="text-base leading-relaxed text-neutral-700 dark:text-neutral-300 flex flex-col gap-3">
        {children}
      </div>
    </section>
  )
}
