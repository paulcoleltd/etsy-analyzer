'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Tag, TrendingUp, BarChart2, Copy, Check, Loader2, Sparkles } from 'lucide-react'
import { useKeywordExplore, useKeywordTrends, useTitleOptimise, useKeywordCluster } from '@/hooks/useKeywords'
import { CompetitionBadge } from '@/components/keywords/CompetitionBadge'
import { TrendChart } from '@/components/keywords/TrendChart'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatNumber } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface PageProps { params: Promise<{ keyword: string }> }

type Period = '3m' | '6m' | '12m'

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="ml-1 rounded-md p-0.5 text-slate-400 transition-colors hover:text-slate-700"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

export default function KeywordDetailPage({ params }: PageProps) {
  const { keyword: enc } = use(params)
  const keyword = decodeURIComponent(enc)
  const [period, setPeriod] = useState<Period>('12m')

  const { data: kwData,   isLoading: kwLoading }    = useKeywordExplore(keyword)
  const { data: trendData, isLoading: trendLoading } = useKeywordTrends(keyword, period)
  const { mutate: cluster, data: clusterData, isPending: clustering } = useKeywordCluster()

  const kw     = kwData as any
  const trends = trendData as any
  const clust  = clusterData as any

  return (
    <div className="space-y-5 animate-fade-up">

      <PageHeader
        icon={Tag}
        iconColor="text-blue-500"
        iconBg="bg-blue-50"
        title={keyword}
        subtitle="Full keyword intelligence report"
        badge={kw?.competition ? `${kw.competition} competition` : 'Keyword data'}
        badgeColor="bg-blue-100 text-blue-700"
        actions={
          <Link href="/keywords" className="btn-ghost !px-3 !py-2 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* ── Keyword stats ── */}
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-bold text-slate-800">Keyword metrics</p>
            </div>
          </div>
          {kwLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="skeleton h-3 w-28" /><div className="skeleton h-3 w-16" />
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
                  { label: 'Last updated',       value: kw.last_updated ? new Date(kw.last_updated).toLocaleDateString() : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-3">
                    <dt className="text-sm text-slate-500">{label}</dt>
                    <dd className="text-sm font-semibold text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>

              {/* Related keywords */}
              {kw.related?.length > 0 && (
                <div className="mt-5">
                  <div className="section-label mb-2">Related keywords</div>
                  <div className="flex flex-wrap gap-1.5">
                    {kw.related.slice(0, 15).map((r: string) => (
                      <Link
                        key={r}
                        href={`/keywords/${encodeURIComponent(r)}`}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all"
                      >
                        {r}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-slate-400">No data found for this keyword.</div>
          )}
        </div>

        {/* ── Trend chart ── */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-bold text-slate-800">Search volume trend</p>
            </div>
            <div className="tab-row">
              {(['3m', '6m', '12m'] as Period[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={cn('tab-item', period === p && 'tab-item-active')}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="p-5">
            {trendLoading
              ? <div className="skeleton h-48 rounded-xl" />
              : trends?.data?.length > 0
                ? <TrendChart data={trends.data} period={period} />
                : <div className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400">No trend data available</div>
            }
          </div>
        </div>
      </div>

      {/* ── Cluster analysis ── */}
      {kw?.related?.length > 0 && (
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800">Keyword cluster analysis</p>
              <p className="text-xs text-slate-400 mt-0.5">Group related keywords by topic to find content clusters</p>
            </div>
            {!clust && (
              <button
                onClick={() => cluster([keyword, ...(kw.related ?? []).slice(0, 20)])}
                disabled={clustering}
                className="btn-primary !py-2 text-xs"
              >
                {clustering
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Clustering…</>
                  : <><Sparkles className="h-3.5 w-3.5" /> Run cluster analysis</>}
              </button>
            )}
          </div>

          {clust?.clusters ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(clust.clusters as Record<string, string[]>).map(([topic, kws]) => (
                <div key={topic} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <p className="mb-2 text-xs font-bold capitalize text-slate-700">{topic}</p>
                  <div className="flex flex-wrap gap-1">
                    {kws.map((k: string) => (
                      <span key={k} className="flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600">
                        {k} <CopyBtn text={k} />
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !clustering && (
              <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center">
                <Sparkles className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-400">Click &ldquo;Run cluster analysis&rdquo; to group related keywords by topic</p>
              </div>
            )
          )}
        </div>
      )}

      {/* ── Title optimiser ── */}
      {kw && <TitleOptimiser keyword={keyword} category={kw.category_l1} />}
    </div>
  )
}

function TitleOptimiser({ keyword, category }: { keyword: string; category?: string }) {
  const [title, setTitle]   = useState('')
  const [tags, setTags]     = useState('')
  const { mutate: optimise, data, isPending } = useTitleOptimise()
  const result = data as any

  return (
    <div className="card p-5">
      <div className="mb-4">
        <p className="text-sm font-bold text-slate-800">Title optimiser</p>
        <p className="mt-0.5 text-xs text-slate-400">
          Get AI suggestions to rewrite your title with &ldquo;{keyword}&rdquo; for maximum search visibility
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">Current title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Paste your current listing title…"
            className="input"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">
            Current tags <span className="font-normal text-slate-400">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="handmade gift, personalised, birthday…"
            className="input"
          />
        </div>
        <button
          onClick={() => optimise({ title, tags: tags.split(',').map(t => t.trim()).filter(Boolean), category: category ?? 'Other' })}
          disabled={isPending || !title.trim()}
          className="btn-primary"
        >
          {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Optimising…</> : <><Sparkles className="h-4 w-4" /> Optimise title</>}
        </button>
      </div>

      {result && (
        <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
          {result.optimised_title && (
            <div>
              <p className="section-label mb-1.5">Suggested title</p>
              <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3.5">
                <p className="flex-1 text-sm font-medium text-emerald-800 leading-relaxed">{result.optimised_title}</p>
                <CopyBtn text={result.optimised_title} />
              </div>
              <p className="mt-1 text-xs text-slate-400">{result.optimised_title.length} / 140 characters</p>
            </div>
          )}
          {result.tag_suggestions?.length > 0 && (
            <div>
              <p className="section-label mb-1.5">Suggested tags</p>
              <div className="flex flex-wrap gap-1.5">
                {result.tag_suggestions.map((t: string) => (
                  <span key={t} className="flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    {t} <CopyBtn text={t} />
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
