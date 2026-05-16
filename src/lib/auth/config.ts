import 'server-only'

import { DrizzleAdapter } from '@auth/drizzle-adapter'
import NextAuth from 'next-auth'
import Resend from 'next-auth/providers/resend'

import * as Sentry from '@sentry/nextjs'

import { db } from '@/lib/db'
import {
  getUserSoftDeleteStatus,
  restoreUserAccount,
} from '@/lib/db/conversation-queries'
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from '@/lib/db/schema'
import { ensureSelvraIdentity } from '@/lib/identity/ensure'
import { logger } from '@/lib/logging'
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
     * Auto-restore om user är soft-deleted inom 30-dagars-fönster
     * (audit 2026-05-16 #18). Magic-link-verifikation bevisar
     * email-ägarskap, så auto-restore vid explicit login är säkert.
     * Hard-deleted users (cron körts) finns inte längre i DB → Auth.js
     * skapar ny user-rad och vi behandlar dem som nya konton.
     *
     * `events.signIn` fires efter att magic-link verifierats och session
     * skapats. user.id är persistent Auth.js-user-ID, samma över sessions.
     */
    async signIn({ user }) {
      if (!user.id) return
      const log = logger.child({ module: 'auth/sign-in' })

      // Check soft-delete-status först. Vid auto-restore loggar vi event
      // till Sentry för audit-trail (GDPR Art. 17 — user kan visa att
      // de återställde inom fönstret).
      const softDelete = await getUserSoftDeleteStatus(user.id)
      if (softDelete) {
        if (softDelete.daysAgo <= 30) {
          await restoreUserAccount(user.id)
          log.info('account_auto_restored', {
            userId: user.id,
            daysAgo: softDelete.daysAgo,
          })
          Sentry.captureMessage('account auto-restored via sign-in', {
            level: 'info',
            tags: { event: 'account_restore' },
            extra: { userId: user.id, daysSinceDeletion: softDelete.daysAgo },
          })
        } else {
          // Edge-case: cron har inte körts än men user är utanför fönstret.
          // Vi tillåter inte login — det vore inkonsistent med vad user
          // explicit bett om. Cron tar dem nästa körning.
          log.warn('account_login_blocked_expired_window', {
            userId: user.id,
            daysAgo: softDelete.daysAgo,
          })
          throw new Error('Konto raderat. Skapa nytt konto för att fortsätta.')
        }
      }

      await ensureSelvraIdentity(user.id)
    },
  },
})
