import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Niche Research',
  description: 'Find profitable Etsy niches with revenue estimates and opportunity scores.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
