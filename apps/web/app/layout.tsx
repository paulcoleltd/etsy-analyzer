import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: { default: 'Etsy Analyzer', template: '%s | Etsy Analyzer' },
  description: 'Revenue estimates, keyword research, and competitor tracking for Etsy sellers.',
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased" style={{ background: '#eef1f8' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
