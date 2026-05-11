import type { MetadataRoute } from 'next'

/**
 * PWA-manifest. Strukturell yta, ingen visuell-design-implementation.
 * Färger låsta per design-doktrin (FAF8F3 paper, 2A2826 ink) — det är
 * metadata för OS:et (statusbar-färg på iOS, splash-bg på Android),
 * inte färgexperiment i UI.
 *
 * När mood-board landar och en accent-färg är vald: lägg ev. till
 * `theme_color` per media-prefers-color-scheme om dark-mode aktiveras.
 */

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Selvra',
    short_name: 'Selvra',
    description:
      'Ett brev till dig själv, varje vecka, från någon som har observerat den.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FAF8F3',
    theme_color: '#FAF8F3',
    categories: ['lifestyle', 'productivity'],
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
