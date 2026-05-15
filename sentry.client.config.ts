/**
 * Sentry client-side init. Browser-bundle.
 *
 * DSN saknas → Sentry är no-op. Lokal dev + pre-release kan lämna blank.
 * Sätt via .env.local (dev) + Vercel project-settings (prod) som
 * NEXT_PUBLIC_SENTRY_DSN (klient-prefixet krävs för browser-bundle).
 *
 * EU-region: när Sentry-organisationen är på eu.sentry.io, ingen extra
 * konfig behövs — DSN-URL:en hanterar det. Säkerställ att Sentry-konto
 * är "EU storage region" i org-settings.
 *
 * beforeSend scrubbar PII innan något lämnar enheten — defense in depth
 * med samma scrubber som lib/observability/scrub.ts (logger redan
 * skrubbar, men Sentry kan fånga unhandled exceptions med rådata).
 */

import * as Sentry from '@sentry/nextjs'

import { scrubObject } from '@/lib/observability/scrub'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',
    sendDefaultPii: false,
    beforeSend: (event) => {
      // Strip user-fält till bara id (för gruppering)
      if (event.user) {
        event.user = { id: event.user.id }
      }
      // Scrubba extra/contexts/breadcrumbs/request.data via befintlig helper
      if (event.extra) event.extra = scrubObject(event.extra)
      if (event.contexts) event.contexts = scrubObject(event.contexts)
      if (Array.isArray(event.breadcrumbs)) {
        event.breadcrumbs = event.breadcrumbs.map((b) => scrubObject(b))
      }
      if (event.request?.data !== undefined) {
        event.request.data = '[redacted]'
      }
      return event
    },
    beforeBreadcrumb: (breadcrumb) => scrubObject(breadcrumb),
  })
}
