import { approveConsent, denyConsent } from '@/app/oauth/authorize/actions'

/**
 * Consent-screen per SELVRA_AUTH_STANDARD_2026-05-17.md.
 *
 * Server Component — renderar utan client-state. Hidden inputs binder
 * authorize-request-params till Server Actions så approve/deny vet vad
 * de ska göra.
 *
 * Ton per AGENTS.md: declarativ, källa-attribuerad. Inga coach-fraser.
 * Klient-namn visas verbatim från DCR-registreringen (vad LLM-klienten
 * själv deklarerade — användaren ser sanningen).
 */

export function ConsentScreen({
  clientName,
  clientId,
  redirectUri,
  scope,
  state,
  codeChallenge,
  codeChallengeMethod,
}: {
  clientName: string
  clientId: string
  redirectUri: string
  scope: string
  state: string | undefined
  codeChallenge: string
  codeChallengeMethod: string
}) {
  const scopes = scope.split(/\s+/).filter(Boolean)
  const allowsRead = scopes.includes('read')
  const allowsWrite = scopes.includes('write')

  return (
    <main className="flex flex-1 flex-col px-6 py-12 sm:px-8 sm:py-16">
      <article className="w-full max-w-[60ch] mx-auto flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <h1
            className="font-serif font-normal tracking-tight"
            style={{
              fontSize: 'clamp(28px, 4vw + 0.5rem, 42px)',
              lineHeight: 1.15,
              color: 'var(--color-ink)',
            }}
          >
            {clientName} vill ansluta till din Selvra
          </h1>
        </header>

        <section className="flex flex-col gap-3 text-base leading-relaxed">
          <p style={{ color: 'var(--color-ink)' }}>
            Den får läsa:
          </p>
          <ul
            className="list-disc list-inside pl-4 flex flex-col gap-1"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            {allowsRead && (
              <>
                <li>Din representation (snapshot, provenance)</li>
                <li>Dina dokumenterade divergenser</li>
              </>
            )}
            {allowsWrite && <li>Skriva förslag till din representation</li>}
          </ul>

          <p className="mt-4" style={{ color: 'var(--color-ink)' }}>
            Den får inte:
          </p>
          <ul
            className="list-disc list-inside pl-4 flex flex-col gap-1"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            {!allowsWrite && <li>Skriva till din representation</li>}
            <li>Se andra användare</li>
            <li>Behålla data efter att du återkallat åtkomst</li>
          </ul>
        </section>

        <section
          className="text-sm leading-relaxed border-t pt-6"
          style={{
            borderColor: 'var(--color-ink-faint)',
            color: 'var(--color-ink-soft)',
          }}
        >
          <p>
            Token gäller i 30 dagar. Återkalla när som helst i
            <a
              href="/connections"
              className="underline ml-1"
              style={{ color: 'var(--color-ink)' }}
            >
              Inställningar → Anslutningar
            </a>
            .
          </p>
          <p className="mt-2 font-mono text-xs">
            client_id: {clientId}
          </p>
        </section>

        <section className="flex flex-col sm:flex-row gap-3 mt-2">
          <form action={approveConsent} className="flex-1">
            <input type="hidden" name="client_id" value={clientId} />
            <input type="hidden" name="redirect_uri" value={redirectUri} />
            <input type="hidden" name="scope" value={scope} />
            <input type="hidden" name="code_challenge" value={codeChallenge} />
            <input
              type="hidden"
              name="code_challenge_method"
              value={codeChallengeMethod}
            />
            {state && (
              <input type="hidden" name="state" value={state} />
            )}
            <button
              type="submit"
              className="w-full px-6 py-3 rounded-md font-medium text-base transition-opacity hover:opacity-90"
              style={{
                backgroundColor: 'var(--color-ink)',
                color: 'var(--color-paper)',
              }}
            >
              Godkänn
            </button>
          </form>

          <form action={denyConsent} className="flex-1">
            <input type="hidden" name="redirect_uri" value={redirectUri} />
            {state && (
              <input type="hidden" name="state" value={state} />
            )}
            <button
              type="submit"
              className="w-full px-6 py-3 rounded-md font-medium text-base border transition-opacity hover:opacity-70"
              style={{
                borderColor: 'var(--color-ink)',
                color: 'var(--color-ink)',
              }}
            >
              Avbryt
            </button>
          </form>
        </section>
      </article>
    </main>
  )
}
