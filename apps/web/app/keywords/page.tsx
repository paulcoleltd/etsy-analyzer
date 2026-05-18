'use client'

import { useState } from 'react'
import { Search, Loader2, ArrowRight } from 'lucide-react'
import { useKeywordExplore, useKeywordTrends } from '@/hooks/useKeywords'
import { CompetitionBadge } from '@/components/keywords/CompetitionBadge'
import { TrendChart } from '@/components/keywords/TrendChart'
import { formatNumber } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import Link from 'next/link'

export default function KeywordsPage() {
  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState<'3m' | '6m' | '12m'>('12m')
  const debouncedQuery = useDebounce(query, 350)

  const { data: kwData, isLoading: kwLoading } = useKeywordExplore(debouncedQuery)
  const { data: trendData, isLoading: trendLoading } = useKeywordTrends(debouncedQuery, period)

  const kw = kwData as any
  const trends = trendData as any

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Keyword Explorer</h1>
          <p className="mt-1 text-sm text-gray-500">
            Discover search volume, competition, and trend data for any keyword.
          </p>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Enter a keyword…"
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
            {(kwLoading || trendLoading) && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {!debouncedQuery ? (
          <div className="text-center py-16 text-gray-400">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Start typing to explore keywords</p>
          </div>
        ) : kwLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : kw ? (
          <>
            {/* Stats card */}
            <div className="rounded-2xl border bg-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 capitalize">{kw.keyword}</h2>
                  <div className="mt-2 flex items-center gap-3">
                    <CompetitionBadge competition={kw.competition} />
                    <span className="text-xs text-gray-500 capitalize">{kw.trend_direction} trend</span>
                  </div>
                </div>
                <Link
                  href={`/research/${encodeURIComponent(kw.keyword)}`}
                  className="flex items-center gap-1 text-xs text-orange-600 hover:underline"
                >
                  Full niche analysis <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-4 border-t pt-4">
                <Stat label="Est. monthly searches" value={formatNumber(kw.volume_est)} highlight />
                <Stat label="Competing listings" value={formatNumber(kw.competing_count)} />
                <Stat label="Competition level" value={kw.competition} capitalize />
              </div>
            </div>

            {/* Trend chart */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-700">Search volume over time</p>
                <div className="flex gap-1">
                  {(['3m', '6m', '12m'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${period === p ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              {trends?.data ? (
                <TrendChart data={trends.data} keyword={kw.keyword} />
              ) : (
                <div className="h-40 rounded-xl bg-gray-200 animate-pulse" />
              )}
            </div>

            {/* Related keywords */}
            {kw.related?.length > 0 && (
              <div className="rounded-xl border bg-white p-5">
                <p className="text-sm font-semibold text-gray-700 mb-3">Related keywords</p>
                <div className="flex flex-wrap gap-2">
                  {kw.related.map((rel: string) => (
                    <button
                      key={rel}
                      onClick={() => setQuery(rel)}
                      className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:border-orange-300 hover:bg-orange-50 transition-colors"
                    >
                      {rel}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-gray-400 py-8">No data found for this keyword yet.</p>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, highlight, capitalize }: { label: string; value: string; highlight?: boolean; capitalize?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${highlight ? 'text-orange-600' : 'text-gray-900'} ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </p>
    </div>
  )
}
