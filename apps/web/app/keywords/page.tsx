'use client'

import { useState } from 'react'
import { Search, Loader2, ArrowRight, Tag, BarChart2, TrendingUp } from 'lucide-react'
import { useKeywordExplore, useKeywordTrends } from '@/hooks/useKeywords'
import { CompetitionBadge } from '@/components/keywords/CompetitionBadge'
import { TrendChart } from '@/components/keywords/TrendChart'
import { formatNumber } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { cn } from '@/lib/utils'

type Period = '3m' | '6m' | '12m'

export default function KeywordsPage() {
  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState<Period>('12m')
  const debouncedQuery = useDebounce(query, 350)

  const { data: kwData, isLoading: kwLoading } = useKeywordExplore(debouncedQuery)
  const { data: trendData, isLoading: trendLoading } = useKeywordTrends(debouncedQuery, period)

  const kw = kwData as any
  const trends = trendData as any

  return (
    <div className="animate-fade-up">
      <PageHeader
        icon={Tag}
        iconColor="text-blue-500"
        iconBg="bg-blue-50"
        title="Keyword Explorer"
        subtitle="Search volume, competition data, and 12-month trend forecasting for any keyword"
        badge="Live"
        badgeColor="bg-blue-100 text-blue-700"
      />

      {/* Search */}
      <div className="mb-5 card p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          {(kwLoading || trendLoading) && (
            <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-orange-500" />
          )}
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Enter a keyword (e.g. personalised gift, wall art)…"
            className="input pl-10 pr-10"
          />
        </div>
        {!debouncedQuery && (
          <p className="mt-2 text-xs text-slate-400">
            Try: <button onClick={() => setQuery('personalised gifts')} className="text-orange-500 hover:underline">personalised gifts</button>
            {' · '}
            <button onClick={() => setQuery('wall art prints')} className="text-orange-500 hover:underline">wall art prints</button>
            {' · '}
            <button onClick={() => setQuery('handmade jewellery')} className="text-orange-500 hover:underline">handmade jewellery</button>
          </p>
        )}
      </div>

      {/* Empty state */}
      {!debouncedQuery && (
        <div className="empty-state">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
            <Tag className="h-6 w-6 text-blue-400" />
          </div>
          <p className="text-base font-semibold text-slate-600">Explore keyword opportunities</p>
          <p className="mt-1 text-sm text-slate-400">Type a keyword above to see volume, competition, and trends</p>
        </div>
      )}

      {/* Results — two column layout */}
      {debouncedQuery && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

          {/* Keyword data */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
              <BarChart2 className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-bold text-slate-800">Keyword data</p>
              <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-500">
                &ldquo;{debouncedQuery}&rdquo;
              </span>
            </div>

            {kwLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="skeleton h-3 w-28" />
                    <div className="skeleton h-3 w-16" />
                  </div>
                ))}
              </div>
            ) : kw ? (
              <div className="p-5">
                <dl className="divide-y divide-slate-100">
                  {[
                    { label: 'Monthly searches',  value: kw.volume_est ? formatNumber(kw.volume_est) : '—' },
                    { label: 'Competition',        value: <CompetitionBadge level={kw.competition} /> },
                    { label: 'Trend direction',    value: kw.trend_direction ?? '—' },
                    { label: 'Opportunity score',  value: kw.opportunity_score != null ? `${kw.opportunity_score}/100` : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-3">
                      <dt className="text-sm text-slate-500">{label}</dt>
                      <dd className="text-sm font-semibold text-slate-900">{value}</dd>
                    </div>
                  ))}
                </dl>

                {kw.related?.length > 0 && (
                  <div className="mt-4">
                    <p className="section-label">Related keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {kw.related.slice(0, 12).map((r: string) => (
                        <button
                          key={r}
                          onClick={() => setQuery(r)}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 transition-all"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Link
                  href={`/keywords/${encodeURIComponent(debouncedQuery)}`}
                  className="btn-ghost mt-5 w-full justify-center text-xs"
                >
                  Full keyword report <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="p-10 text-center text-sm text-slate-400">No data found for this keyword.</div>
            )}
          </div>

          {/* Trend chart */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-bold text-slate-800">Search trend</p>
              </div>
              <div className="tab-row !p-0.5">
                {(['3m', '6m', '12m'] as Period[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn('tab-item !px-2.5 !py-1 text-[11px]', period === p && 'tab-item-active')}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5">
              {trendLoading ? (
                <div className="skeleton h-48 rounded-xl" />
              ) : trends ? (
                <TrendChart data={trends.data} period={period} />
              ) : (
                <div className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400">
                  No trend data available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
