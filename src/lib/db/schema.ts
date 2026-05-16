/**
 * Drizzle schema för selvra-app:s lokala DB.
 *
 * Standard Auth.js v5-tabeller (users, accounts, sessions, verificationTokens)
 * + Selvra-protokoll-linkage på users-tabellen (selvra_subject_id +
 * selvra_tenant_id derived vid första-login).
 */

import {
  pgTable,
  text,
  timestamp,
  integer,
  primaryKey,
} from 'drizzle-orm/pg-core'
import type { AdapterAccountType } from 'next-auth/adapters'

// ─── Auth.js v5 standard tables ────────────────────────────────────────

export const users = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),

  // Selvra-protokoll-linkage. Sätts vid första-login efter att magic-link
  // verifierats. selvra_tenant_id är användarens egen tenant i Selvra-
  // protokollet (skapad via POST /v1/subjects + admin-seed). subject_id är
  // UUID5(SELVRA_SUBJECT_NAMESPACE, tenant_id + ":" + user.id).
  selvraTenantId: text('selvra_tenant_id'),
  selvraSubjectId: text('selvra_subject_id'),

  // Soft-delete med 30-dagars restore-window (audit 2026-05-16 #18).
  // Sätts av softDeleteUserAccount(). Cron hard-deletar efter 30d.
  // Auto-clear vid events.signIn om inom 30d-fönster.
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
})

export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ],
)

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => [
    primaryKey({
      columns: [vt.identifier, vt.token],
    }),
  ],
)
