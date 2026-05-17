/**
 * Pure platform-helpers — server-safe.
 *
 * Tidigare exporterad från platform-toggle.tsx som har 'use client'-direktiv,
 * vilket gjorde att Server Components inte kunde anropa resolvePlatform().
 * Bröts ut hit så page.tsx (Server Component) och platform-toggle.tsx
 * (Client Component) båda kan importera utan boundary-violation.
 */

import type { PlatformKey } from '@/content/connect/types'

/**
 * Läs platform-param från searchParams. Default desktop om saknas, invalid,
 * eller om klienten inte stöder mobile.
 */
export function resolvePlatform(
  rawParam: string | undefined,
  mobileSupported: boolean,
): PlatformKey {
  if (rawParam === 'mobile' && mobileSupported) return 'mobile'
  return 'desktop'
}
