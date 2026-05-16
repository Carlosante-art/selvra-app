/**
 * Mail-provider factory. Väljer implementation baserat på MAIL_PROVIDER
 * env-var (default 'resend' för bakåt-kompatibilitet).
 *
 * Lägga till ny provider:
 *   1. Skapa src/lib/mail/<name>.ts som implementerar MailProvider
 *   2. Lägg case i switch nedan
 *   3. Dokumentera env-vars i .env.example
 *   4. Audit-update i .gsd/EU_HOSTING_VERIFICATION_*.md
 *
 * Singleton-mönster: instansieras lazy vid första anrop, cached därefter.
 * Auth.js anropar sendVerificationRequest per inloggning, så vi vill inte
 * skapa nya HTTP-clients för varje request.
 */

import 'server-only'

import { ResendMailProvider } from './resend'
import type { MailProvider } from './types'

export type { MailProvider, SendMagicLinkInput } from './types'

let cached: MailProvider | null = null

export function getMailProvider(): MailProvider {
  if (cached) return cached

  const providerName = (process.env.MAIL_PROVIDER ?? 'resend').toLowerCase()

  switch (providerName) {
    case 'resend': {
      const apiKey = process.env.RESEND_API_KEY ?? ''
      cached = new ResendMailProvider(apiKey)
      return cached
    }
    case 'postmark':
    case 'mailgun': {
      // EU-leverantörs-stubs. Lägg implementation när Carl valt + signat
      // DPA + fått API-keys. Kasta tydligt fel så det inte tyst går till
      // fallback eller silent-fail i prod.
      throw new Error(
        `MAIL_PROVIDER='${providerName}' är inte implementerad än. ` +
          `Bygg src/lib/mail/${providerName}.ts som implementerar MailProvider, ` +
          `lägg case i src/lib/mail/index.ts. Audit-spec: ` +
          `.gsd/EU_HOSTING_VERIFICATION_2026-05-16.md §6.`,
      )
    }
    default: {
      throw new Error(
        `MAIL_PROVIDER='${providerName}' okänt. Giltiga: resend, postmark, mailgun.`,
      )
    }
  }
}

/** Test-only: clear cache. Aldrig anropa i runtime-kod. */
export function __resetMailProviderForTesting(): void {
  cached = null
}
