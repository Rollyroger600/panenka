import type { Metadata } from 'next'
import { Caveat } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat' })

export const metadata: Metadata = {
  title: 'Panenka — WK 2026',
  description: 'WK 2026 poule app',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body className={caveat.variable}>
        <div className="max-w-[430px] mx-auto min-h-screen">{children}</div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
