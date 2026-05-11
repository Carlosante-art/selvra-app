import { signIn } from '@/lib/auth/config'

/**
 * Magic-link login. Form postar till en Server Action som kallar Auth.js
 * signIn("resend", { email }). Resend-providern skickar mail med länk
 * tillbaka till /api/auth/callback/resend?token=...
 *
 * Wiring-status: scaffold klart, väntar på RESEND_API_KEY + DATABASE_URL
 * + AUTH_SECRET (AB-deferred per APPLICATIONS_PENDING_AB-doc). Tills
 * dessa env-vars finns visar sidan "inte aktiverad än"-state istället
 * för formuläret.
 */

function isMagicLinkConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL &&
      process.env.RESEND_API_KEY &&
      process.env.AUTH_SECRET,
  )
}

async function startSignIn(formData: FormData) {
  'use server'
  const email = formData.get('email')
  if (typeof email !== 'string' || email.trim().length === 0) return
  await signIn('resend', {
    email: email.trim(),
    redirectTo: '/onboarding/intentions',
  })
}

export default function LoginPage() {
  if (!isMagicLinkConfigured()) {
    return <NotConfiguredView />
  }
  return <LoginForm />
}

function NotConfiguredView() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-24 sm:py-32">
      <article className="max-w-prose w-full flex flex-col gap-6">
        <header>
          <h1 className="text-3xl font-medium tracking-tight">
            Inloggning aktiveras snart
          </h1>
        </header>

        <p className="text-lg leading-relaxed">
          Magic-link-inloggning är scaffold:ad men inte aktiverad än.
          Mail-providern (Resend) registreras under bolagets namn när
          AB:t är godkänt — cirka 2-3 veckor.
        </p>

        <p className="leading-relaxed text-neutral-600 dark:text-neutral-400">
          Under tiden körs Selvra för dogfood-användning av Carl direkt
          (hardcoded subject). När inloggning aktiveras kan vi bjuda
          in fler.
        </p>
      </article>
    </main>
  )
}

function LoginForm() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-24 sm:py-32">
      <article className="max-w-prose w-full flex flex-col gap-8">
        <header>
          <h1 className="text-3xl font-medium tracking-tight">Logga in</h1>
        </header>

        <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
          Skriv din e-post. Vi mejlar en länk tillbaka till dig. Ingen
          lösenord — bara en länk att klicka.
        </p>

        <form action={startSignIn} className="flex flex-col gap-4">
          <label htmlFor="email" className="sr-only">
            E-post
          </label>
          <input
            id="email"
            type="email"
            name="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="du@example.com"
            className="w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus:border-neutral-300"
          />
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 px-8 text-base font-medium hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
          >
            Skicka länk
          </button>
        </form>

        <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-500">
          Länken är giltig i 24 timmar. Inget annat sparas än din e-post
          tills du klickar.
        </p>
      </article>
    </main>
  )
}
