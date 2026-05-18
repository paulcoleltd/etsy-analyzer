import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export function useKeywordExplore(q: string) {
  return useQuery({
    queryKey: ['keywords', 'explore', q],
    queryFn: () => api.keywords.explore(q),
    staleTime: 1000 * 60 * 60 * 24,
    enabled: q.trim().length > 1,
  })
}

export function useKeywordTrends(q: string, period = '12m') {
  return useQuery({
    queryKey: ['keywords', 'trends', q, period],
    queryFn: () => api.keywords.trends(q, period),
    staleTime: 1000 * 60 * 60 * 6,
    enabled: q.trim().length > 1,
  })
}

export function useTitleOptimise() {
  return useMutation({
    mutationFn: (data: { title: string; tags: string[]; category: string }) =>
      api.keywords.optimiseTitle(data),
  })
}

export function useKeywordCluster() {
  return useMutation({
    mutationFn: (keywords: string[]) => api.keywords.cluster(keywords),
  })
}
