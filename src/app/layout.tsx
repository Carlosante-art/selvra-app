import type { Metadata, Viewport } from 'next'
import { Inter, Source_Serif_4 } from 'next/font/google'

import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'

import './globals.css'

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
    'Ett brev till dig själv, varje vecka, från någon som har observerat den.',
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
      'Ett brev till dig själv, varje vecka, från någon som har observerat den.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Selvra',
    description:
      'Ett brev till dig själv, varje vecka, från någon som har observerat den.',
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
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
