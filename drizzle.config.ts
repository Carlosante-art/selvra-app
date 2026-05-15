import type { Config } from 'drizzle-kit'

export default {
  // Båda schema-filerna plockas upp av drizzle-kit. Lägg till nya
  // schema-filer i denna lista när de behövs.
  schema: ['./src/lib/db/schema.ts', './src/lib/db/conversation-schema.ts'],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  strict: true,
  verbose: true,
} satisfies Config
