import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  /* config options here */
}

// Sentry webpack-integration: bundle får source-maps som uppladdas till
// Sentry så stack-traces blir läsbara. Behövs bara om SENTRY_AUTH_TOKEN
// finns — annars wraps:as next-config utan upload.
export default withSentryConfig(nextConfig, {
  silent: !process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: {
    // Source-maps döljs från klient-bundle (säkerhet) — Sentry-symbolik
    // använder dem internt utan att exponera dem.
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  disableLogger: true,
})
