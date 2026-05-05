import type { Metadata } from 'next'
import './globals.css'

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
      <body>{children}</body>
    </html>
  )
}
