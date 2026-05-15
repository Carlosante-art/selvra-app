/**
 * Sentry server-side init. Node.js-runtime (Server Components, Server
 * Actions, Route Handlers).
 *
 * Använder SENTRY_DSN (utan NEXT_PUBLIC) — server-only, inte exponerad i
 * browser-bundle.
 *
 * Scrubbing-strategi: server-side har redan auto-scrub via logger.emit()
 * (lib/logging/index.ts), så de flesta meta-värden är redan rena innan
 * de når Sentry via breadcrumbs. beforeSend här är defense in depth för
 * unhandled exceptions som inte gick genom loggern.
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
      if (event.request?.data !== undefined) {
        event.request.data = '[redacted]'
      }
      return event
    },
    beforeBreadcrumb: (breadcrumb) => scrubObject(breadcrumb),
  })
}
