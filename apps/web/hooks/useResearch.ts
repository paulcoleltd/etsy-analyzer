import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export function useResearchSearch(q: string, params?: Record<string, string>) {
  return useQuery({
    queryKey: ['research', 'search', q, params],
    queryFn: () => api.research.search(q, params),
    staleTime: 1000 * 60 * 60 * 6, // 6 h
    enabled: q.trim().length > 1,
  })
}

export function useNicheScore(keyword: string) {
  return useQuery({
    queryKey: ['research', 'niche', keyword],
    queryFn: () => api.research.niche(keyword),
    staleTime: 1000 * 60 * 60 * 6,
    enabled: keyword.trim().length > 1,
  })
}

export function useListingIntelligence(listingId: string) {
  return useQuery({
    queryKey: ['research', 'listing', listingId],
    queryFn: () => api.research.listing(listingId),
    staleTime: 1000 * 60 * 60 * 2,
    enabled: !!listingId,
  })
}

export function useTrending() {
  return useQuery({
    queryKey: ['research', 'trending'],
    queryFn: () => api.research.trending(),
    staleTime: 1000 * 60 * 60 * 12,
  })
}
