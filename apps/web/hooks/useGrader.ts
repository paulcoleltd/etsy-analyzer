import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export function useGrade(listingId: string) {
  return useQuery({
    queryKey: ['grade', listingId],
    queryFn: () => api.grader.grade({ etsy_listing_id: listingId }),
    enabled: false, // manually triggered
    staleTime: 1000 * 60 * 60 * 2,
    retry: 1,
  })
}

export function useGradeMutation() {
  return useMutation({
    mutationFn: (data: { etsy_listing_id?: string; url?: string }) =>
      api.grader.grade(data),
  })
}

export function useBulkGrade() {
  return useMutation({
    mutationFn: (shopId: string) => api.grader.bulkStart(shopId),
  })
}

export function useBulkStatus(jobId: string | null) {
  return useQuery({
    queryKey: ['grade', 'bulk', jobId],
    queryFn: () => api.grader.bulkStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = (query.state.data as { status?: string } | undefined)?.status
      return status === 'done' || status === 'error' ? false : 2000
    },
  })
}
