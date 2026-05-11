import Link from 'next/link'

type SearchParams = Promise<{ saved?: string; athlete?: string; error?: string }>

/**
 * Onboarding Steg 4 — Källor. Per DESIGN.md §5.
 *
 * v0-scaffold: listar tillgängliga källor med koppla-knapp. Strava är första
 * implementerade. Övriga (Google Calendar/Gmail, Spotify, Open Wearables,
 * AI-konversation-import) listas men är inaktiva placeholder tills slice för
 * varje är klar.
 */

const SOURCES: Array<{
  id: string
  label: string
  description: string
  status: 'live' | 'pending' | 'planned'
  href?: string
}> = [
  {
    id: 'strava',
    label: 'Strava',
    description: 'Aktiviteter och träningspass.',
    status: 'live',
    href: '/api/oauth/strava/init',
  },
  {
    id: 'google',
    label: 'Google (Calendar + Gmail-metadata)',
    description: 'Planerad tid (möten, händelser) + uppmärksamhet via mail-headers. Aldrig mail-innehåll.',
    status: 'live',
    href: '/api/oauth/google/init',
  },
  {
    id: 'spotify',
    label: 'Spotify',
    description: 'Vad du lyssnar på, när.',
    status: 'pending',
  },
  {
    id: 'open_wearables',
    label: 'Open Wearables',
    description: 'Garmin, Whoop, Oura — när du har Developer-access.',
    status: 'planned',
  },
  {
    id: 'ai_conversation',
    label: 'AI-konversation-import',
    description: 'ChatGPT/Claude/Gemini-export. Selektiv import.',
    status: 'planned',
  },
]

export default async function SourcesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const flash = formatFlash(params)

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="max-w-prose w-full flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-medium tracking-tight">Källor</h1>
          <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
            Vad du redan använder. Toggla det du vill ha reflekterat. Selvra
            läser där du finns — du gör inget extra arbete för det.
          </p>
        </header>

        {flash && (
          <div
            className={
              flash.kind === 'success'
                ? 'rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'
                : 'rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200'
            }
          >
            {flash.message}
          </div>
        )}

        <ul className="flex flex-col gap-3">
          {SOURCES.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-4 rounded-md border border-neutral-200 dark:border-neutral-800 px-4 py-3"
            >
              <div className="flex flex-col">
                <h2 className="text-base font-medium">{s.label}</h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {s.description}
                </p>
              </div>
              <div>
                {s.status === 'live' && s.href ? (
                  <Link
                    href={s.href}
                    className="inline-flex h-9 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 px-4 text-sm font-medium hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
                  >
                    Koppla
                  </Link>
                ) : s.status === 'pending' ? (
                  <span className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-500">
                    Snart
                  </span>
                ) : (
                  <span className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-500">
                    Planerad
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>

        <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-500">
          Du kan ändra eller koppla bort senare. Selvra läser ingenting du inte
          aktivt sagt ja till.
        </p>

        <div className="pt-2">
          <Link
            href="/onboarding/signal"
            className="inline-flex h-12 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 px-8 text-base font-medium hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
          >
            Fortsätt
          </Link>
        </div>
      </article>
    </main>
  )
}

function formatFlash(params: {
  saved?: string
  athlete?: string
  error?: string
}): { kind: 'success' | 'error'; message: string } | null {
  if (params.error === 'strava_not_configured') {
    return {
      kind: 'error',
      message:
        'Strava är inte aktiverad än. OAuth-app:en registreras under bolagets ' +
        'namn när AB är godkänt (~2-3 veckor). Tills dess är knappen ett ' +
        'scaffold-skal.',
    }
  }
  if (params.error === 'google_not_configured') {
    return {
      kind: 'error',
      message:
        'Google är inte aktiverad än. OAuth-app:en registreras under bolagets ' +
        'namn när AB är godkänt (~2-3 veckor). Tills dess är knappen ett ' +
        'scaffold-skal.',
    }
  }
  if (params.saved === 'google') {
    return {
      kind: 'success',
      message:
        'Google kopplad. Tokens loggade till server-konsol — kopiera till .env ' +
        'manuellt (DB-storage kommer post-AB).',
    }
  }
  if (params.error) {
    return {
      kind: 'error',
      message: `Koppling misslyckades: ${params.error}.`,
    }
  }
  if (params.saved === 'strava') {
    const athleteHint = params.athlete ? ` (athlete ${params.athlete})` : ''
    return {
      kind: 'success',
      message:
        `Strava kopplad${athleteHint}. ` +
        'Carls .env behöver uppdateras manuellt med tokens — se server-log för värden. ' +
        '(DB-baserad token-storage kommer när Magic-link är wired.)',
    }
  }
  return null
}
