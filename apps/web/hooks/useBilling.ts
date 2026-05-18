import { useQuery, useMutation } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

const AUTH_URL  = process.env.NEXT_PUBLIC_AUTH_URL   ?? 'http://localhost:3001'
const NOTIF_URL = process.env.NEXT_PUBLIC_NOTIFICATION_URL ?? 'http://localhost:3003'

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export function useBillingUsage() {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken ?? ''
  return useQuery({
    queryKey: ['billing', 'usage'],
    queryFn: () =>
      fetch(`${AUTH_URL}/v1/billing/usage`, { headers: authHeader(token) }).then(r => r.json()),
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  })
}

export function useBillingPortal() {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken ?? ''
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${NOTIF_URL}/v1/billing/portal`, {
        method: 'POST',
        headers: authHeader(token),
      })
      const data = await res.json() as { url?: string }
      if (data.url) window.location.href = data.url
    },
  })
}

export function useCreateApiKey() {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken ?? ''
  return useMutation({
    mutationFn: (name: string) =>
      fetch(`${AUTH_URL}/api-keys`, {
        method: 'POST',
        headers: authHeader(token),
        body: JSON.stringify({ name }),
      }).then(r => r.json()),
  })
}

export function useRevokeApiKey() {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken ?? ''
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`${AUTH_URL}/api-keys/${id}`, { method: 'DELETE', headers: authHeader(token) }),
  })
}

export function useApiKeys() {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken ?? ''
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: () =>
      fetch(`${AUTH_URL}/api-keys`, { headers: authHeader(token) }).then(r => r.json()),
    enabled: !!token,
  })
}
