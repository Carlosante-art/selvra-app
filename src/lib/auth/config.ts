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

/**
 * Auth.js v5 (NextAuth.js) konfiguration för selvra-app:s magic-link-auth.
 *
 * - Adapter: Drizzle mot Railway Postgres
 * - Provider: Resend (magic-link via mail)
 * - Strategy: database sessions (server-renderade pages kan await:a sessionen)
 *
 * Selvra-protokoll-linkage (selvraSubjectId/selvraTenantId i users-tabellen)
 * sätts vid första-login via `events.signIn` → `ensureSelvraIdentity()`.
 * Idempotent — om columns redan är satta är det no-op.
 *
 * Per-user-tenant-model (lockad 2026-05-12): varje user provisioneras
 * sin egen tenant i Selvra-protokollet så RLS isolerar defense-in-depth.
 */

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Resend({
      from: process.env.MAIL_FROM ?? 'onboarding@resend.dev',
      apiKey: process.env.RESEND_API_KEY ?? '',
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
