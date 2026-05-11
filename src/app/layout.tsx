import type { Metadata } from 'next'
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="sv"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 font-sans">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
