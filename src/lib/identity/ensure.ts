import 'server-only'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { createTenant, deriveSubjectIdUnderTenant } from '@/lib/protocol/client'

/**
 * Ensure-Selvra-identity-flöde. Idempotent.
 *
 * Anropas från Auth.js `events.signIn` första gången en user signar in.
 * Om user redan har en `selvraTenantId` → no-op. Annars:
 *   1. POST /v1/tenants → provisionera en ny tenant
 *   2. POST /v1/subjects under den nya tenanten → derivera subject_id
 *   3. Persistera båda i `users.selvra_tenant_id` + `users.selvra_subject_id`
 *
 * Pre-mortem R3-decision (uppdaterad 2026-05-12): per-user-tenant
 * (NOT shared-tenant). Varje user äger sin egen tenant så RLS isolerar
 * defense-in-depth utöver subject-claim-checks.
 *
 * Felhantering: vi loggar fel men kastar INTE — sign-in-flow ska inte
 * blockera om Selvra-protokollet är otillgängligt. Identity kan bli
 * lazy-provisionerad vid första API-anropet om denna sign-in misslyckas.
 */

export async function ensureSelvraIdentity(userId: string): Promise<void> {
  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const user = userRows[0]
  if (!user) {
    console.warn(`[ensureSelvraIdentity] User ${userId} not found in DB`)
    return
  }

  if (user.selvraTenantId && user.selvraSubjectId) {
    return
  }

  try {
    const tenantName = user.email ?? user.name ?? `user:${userId}`
    const tenant = await createTenant({
      name: tenantName,
      type: 'individual',
    })

    const subject = await deriveSubjectIdUnderTenant({
      tenantId: tenant.tenant_id,
      externalSubjectId: userId,
    })

    await db
      .update(users)
      .set({
        selvraTenantId: tenant.tenant_id,
        selvraSubjectId: subject.subject_id,
      })
      .where(eq(users.id, userId))

    console.log(
      `[ensureSelvraIdentity] user=${userId} tenant=${tenant.tenant_id} subject=${subject.subject_id}`,
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(
      `[ensureSelvraIdentity] failed for user=${userId}: ${msg}`,
    )
  }
}
