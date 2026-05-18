import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export function useCompetitors() {
  return useQuery({
    queryKey: ['competitors'],
    queryFn: () => api.competitors.list(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useAddCompetitor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (etsyShopId: string) => api.competitors.add(etsyShopId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['competitors'] }),
  })
}

export function useRemoveCompetitor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.competitors.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['competitors'] }),
  })
}

export function useNotifications(page = 1) {
  return useQuery({
    queryKey: ['notifications', page],
    queryFn: () => api.notifications.list(page, 20),
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60,
  })
}
