import 'server-only'

import { DrizzleAdapter } from '@auth/drizzle-adapter'
import NextAuth from 'next-auth'
import Resend from 'next-auth/providers/resend'

import { db } from '@/lib/db'
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from '@/lib/db/schema'
import { ensureSelvraIdentity } from '@/lib/identity/ensure'
import { getMailProvider } from '@/lib/mail'

/**
 * Auth.js v5 (NextAuth.js) konfiguration för selvra-app:s magic-link-auth.
 *
 * - Adapter: Drizzle mot Railway Postgres
 * - Provider: Resend-skal som routar genom getMailProvider()-abstraktion.
 *   sendVerificationRequest-override gör att vi kan byta mail-backend
 *   (Resend → Postmark EU → Mailgun EU → ...) via MAIL_PROVIDER env-var
 *   utan att röra Auth.js-config eller koppla in/ut providers. Audit
 *   2026-05-16 (EU-suveränitet).
 * - Strategy: database sessions (server-renderade pages kan await:a sessionen)
 *
 * Selvra-protokoll-linkage (selvraSubjectId/selvraTenantId i users-tabellen)
 * sätts vid första-login via `events.signIn` → `ensureSelvraIdentity()`.
 * Idempotent — om columns redan är satta är det no-op.
 *
 * Per-user-tenant-model (lockad 2026-05-12): varje user provisioneras
 * sin egen tenant i Selvra-protokollet så RLS isolerar defense-in-depth.
 */

const MAIL_FROM = process.env.MAIL_FROM ?? 'onboarding@resend.dev'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Resend({
      from: MAIL_FROM,
      // apiKey behålls eftersom Auth.js's Resend-provider validerar närvaro
      // vid config-tid. När MAIL_PROVIDER != 'resend' används den inte —
      // sendVerificationRequest tar över hela send-pathen.
      apiKey: process.env.RESEND_API_KEY ?? 'unused-when-mail-provider-not-resend',
      async sendVerificationRequest({ identifier, url }) {
        await getMailProvider().sendMagicLink({
          to: identifier,
          magicLink: url,
          from: MAIL_FROM,
        })
      },
    }),
  ],
  session: { strategy: 'database' },
  pages: {
    signIn: '/login',
    verifyRequest: '/login/check-email',
  },
  events: {
    /**
     * Provisionera Selvra-tenant + derivera subject_id första gången
     * en user signar in. Idempotent — efterföljande sign-ins är no-op.
     *
     * `events.signIn` fires efter att magic-link verifierats och session
     * skapats. user.id är persistent Auth.js-user-ID, samma över sessions.
     */
    async signIn({ user }) {
      if (!user.id) return
      await ensureSelvraIdentity(user.id)
    },
  },
})
