import type { Metadata, Viewport } from 'next'
import { Inter, Source_Serif_4 } from 'next/font/google'

import { SiteFooter } from '@/components/site-footer'

import './globals.css'

// SiteHeader bortagen 2026-05-16 (iOS-pivot Steg 2): ingen nav behövs
// när webb-appen är pre-launch landing + login + privacy.

/**
 * Typografi-stack per SELVRA_LANDING_DESIGN_SPEC_2026-05-12.md Avsnitt 3.
 *
 * - Source Serif 4 (variabel): brödtext, rubriker, hero. Optical-size-axis
 *   adjusts mellan text och display automatiskt. Open source.
 * - Inter (variabel): meta, käll-attribuering, footer, navigation.
 *   Aldrig brödtext. Max 5% av sidans typografi.
 *
 * Geist är borttaget. Spec:et tillåter inga tech-sans.
 */
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-serif',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-sans',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://selvra.ai'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Selvra',
    template: '%s · Selvra',
  },
  description:
    'AI som vet vad du har levt, inte bara vad du har sagt. iOS-app launch H2 2026.',
  applicationName: 'Selvra',
  appleWebApp: {
    capable: true,
    title: 'Selvra',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: 'website',
    locale: 'sv_SE',
    url: siteUrl,
    siteName: 'Selvra',
    title: 'Selvra',
    description:
      'AI som vet vad du har levt, inte bara vad du har sagt. iOS-app launch H2 2026.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Selvra',
    description:
      'AI som vet vad du har levt, inte bara vad du har sagt. iOS-app launch H2 2026.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

/**
 * Theme-color matchar spec:s paper-bg #FAF8F5. PWA-statusbar bibehåller
 * editorial-känsla.
 */
export const viewport: Viewport = {
  themeColor: '#FAF8F5',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="sv"
      className={`${sourceSerif.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink font-serif pwa-safe-area">
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
