/**
 * ResendMailProvider — HTTP-call till Resend's send-API.
 *
 * Identisk request-shape som Auth.js's interna Resend-provider
 * (node_modules/@auth/core/src/providers/resend.ts) så swap är drop-in.
 * Använder native fetch — ingen Resend-SDK-dependency.
 *
 * Säkerhet: API-key läses från env vid construct-tid, inte per-call, så
 * den inte exponeras via reflection eller serialization av provider-instansen.
 *
 * EU-suveränitet-noter (audit 2026-05-16): Resend är US-baserat. Dataflöde
 * vid magic-link-utskick:
 *   1. selvra-app (Frankfurt) → Resend API (US-edge)
 *   2. Resend → SMTP → user's email-provider
 *
 * Email-innehåll: user-email (PII) + magic-link-URL (innehåller token).
 * Token är short-lived (24h default per Auth.js). Inget annat PII-content
 * passerar leverantören.
 */

import type { MailProvider, SendMagicLinkInput } from './types'

const RESEND_API_URL = 'https://api.resend.com/emails'

export class ResendMailProvider implements MailProvider {
  readonly providerName = 'resend'

  constructor(private readonly apiKey: string) {
    if (!apiKey || apiKey.length === 0) {
      throw new Error('ResendMailProvider: RESEND_API_KEY env-var saknas')
    }
  }

  async sendMagicLink(input: SendMagicLinkInput): Promise<void> {
    const { to, magicLink, from } = input
    const { host } = new URL(magicLink)

    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject: `Logga in på ${host}`,
        html: renderHtml({ magicLink, host }),
        text: renderText({ magicLink, host }),
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(
        `Resend send failed: HTTP ${res.status} ${res.statusText}. ${body.slice(0, 200)}`,
      )
    }
  }
}

// Plain-svenska email — matchar Selvras tone (declarativ, ingen marknadsföring).
function renderHtml({ magicLink, host }: { magicLink: string; host: string }): string {
  return `<body style="background:#fafafa;font-family:Helvetica,Arial,sans-serif;padding:40px 20px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;padding:32px;border-radius:8px;">
    <h1 style="font-size:20px;font-weight:500;color:#111;margin:0 0 16px;">Logga in på ${host}</h1>
    <p style="font-size:14px;line-height:1.5;color:#333;margin:0 0 24px;">
      Klicka på länken nedan för att logga in. Länken är giltig i 24 timmar.
    </p>
    <a href="${magicLink}" style="display:inline-block;background:#111;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;font-size:14px;">Logga in</a>
    <p style="font-size:12px;color:#666;margin:24px 0 0;">
      Om du inte begärde detta — ignorera mailet.
    </p>
  </div>
</body>`
}

function renderText({ magicLink, host }: { magicLink: string; host: string }): string {
  return `Logga in på ${host}

Klicka på länken nedan för att logga in. Länken är giltig i 24 timmar.

${magicLink}

Om du inte begärde detta — ignorera mailet.`
}
