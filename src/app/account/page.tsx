import Link from 'next/link'

import { DeleteSubmit } from '@/components/delete-submit'
import { TriggerButton } from '@/components/trigger-button'
import { deleteAccount, restoreAccount } from '@/lib/actions/account'
import { getSubjectLifecycle } from '@/lib/protocol/client'

export const metadata = {
  title: 'Konto — Selvra',
  description:
    'Hantera ditt Selvra-konto: exportera representationen, ångra deletion, eller markera kontot för radering.',
}

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{
  delete_error?: string
  restore_error?: string
  deleted?: string
  restored?: string
}>

export default async function AccountPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const lifecycle = await getSubjectLifecycle().catch(() => null)

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="max-w-prose w-full flex flex-col gap-10">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-medium tracking-tight">Konto</h1>
          <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
            Tre saker du kan göra härifrån: exportera din representation,
            ångra en pending deletion, eller markera kontot för radering.
          </p>
        </header>

        {params.deleted ? (
          <Notice variant="ok">
            {params.deleted === 'deletion_requested' ? (
              <>
                Kontot är markerat för deletion. Alla läs- och skrivpaths
                returnerar nu 410 Gone. Du har 30 dagar på dig att ångra
                via knappen nedan innan hard-delete kör.
              </>
            ) : (
              <>Kontot var redan markerat för deletion.</>
            )}
          </Notice>
        ) : null}
        {params.restored ? (
          <Notice variant="ok">
            Deletion ångrad. Read/write-paths fungerar igen direkt.
          </Notice>
        ) : null}
        {params.delete_error ? (
          <Notice variant="error">
            <strong>Deletion misslyckades:</strong> {params.delete_error}
          </Notice>
        ) : null}
        {params.restore_error ? (
          <Notice variant="error">
            <strong>Restore misslyckades:</strong> {params.restore_error}
          </Notice>
        ) : null}

        <Section title="Exportera din representation">
          <p>
            SREF v1-doc är portabel och (om signing-key är konfigurerad)
            HMAC-signerad. Du kan ta med den till valfri annan tjänst som
            stödjer SREF-formatet.
          </p>
          {lifecycle?.status === 'pending_deletion' ? (
            <p className="text-amber-700 dark:text-amber-400 text-sm">
              Kontot är markerat för deletion. Det här är sista chansen att
              exportera innan hard-delete kör (om ~
              {lifecycle.hard_delete_eligible_after_days} dagar).
            </p>
          ) : null}
          <Link
            href="/export"
            className="inline-flex h-10 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 px-5 text-sm font-medium hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors self-start"
          >
            Gå till export
          </Link>
        </Section>

        {lifecycle?.status === 'pending_deletion' ? (
          <Section title="Ångra deletion">
            <p>
              Kontot är markerat för deletion sedan{' '}
              {lifecycle.deletion_requested_at
                ? new Date(lifecycle.deletion_requested_at).toLocaleString(
                    'sv-SE',
                  )
                : 'tidigare'}
              . Du kan ångra detta inom 30-dagars-fönstret. Efter att hard-
              delete-batchen har kört är ångring inte längre möjlig — då är
              event-loggen borta.
            </p>
            <form action={restoreAccount}>
              <TriggerButton label="Ångra deletion" pendingLabel="Ångrar…" />
            </form>
          </Section>
        ) : null}

        <Section title={lifecycle?.status === 'pending_deletion' ? 'Status' : 'Radera kontot'}>
          {lifecycle?.status === 'pending_deletion' ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Kontot är markerat för deletion. Hard-delete sker via batch-job
              efter 30-dagars-fönstret. Tills dess är din event-historik
              bevarad (för ångerrätt) men inte åtkomlig.
            </p>
          ) : (
            <>
              <p>
                Radering är en append-only operation: en deletion-event skrivs
                till event-loggen, och alla läs- och skrivpaths börjar
                returnera 410 Gone direkt. Inom 30 dagar kan du ångra. Efter
                30 dagar kör batch-jobbet hard-delete och din event-historik
                är borta — vi behåller bara tombstone-raden för audit.
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                För att aktivera knappen — skriv <code className="rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 text-xs">RADERA</code>{' '}
                i fältet nedan exakt.
              </p>
              <form action={deleteAccount} className="flex flex-col gap-3 mt-1">
                <input
                  type="text"
                  name="confirm"
                  placeholder="Skriv RADERA"
                  required
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                />
                <DeleteSubmit />
              </form>
            </>
          )}
        </Section>
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

function Notice({
  variant,
  children,
}: {
  variant: 'ok' | 'error'
  children: React.ReactNode
}) {
  const styles =
    variant === 'ok'
      ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-900'
      : 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-900'
  return (
    <div className={`rounded-md border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  )
}
