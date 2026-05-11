import 'server-only'

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from './schema'

/**
 * Drizzle DB-singleton mot Railway Postgres (selvra-app:s egen DB).
 *
 * Vid build/dev utan DATABASE_URL: Pool konstrueras med placeholder så
 * import:en inte kraschar. Faktiska queries (Auth.js handlers) fail:ar
 * vid första anrop om DB inte är konfad — vilket är önskat beteende:
 * tydligt fel istället för silent fallback.
 */

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://placeholder:placeholder@localhost:5432/placeholder'

const pool = new Pool({
  connectionString,
  // Railway Postgres kräver SSL i prod
  ssl:
    process.env.NODE_ENV === 'production' && process.env.DATABASE_URL
      ? { rejectUnauthorized: false }
      : false,
})

export const db = drizzle(pool, { schema })
