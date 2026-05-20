'use client'

import { useState } from 'react'
import { TrendingUp, Search, Loader2, ArrowUpRight, Flame, Tag } from 'lucide-react'
import { useTrending } from '@/hooks/useResearch'
import { useKeywordTrends } from '@/hooks/useKeywords'
import { TrendChart } from '@/components/keywords/TrendChart'
import { PageHeader } from '@/components/layout/PageHeader'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type Period = '3m' | '6m' | '12m'

const TOP_CATEGORIES = [
  { name: 'Jewelry',           color: 'bg-rose-50 text-rose-600 border-rose-200'      },
  { name: 'Home & Living',     color: 'bg-amber-50 text-amber-600 border-amber-200'   },
  { name: 'Art & Collectibles', color: 'bg-violet-50 text-violet-600 border-violet-200'},
  { name: 'Clothing',          color: 'bg-blue-50 text-blue-600 border-blue-200'      },
  { name: 'Weddings',          color: 'bg-pink-50 text-pink-600 border-pink-200'      },
  { name: 'Bath & Beauty',     color: 'bg-emerald-50 text-emerald-600 border-emerald-200'},
  { name: 'Craft Supplies',    color: 'bg-orange-50 text-orange-600 border-orange-200'},
  { name: 'Pet Supplies',      color: 'bg-teal-50 text-teal-600 border-teal-200'     },
]

export default function TrendsPage() {
  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState<Period>('12m')
  const debouncedQuery = useDebounce(query, 350)

  const { data: trendingData, isLoading: trendingLoading } = useTrending()
  const { data: chartData, isLoading: chartLoading } = useKeywordTrends(debouncedQuery, period)

  // Trending returns [{ keyword, listing_count, avg_revenue }] or string[]
  const trending: string[] = ((trendingData as any[]) ?? []).map((t: any) =>
    typeof t === 'string' ? t : (t.keyword ?? '')
  ).filter(Boolean)
  const chart    = chartData as any

  return (
    <div className="space-y-5 animate-fade-up">

      <PageHeader
        icon={TrendingUp}
        iconColor="text-orange-500"
        iconBg="bg-orange-50"
        title="Trends"
        subtitle="Discover what's growing on Etsy right now — track any keyword over time"
        badge="Live"
      />

      {/* Trending now */}
      <div className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <p className="text-sm font-bold text-slate-800">Trending right now</p>
        </div>
        {trendingLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="skeleton h-7 w-24 rounded-full" />
            ))}
          </div>
        ) : trending.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {trending.map((term: string, i: number) => (
              <button
                key={term}
                onClick={() => setQuery(term)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                  debouncedQuery === term
                    ? 'border-orange-300 bg-orange-50 text-orange-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600',
                )}
              >
                {i < 3 && <Flame className="h-3 w-3 text-orange-400" />}
                {term}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No trending data available right now.</p>
        )}
      </div>

      {/* Keyword trend chart */}
      <div className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-800">Keyword trend explorer</p>
            <p className="text-xs text-slate-400 mt-0.5">Track search volume for any keyword over time</p>
          </div>
          <div className="tab-row">
            {(['3m', '6m', '12m'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn('tab-item', period === p && 'tab-item-active')}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Search input */}
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          {chartLoading && (
            <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-orange-500" />
          )}
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Enter a keyword to track its trend…"
            className="input pl-10 pr-10"
          />
        </div>

        {/* Chart area */}
        {!debouncedQuery && (
          <div className="flex h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-center">
            <TrendingUp className="mb-2 h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400">Type a keyword or click a trending term above</p>
          </div>
        )}

        {debouncedQuery && chartLoading && (
          <div className="skeleton h-48 rounded-xl" />
        )}

        {debouncedQuery && !chartLoading && chart && (
          <div>
            <TrendChart data={chart.data} period={period} />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Showing trend data for <span className="font-semibold text-slate-600">&ldquo;{debouncedQuery}&rdquo;</span>
              </p>
              <Link
                href={`/keywords?q=${encodeURIComponent(debouncedQuery)}`}
                className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
              >
                Full keyword report <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        {debouncedQuery && !chartLoading && !chart && (
          <div className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400">
            No trend data available for this keyword
          </div>
        )}
      </div>

      {/* Categories grid */}
      <div>
        <p className="section-label mb-3">Browse by category</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TOP_CATEGORIES.map(({ name, color }) => (
            <button
              key={name}
              onClick={() => setQuery(name.toLowerCase())}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-3.5 py-3 text-left text-xs font-semibold transition-all hover:-translate-y-0.5 hover:shadow-sm',
                debouncedQuery === name.toLowerCase()
                  ? color + ' shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
              )}
            >
              <Tag className="h-3.5 w-3.5 shrink-0" />
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-5">
        <p className="section-label mb-3">Explore deeper</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: 'Keyword Explorer',    desc: 'Volume, competition & related terms', href: '/keywords',  color: 'text-blue-500',   bg: 'bg-blue-50'   },
            { label: 'Niche Research',       desc: 'Find profitable product opportunities', href: '/research',  color: 'text-orange-500', bg: 'bg-orange-50' },
            { label: 'Listing Grader',       desc: 'Score & improve any listing',          href: '/grader',    color: 'text-emerald-500', bg: 'bg-emerald-50'},
          ].map(({ label, desc, href, color, bg }) => (
            <Link
              key={href}
              href={href}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-orange-200 hover:bg-white transition-all group"
            >
              <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', bg)}>
                <TrendingUp className={cn('h-4 w-4', color)} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 group-hover:text-orange-600 transition-colors">{label}</p>
                <p className="mt-0.5 text-xs text-slate-400">{desc}</p>
              </div>
              <ArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-orange-400 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
