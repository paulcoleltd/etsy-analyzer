import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Listing Grader',
  description: 'Get an AI-powered A-F grade and improvement suggestions for any Etsy listing.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
