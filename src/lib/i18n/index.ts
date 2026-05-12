import 'server-only'

import { cookies, headers } from 'next/headers'

import sv from '../../../locales/sv.json'
import en from '../../../locales/en.json'

/**
 * Minimal i18n-scaffold för selvra-app.
 *
 * Status (2026-05-12): scaffold-only. Editorial-prosan (hero, brev-exempel,
 * sektion-copy på landing) är medvetet INTE extraherad till JSON. Den
 * bor inline i JSX där den kan editieras tillsammans med design-iteration.
 *
 * När extrahering blir aktuell:
 * - Internationell launch (post-Norden-validering)
 * - Faktiska icke-svenska users i beta-cohort
 *
 * Tills dess: JSON-keys täcker bara *UI-labels* (knappar, nav, footer,
 * common errors) — de korta strängarna där svensk-engelska-paritet är
 * triv.
 *
 * Locale-detection (i prioritetsordning):
 * 1. Cookie `NEXT_LOCALE` (user-override via settings — saknas idag)
 * 2. Accept-Language-header (browser-default)
 * 3. Fallback: svenska (Selvras hemmamarknad)
 */

const TRANSLATIONS = { sv, en } as const

export type Locale = keyof typeof TRANSLATIONS

const DEFAULT_LOCALE: Locale = 'sv'

export async function getLocale(): Promise<Locale> {
  // 1. Cookie override
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  if (cookieLocale && cookieLocale in TRANSLATIONS) {
    return cookieLocale as Locale
  }

  // 2. Accept-Language-header
  const headerStore = await headers()
  const acceptLanguage = headerStore.get('accept-language') ?? ''
  const primaryLang = acceptLanguage.split(',')[0]?.split('-')[0]?.toLowerCase()
  if (primaryLang && primaryLang in TRANSLATIONS) {
    return primaryLang as Locale
  }

  // 3. Default svenska
  return DEFAULT_LOCALE
}

/**
 * Translate via dot-notation key (e.g. "common.start", "nav.brev").
 *
 * Server Component usage:
 *   const t = await getTranslator()
 *   return <button>{t('common.start')}</button>
 *
 * Fallback-behavior: om nyckeln saknas i nuvarande locale → svenska →
 * key-strängen själv (synlig debug-info, inte tom-string-fail).
 */
export async function getTranslator(): Promise<(key: string) => string> {
  const locale = await getLocale()
  return (key: string) => translate(key, locale)
}

function translate(key: string, locale: Locale): string {
  const result = lookup(TRANSLATIONS[locale], key)
  if (result !== undefined) return result

  // Svenska-fallback om annan locale saknar nyckeln
  if (locale !== 'sv') {
    const swedish = lookup(TRANSLATIONS.sv, key)
    if (swedish !== undefined) return swedish
  }

  // Last resort: returnera key — synlig debug-signal vid utveckling
  return key
}

function lookup(obj: unknown, key: string): string | undefined {
  const parts = key.split('.')
  let cur: unknown = obj
  for (const part of parts) {
    if (cur !== null && typeof cur === 'object' && part in cur) {
      cur = (cur as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }
  return typeof cur === 'string' ? cur : undefined
}
