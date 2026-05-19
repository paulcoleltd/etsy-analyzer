'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider, useSession } from 'next-auth/react'
import { useState, useEffect, type ReactNode } from 'react'
import { setTokens, clearTokens } from '@/lib/api-client'

/**
 * Syncs the NextAuth session token into the API client so all
 * service calls have the correct Authorization header.
 */
function TokenSyncer() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      setTokens(
        session.accessToken,
        (session as any).refreshToken ?? '',
      )
      // Also expose for non-module code (Stripe checkout etc.)
      ;(window as any).__accessToken = session.accessToken
    } else if (status === 'unauthenticated') {
      clearTokens()
      ;(window as any).__accessToken = ''
    }
  }, [session, status])

  return null
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime:  1000 * 60 * 5,
            retry:      1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <TokenSyncer />
        {children}
      </QueryClientProvider>
    </SessionProvider>
  )
}
