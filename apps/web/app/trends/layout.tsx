import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trends',
  description: 'Explore trending Etsy keywords and search volume trends over time.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
