/**
 * MailProvider — abstraktion för transactional-mail (just magic-links för v1).
 *
 * Skälet att abstrahera bort direkt Resend-koppling: Resend är US-baserat
 * (deras EU-region "kommer H2 2026"). EU-suveränitet-audit 2026-05-16
 * identifierade detta som hög-risk-gap. När Carl väljer EU-leverantör
 * (Postmark EU, Mailgun EU, eller annat) byts implementationen via
 * MAIL_PROVIDER env-var — Auth.js-config rörs inte.
 *
 * Scope: just sendMagicLink för nu. Om vi senare lägger annan typ av mail
 * (subscription-receipt, etc.) växer interfacet då — inte preventivt.
 */

export type SendMagicLinkInput = {
  to: string
  magicLink: string
  from: string
}

export interface MailProvider {
  /** Identifierar provider för logging/Sentry-tags. */
  readonly providerName: string

  /**
   * Skicka magic-link-mail. Throw vid fel — caller (Auth.js) loggar och
   * visar error-screen för användaren. Auth.js retry:ar inte själv, så
   * provider bör vara konservativ med timeouts (max 5s).
   */
  sendMagicLink(input: SendMagicLinkInput): Promise<void>
}
