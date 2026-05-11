import Link from 'next/link'

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
            Selvra är byggt så du äger din representation. Det här är data-flödet
            som faktiskt sker — inte juridisk text, utan tekniskt-ärlig beskrivning
            av vad som hamnar var.
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            Senast uppdaterad: 2026-05-11. Pre-launch utkast. Juridisk
            granskning innan publik release.
          </p>
        </header>

        <Section title="Vad Selvra samlar">
          <p>
            Endast det du aktivt skriver eller toggar på:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <strong>Intentioner</strong> du deklarerar i onboarding-flödet eller
              senare (texten, tidsstämpel, leverans-rytm-val).
            </li>
            <li>
              <strong>Tankar</strong> du skriver via tanke-input-ytan (texten,
              tidsstämpel).
            </li>
            <li>
              <strong>Källor</strong> du explicit kopplar (OAuth-tokens, källornas
              data — t.ex. Garmin-aktiviteter, Calendar-events). Aldrig mail-innehåll
              för Gmail (bara metadata via gmail.metadata-scope).
            </li>
            <li>
              <strong>E-postadress</strong> för Magic-link-inloggning.
            </li>
          </ul>
          <p>
            Selvra-protokollet processar denna data och härleder:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <strong>Reflektioner</strong> (veckovis brev som speglar mönster mellan
              vad du säger att du vill, vad du säger att du gör, och vad datan visar).
            </li>
            <li>
              <strong>Bakgrunds-observationer</strong> (Dreamer-output — mönster systemet
              hittar autonomt via random-walk över dina events).
            </li>
          </ul>
          <p>
            All härledd data lagras med tydlig provenance: du kan spåra vilket
            event som ledde till vilken observation.
          </p>
        </Section>

        <Section title="Var datan lagras">
          <p>
            <strong>EU-deployed.</strong> Selvra-protokollet och selvra-appen körs
            på Railway-infrastruktur i EU-region (Frankfurt). Inget tredjepartsföretag
            utanför EU har permanent kopia av din data.
          </p>
          <p>
            Specifika tjänster i flödet:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <strong>Railway</strong> (EU-region) — hostar selvra-protokollet,
              selvra-appen, databaser.
            </li>
            <li>
              <strong>Supabase</strong> (för Stillra-integration när relevant) —
              EU-region, separat tenant per användare.
            </li>
            <li>
              <strong>Resend</strong> (USA) — endast transactional mail (Magic-link).
              Mail-innehåll sparas inte av oss; Resend håller logs enligt deras policy.
            </li>
            <li>
              <strong>Anthropic, OpenAI, Together</strong> — LLM-leverantörer för
              reflektion-generering. Input skickas till leverantörens API; vi använder
              router som väljer billigast tillräcklig leverantör. Leverantörers data-
              retention varierar (Anthropic: 30 dagar abuse-detection, OpenAI: configurable
              opt-out). Vi tränar inte modeller på din data.
            </li>
          </ul>
        </Section>

        <Section title="Hur datan används">
          <p>
            <strong>Endast för dig.</strong> Din data används för att generera
            reflektioner till dig, inte för marknadsföring, profilering åt tredje
            part, eller försäljning.
          </p>
          <p>
            Specifik användning:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              Reflektions-generering: din data + intentioner + tankar skickas till
              LLM med strikt prompt-disciplin (observation, ej coach). Output är ditt.
            </li>
            <li>
              Dreamer-pass: random-walk över dina events för att hitta mönster.
              Output är bakgrunds-observationer du ser på /traces.
            </li>
            <li>
              Cross-subject-aggregation: ej aktiverad i v1. Om aktiverad senare
              kommer du explicit ge consent.
            </li>
          </ul>
        </Section>

        <Section title="Dina rättigheter">
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <strong>Export</strong>: hela din representation kan exporteras som SREF
              v1 (kryptografiskt signerad JSON) eller som AI-context-text. Se{' '}
              <Link
                href="/export"
                className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                /export
              </Link>
              .
            </li>
            <li>
              <strong>Insyn</strong>: alla events som finns om dig kan listas via API
              eller ses i selvra-appens UI (intentioner, tankar, reflektioner,
              bakgrunds-observationer).
            </li>
            <li>
              <strong>Radering + ångerrätt</strong>: soft-delete är
              implementerad — vid radering markeras ditt subject via en
              append-only deletion-event, och alla läs- och skrivpaths
              returnerar 410 Gone. Inom 30 dagar kan du ångra via{' '}
              <Link
                href="/account"
                className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                /account
              </Link>{' '}
              — då skrivs en cancellation-event och kontot återställs.
              Hard-delete (faktisk event-radering ur DB) sker som batch-job
              efter 30-dagars-fönstret; under v1 körs det manuellt på
              begäran. SREF-export är fortfarande tillgänglig under hela
              fönstret så du hinner ta med dig din data.
            </li>
            <li>
              <strong>Portabilitet</strong>: SREF v1 är öppen specifikation — vilken
              kompatibel framtida tjänst som helst kan importera din representation.
              Du är inte inlåst.
            </li>
            <li>
              <strong>Återkalla källor</strong>: OAuth-kopplingar kan kopplas bort
              från /onboarding/sources. Tidigare hämtad data kan raderas på begäran
              (manuellt under v1; automatiserat senare).
            </li>
          </ul>
        </Section>

        <Section title="Cookies + lokal lagring">
          <p>
            Selvra använder följande cookies:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <strong>Session-cookie</strong> (Auth.js) — håller dig inloggad. HttpOnly,
              Secure, SameSite=Lax. Innehåller signerat session-token, inte din
              data.
            </li>
            <li>
              <strong>OAuth-state-cookies</strong> — temporära cookies (10 min)
              för CSRF-skydd vid OAuth-koppling. Raderas efter callback.
            </li>
          </ul>
          <p>
            Inga analytics-cookies. Inga reklam-cookies. Inga tredjeparts-spårare.
          </p>
        </Section>

        <Section title="Förändringar">
          <p>
            När denna policy uppdateras, dokumenteras ändringarna med datum.
            Större förändringar (t.ex. ny tredjepartstjänst i pipelinen) meddelas
            via mail till aktiva användare.
          </p>
        </Section>

        <Section title="Kontakt">
          <p>
            Frågor: skicka mail till företaget bakom Selvra (anges här när AB
            är registrerat). Tills dess: GitHub-issues på{' '}
            <a
              href="https://github.com/Carlosante-art/selvra-app/issues"
              className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              Carlosante-art/selvra-app
            </a>
            .
          </p>
        </Section>

        <p className="border-t border-neutral-200 dark:border-neutral-800 pt-6 text-sm text-neutral-500 dark:text-neutral-500 italic">
          Detta är pre-launch utkast. Juridisk policy med ansvariga personer +
          klagomål-myndighet (Integritetsskyddsmyndigheten) tillkommer innan
          publik release och AB-registrering är formaliserad.
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
