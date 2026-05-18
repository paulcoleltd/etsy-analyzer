import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export function useDashboardOverview(period = '30d') {
  return useQuery({
    queryKey: ['dashboard', 'overview', period],
    queryFn: () => api.dashboard.overview(period),
    staleTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 60 * 10,
  })
}

export function useDashboardRevenue(from: string, to: string, granularity: string) {
  return useQuery({
    queryKey: ['dashboard', 'revenue', from, to, granularity],
    queryFn: () => api.dashboard.revenue(from, to, granularity),
    staleTime: 1000 * 60 * 30,
    enabled: !!from && !!to,
  })
}

export function useDashboardListings(params: Record<string, string>) {
  return useQuery({
    queryKey: ['dashboard', 'listings', params],
    queryFn: () => api.dashboard.listings(params),
    staleTime: 1000 * 60 * 10,
  })
}

export function useTriggerSync() {
  return useMutation({
    mutationFn: () =>
      fetch(`${process.env.NEXT_PUBLIC_ANALYTICS_URL ?? 'http://localhost:8001'}/v1/dashboard/sync`, {
        method: 'POST',
      }).then(r => r.json()),
  })
}
