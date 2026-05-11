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

/**
 * Auth.js v5 (NextAuth.js) konfiguration för selvra-app:s magic-link-auth.
 *
 * - Adapter: Drizzle mot Railway Postgres
 * - Provider: Resend (magic-link via mail)
 * - Strategy: database sessions (server-renderade pages kan await:a sessionen)
 *
 * Selvra-protokoll-linkage (selvraSubjectId/selvraTenantId i users-tabellen)
 * sätts vid första-login via en signIn-callback som anropar
 * `POST /v1/subjects` i Selvra-protokollet. Det implementeras i nästa slice
 * när Resend + DB är konfigurerade och vi vet att magic-link-flödet fungerar
 * end-to-end.
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
})
