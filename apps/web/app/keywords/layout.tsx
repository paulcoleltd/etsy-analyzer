import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Keyword Explorer',
  description: 'Discover high-volume Etsy keywords with trend data and competition analysis.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
