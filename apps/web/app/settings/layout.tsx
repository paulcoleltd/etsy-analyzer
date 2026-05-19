import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your Etsy Analyzer account, billing, and integrations.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
