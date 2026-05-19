'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, TrendingUp, Loader2, SlidersHorizontal, Flame } from 'lucide-react'
import { useResearchSearch, useTrending } from '@/hooks/useResearch'
import { ListingCard } from '@/components/research/ListingCard'
import { FilterSidebar } from '@/components/research/FilterSidebar'
import { PageHeader } from '@/components/layout/PageHeader'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'

interface Filters {
  category?: string
  minPrice?: number
  maxPrice?: number
  minReviews?: number
  minScore?: number
}

const SORT_OPTIONS = [
  { value: 'opportunity_score', label: 'Opportunity' },
  { value: 'revenue',           label: 'Revenue'      },
  { value: 'reviews',           label: 'Reviews'      },
  { value: 'price',             label: 'Price'        },
]

export default function ResearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>({})
  const [sort, setSort] = useState('opportunity_score')
  const [showFilters, setShowFilters] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  const params: Record<string, string> = { sort }
  if (filters.category)   params.category    = filters.category
  if (filters.minScore)   params.min_score   = String(filters.minScore)
  if (filters.minReviews) params.min_reviews = String(filters.minReviews)
  if (filters.minPrice)   params.min_price   = String(filters.minPrice)

  const { data: results, isLoading } = useResearchSearch(debouncedQuery, params)
  const { data: trending } = useTrending()

  const handleEnter = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && debouncedQuery.trim().length > 1)
        router.push(`/research/${encodeURIComponent(debouncedQuery.trim())}`)
    },
    [debouncedQuery, router],
  )

  const items = (results as any[]) ?? []
  const trendingItems = (trending as string[]) ?? []

  return (
    <div className="animate-fade-up">
      <PageHeader
        icon={Search}
        iconColor="text-orange-500"
        iconBg="bg-orange-50"
        title="Niche Research"
        subtitle="Discover profitable niches with real revenue data and opportunity scores"
        badge="Live data"
        actions={
          <button
            onClick={() => setShowFilters(v => !v)}
            className={cn(
              'btn-ghost',
              showFilters && 'border-orange-300 bg-orange-50 text-orange-700',
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
        }
      />

      {/* Search bar */}
      <div className="mb-5 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          {isLoading && (
            <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-orange-500" />
          )}
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleEnter}
            placeholder="Search niches, products, keywords… (press Enter for deep dive)"
            className="input pl-10 pr-10"
          />
        </div>

        {/* Trending pills */}
        {trendingItems.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              Trending:
            </div>
            {trendingItems.slice(0, 8).map((term: string) => (
              <button
                key={term}
                onClick={() => setQuery(term)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 transition-all"
              >
                {term}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex gap-5">
        {/* Filter panel */}
        {showFilters && (
          <aside className="w-56 shrink-0">
            <div className="card p-4">
              <p className="section-label">Filters</p>
              <FilterSidebar filters={filters} onChange={setFilters} />
            </div>
          </aside>
        )}

        <div className="flex-1">
          {/* Sort + result count */}
          {debouncedQuery && (
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                {isLoading ? 'Searching…' : `${items.length} results for "${debouncedQuery}"`}
              </p>
              <div className="tab-row">
                {SORT_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => setSort(o.value)}
                    className={cn('tab-item', sort === o.value && 'tab-item-active')}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty prompt */}
          {!debouncedQuery && (
            <div className="empty-state">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
                <Search className="h-6 w-6 text-orange-400" />
              </div>
              <p className="text-base font-semibold text-slate-600">Start your research</p>
              <p className="mt-1 text-sm text-slate-400">Type a keyword above to discover profitable niches</p>
            </div>
          )}

          {/* Skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card p-5 space-y-3">
                  <div className="skeleton h-3.5 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                  <div className="skeleton h-3 w-1/3" />
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {!isLoading && items.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {items.map((item: any) => (
                <ListingCard key={item.etsy_listing_id ?? item.id} listing={item} />
              ))}
            </div>
          )}

          {/* No results */}
          {!isLoading && debouncedQuery && items.length === 0 && (
            <div className="empty-state">
              <Search className="mx-auto mb-4 h-10 w-10 text-slate-300" />
              <p className="text-base font-semibold text-slate-600">No results found</p>
              <p className="mt-1 text-sm text-slate-400">Try a different keyword or adjust your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
