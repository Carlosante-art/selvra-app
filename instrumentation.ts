/**
 * Next.js instrumentation hook — kör innan första request.
 *
 * För Sentry: laddar rätt config-fil baserat på NEXT_RUNTIME (Node.js
 * eller Edge). Client-config laddas separat av Sentry-SDK:s webpack-
 * integration via withSentryConfig i next.config.ts.
 *
 * onRequestError exporteras så Sentry fångar oväntade fel i Server
 * Components, Route Handlers och Server Actions automatiskt.
 */

import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
