import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
    // "default" = standard-iOS-statusbar (mörk text på ljus bg). Matchar
    // paper-doktrinen. Byt till "black-translucent" om vi går dark senare.
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
      'Förståelse-lagret för data du redan har. Reflektioner, inte dashboards.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Selvra',
    description:
      'Förståelse-lagret för data du redan har. Reflektioner, inte dashboards.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

/**
 * PWA viewport-config. `viewportFit: 'cover'` är nödvändig för att
 * safe-area-inset-* ska fungera på iPhone med notch / dynamic island —
 * utan den klipps content till "safe" zone automatiskt och dyker inte
 * upp under statusbaren även när vi vill ha edge-to-edge bg.
 *
 * themeColor sätter iOS statusbar-bakgrund i standalone-mode och
 * Android Chrome:s adress-fält. Paper-färg per doktrin.
 */
export const viewport: Viewport = {
  themeColor: '#FAF8F3',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // Användare kan zooma — accessibility. Vi sätter inte maximumScale=1.
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="sv"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 font-sans pwa-safe-area">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
