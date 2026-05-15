/**
 * Sentry edge-runtime init. Middleware och Edge Functions.
 *
 * Samma scrubbing-strategi som server-config. Edge har begränsad runtime
 * (V8 isolates) — Sentry-SDK fungerar men vissa Node-API:er saknas.
 */

import * as Sentry from '@sentry/nextjs'

import { scrubObject } from '@/lib/observability/scrub'

const dsn = process.env.SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.VERCEL_ENV ?? 'development',
    sendDefaultPii: false,
    beforeSend: (event) => {
      if (event.user) {
        event.user = { id: event.user.id }
      }
      if (event.extra) event.extra = scrubObject(event.extra)
      if (event.contexts) event.contexts = scrubObject(event.contexts)
      if (Array.isArray(event.breadcrumbs)) {
        event.breadcrumbs = event.breadcrumbs.map((b) => scrubObject(b))
      }
      return event
    },
    beforeBreadcrumb: (breadcrumb) => scrubObject(breadcrumb),
  })
}
