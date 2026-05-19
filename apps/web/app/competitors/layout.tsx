import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Competitor Intelligence',
  description: 'Track rival Etsy shops and receive real-time alerts on their changes.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
