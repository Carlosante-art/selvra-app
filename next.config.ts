import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

/**
 * Säkerhets-headers (tillagda 2026-05-16 per fast-check-audit).
 *
 * Frame-Options: DENY skyddar mot click-jacking.
 * Content-Security-Policy: restriktiv. 'self' för scripts + Sentry-ingest
 *   för error-reporting (sentry.io subdomäner). Inline-style behövs av
 *   Next.js + Tailwind preview, så vi tillåter 'unsafe-inline' för style.
 * HSTS: HTTPS-only, 1 år, includeSubDomains.
 * Referrer-Policy: strict-origin-when-cross-origin (Next.js default men
 *   explicit för audit).
 * Permissions-Policy: stänger ner kamera/mic/geo by default.
 */
const SECURITY_HEADERS = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js + Sentry inline-bootstrap kräver 'unsafe-inline' för script.
      // 'unsafe-eval' undvikas — Next.js 16 fungerar utan.
      "script-src 'self' 'unsafe-inline' https://*.sentry.io",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self' https://*.sentry.io https://api.mistral.ai https://*.up.railway.app",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
    ]
  },
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
