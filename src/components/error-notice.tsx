/**
 * Standardiserad error/info/ok-notice för selvra-app. Ersätter ad-hoc
 * `<div className="rounded-md border ...">`-block som vuxit organiskt
 * över flera sidor.
 *
 * Design-justification: nuvarande visuella behandling (rounded-md border
 * boxes) ligger i SaaS-tradition snarare än editorial — det är flaggat
 * i DESIGN_AUDIT_2026-05-11.md som CCV-6. När mood-board landar bör
 * denna komponent uppdateras till editorial-form (margin-left-bar +
 * kursiv-text utan box). Tills dess: konsolidera ad-hoc-pattern hit så
 * vi har EN att uppdatera, inte tio.
 */

type Variant = 'ok' | 'error' | 'warning' | 'info'

const STYLES: Record<Variant, string> = {
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200',
  error: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200',
  warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200',
  info: 'border-neutral-200 bg-neutral-50 text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100',
}

export function ErrorNotice({
  variant = 'error',
  title,
  children,
  className,
}: {
  variant?: Variant
  title?: string
  children: React.ReactNode
  className?: string
}) {
  const base =
    'rounded-md border px-4 py-3 text-sm leading-relaxed'
  return (
    <div
      role={variant === 'error' || variant === 'warning' ? 'alert' : undefined}
      className={[base, STYLES[variant], className ?? ''].join(' ').trim()}
    >
      {title ? <p className="font-medium mb-1">{title}</p> : null}
      <div>{children}</div>
    </div>
  )
}
