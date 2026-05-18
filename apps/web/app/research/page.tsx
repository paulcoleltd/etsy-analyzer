'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, TrendingUp, Loader2 } from 'lucide-react'
import { useResearchSearch, useTrending } from '@/hooks/useResearch'
import { ListingCard } from '@/components/research/ListingCard'
import { FilterSidebar } from '@/components/research/FilterSidebar'
import { useDebounce } from '@/hooks/useDebounce'

interface Filters {
  category?: string
  minPrice?: number
  maxPrice?: number
  minReviews?: number
  minScore?: number
}

export default function ResearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>({})
  const [sort, setSort] = useState('opportunity_score')
  const debouncedQuery = useDebounce(query, 300)

  const params: Record<string, string> = { sort }
  if (filters.category)   params.category   = filters.category
  if (filters.minScore)   params.min_score  = String(filters.minScore)
  if (filters.minReviews) params.min_reviews = String(filters.minReviews)
  if (filters.minPrice)   params.min_price  = String(filters.minPrice)

  const { data: results, isLoading } = useResearchSearch(debouncedQuery, params)
  const { data: trending } = useTrending()

  const handleEnter = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && debouncedQuery.trim().length > 1) {
        router.push(`/research/${encodeURIComponent(debouncedQuery.trim())}`)
      }
    },
    [debouncedQuery, router],
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Niche Research</h1>
          <p className="mt-1 text-sm text-gray-500">
            Search any keyword to see revenue estimates, competition, and opportunity scores.
          </p>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleEnter}
              placeholder={'Try “silver ring”, “wedding invitation”, “crochet pattern”…'}
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
            )}
          </div>
          {/* Sort */}
          {debouncedQuery && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-500">Sort by:</span>
              {[
                { value: 'opportunity_score', label: 'Opportunity' },
                { value: 'est_monthly_revenue', label: 'Revenue' },
                { value: 'num_reviews', label: 'Reviews' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSort(opt.value)}
                  className={`rounded-full px-3 py-1 text-xs border transition-colors ${
                    sort === opt.value
                      ? 'border-orange-400 bg-orange-50 text-orange-700 font-medium'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {!debouncedQuery ? (
          /* Trending section */
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <h2 className="text-sm font-semibold text-gray-700">Trending keywords</h2>
            </div>
            {trending ? (
              <div className="flex flex-wrap gap-2">
                {(trending as Array<{ keyword: string; avg_opportunity_score: number }>).map(item => (
                  <button
                    key={item.keyword}
                    onClick={() => setQuery(item.keyword)}
                    className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-colors"
                  >
                    {item.keyword}
                    <span className="text-xs text-orange-500 font-medium">
                      {item.avg_opportunity_score.toFixed(0)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-8 w-24 rounded-full bg-gray-200 animate-pulse" />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Search results */
          <div className="flex gap-8">
            <FilterSidebar filters={filters} onChange={setFilters} />
            <div className="flex-1">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="h-32 rounded-xl bg-gray-200 animate-pulse" />
                  ))}
                </div>
              ) : results ? (
                <>
                  <p className="text-sm text-gray-500 mb-4">
                    {(results as { total: number }).total?.toLocaleString()} listings found · press Enter for full niche analysis
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(results as { results: any[] }).results?.map((listing: any) => (
                      <ListingCard key={listing.etsy_listing_id} listing={listing} />
                    ))}
                  </div>
                  {(results as { results: any[] }).results?.length === 0 && (
                    <p className="text-center text-gray-400 mt-12">No listings found for this keyword yet. Data is populated as searches are scraped.</p>
                  )}
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
