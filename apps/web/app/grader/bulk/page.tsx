'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle2, XCircle, BarChart2, Sparkles, Store } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useBulkGrade, useBulkStatus } from '@/hooks/useGrader'
import { GradeBadge } from '@/components/grader/GradeBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { cn } from '@/lib/utils'

interface BulkResult {
  etsy_listing_id: string
  overall_grade: string
  overall_score: number
  dimension_scores: Record<string, number>
}

export default function BulkGraderPage() {
  const { data: session } = useSession()
  const [shopId, setShopId]     = useState('')
  const [jobId, setJobId]       = useState<string | null>(null)
  const [results, setResults]   = useState<BulkResult[]>([])
  const [gradeFilter, setGradeFilter] = useState<string | null>(null)
  const sseRef = useRef<EventSource | null>(null)

  const { mutate: startBulk, isPending: starting } = useBulkGrade()
  const { data: status } = useBulkStatus(jobId)
  const jobStatus = status as { status?: string; total?: number; completed?: number; failed?: number } | undefined

  useEffect(() => {
    if (!jobId || jobStatus?.status === 'done' || jobStatus?.status === 'error') return
    const GRADER_URL = process.env.NEXT_PUBLIC_GRADER_URL ?? 'http://localhost:8004'
    const es = new EventSource(`${GRADER_URL}/v1/grade/bulk/${jobId}/stream`)
    sseRef.current = es
    es.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data)
        if (data.status === 'done' || data.status === 'error') { es.close(); fetchResults() }
      } catch { /* ignore */ }
    }
    return () => { es.close() }
  }, [jobId, jobStatus?.status])

  async function fetchResults() {
    if (!jobId) return
    const GRADER_URL = process.env.NEXT_PUBLIC_GRADER_URL ?? 'http://localhost:8004'
    const resp = await fetch(`${GRADER_URL}/v1/grade/bulk/${jobId}/results?limit=200`)
    if (resp.ok) { const d = await resp.json(); setResults(d.results ?? []) }
  }

  function handleStart(e: React.FormEvent) {
    e.preventDefault()
    if (!shopId.trim()) return
    startBulk(shopId.trim(), {
      onSuccess: (data) => { const d = data as { job_id?: string }; if (d.job_id) setJobId(d.job_id) },
    })
  }

  const isPro = session?.user && ['pro', 'agency'].includes(
    (session.user as { plan?: string }).plan ?? ''
  )

  const filteredResults = gradeFilter ? results.filter(r => r.overall_grade === gradeFilter) : results
  const gradeCounts = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.overall_grade] = (acc[r.overall_grade] ?? 0) + 1; return acc
  }, {})

  const pct = jobStatus?.total ? Math.round(((jobStatus.completed ?? 0) / jobStatus.total) * 100) : 0

  return (
    <div className="space-y-5 animate-fade-up">

      <PageHeader
        icon={BarChart2}
        iconColor="text-orange-500"
        iconBg="bg-orange-50"
        title="Bulk Shop Audit"
        subtitle="Grade every listing in a shop at once and get a prioritised improvement queue"
        badge="Pro+"
        badgeColor="bg-orange-100 text-orange-700"
        actions={
          <Link href="/grader" className="btn-ghost !px-3 !py-2 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
        }
      />

      {/* Upgrade gate */}
      {!isPro ? (
        <div className="card p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
            <BarChart2 className="h-7 w-7 text-orange-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Bulk audit requires Pro plan</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
            Grade every listing in your shop at once and get a prioritised improvement queue.
          </p>
          <Link href="/pricing" className="btn-primary mx-auto mt-6 w-fit">
            <Sparkles className="h-4 w-4" /> Upgrade to Pro
          </Link>
        </div>
      ) : (
        <>
          {/* Input form */}
          {!jobId && (
            <div className="card p-5">
              <p className="mb-3 text-sm font-bold text-slate-800">Enter your shop name or ID</p>
              <form onSubmit={handleStart} className="flex gap-2">
                <div className="relative flex-1">
                  <Store className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text" value={shopId} onChange={e => setShopId(e.target.value)}
                    placeholder="MyEtsyShop"
                    className="input pl-10"
                  />
                </div>
                <button type="submit" disabled={starting || !shopId.trim()} className="btn-primary">
                  {starting ? <><Loader2 className="h-4 w-4 animate-spin" /> Starting…</> : <>Start audit</>}
                </button>
              </form>
            </div>
          )}

          {/* Progress panel */}
          {jobId && jobStatus && (
            <div className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {jobStatus.status === 'done'
                    ? <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50"><CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" size={18} /></div>
                    : jobStatus.status === 'error'
                      ? <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50"><XCircle className="h-4.5 w-4.5 text-red-500" size={18} /></div>
                      : <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50"><Loader2 className="h-4.5 w-4.5 animate-spin text-orange-500" size={18} /></div>
                  }
                  <p className="text-sm font-bold text-slate-800 capitalize">
                    {jobStatus.status === 'running' ? 'Grading listings…'
                      : jobStatus.status === 'done'   ? 'Audit complete!'
                      : jobStatus.status === 'queued' ? 'Starting…'
                      : jobStatus.status === 'error'  ? 'Audit failed'
                      : jobStatus.status}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-slate-600">
                  {jobStatus.completed ?? 0} / {jobStatus.total ?? '?'}
                  <span className="ml-1.5 text-slate-400">({pct}%)</span>
                </span>
              </div>

              {(jobStatus.total ?? 0) > 0 && (
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500',
                      jobStatus.status === 'done' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-orange-400 to-orange-500'
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}

              {(jobStatus.failed ?? 0) > 0 && (
                <p className="mt-2 text-xs text-red-500">{jobStatus.failed} listings could not be graded.</p>
              )}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              {/* Grade filter bar */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-slate-600">{results.length} listings graded</span>
                <div className="flex gap-1.5">
                  {['A', 'B', 'C', 'D', 'F'].map(g => gradeCounts[g] ? (
                    <button
                      key={g}
                      onClick={() => setGradeFilter(gradeFilter === g ? null : g)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all',
                        gradeFilter === g
                          ? 'border-slate-800 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                      )}
                    >
                      <GradeBadge grade={g} size="sm" />
                      <span>{gradeCounts[g]}</span>
                    </button>
                  ) : null)}
                </div>
                {gradeFilter && (
                  <button onClick={() => setGradeFilter(null)} className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors">
                    Clear filter ×
                  </button>
                )}
              </div>

              {/* Results table */}
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      {['Grade', 'Score', 'Listing ID', 'Weakest dimension', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredResults
                      .sort((a, b) => a.overall_score - b.overall_score)
                      .map(r => {
                        const weakest = Object.entries(r.dimension_scores).sort(([, a], [, b]) => a - b)[0]
                        return (
                          <tr key={r.etsy_listing_id} className="hover:bg-orange-50/30 transition-colors">
                            <td className="px-4 py-3"><GradeBadge grade={r.overall_grade} size="sm" /></td>
                            <td className="px-4 py-3 tabular-nums font-bold text-slate-700">{r.overall_score.toFixed(0)}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-400">{r.etsy_listing_id}</td>
                            <td className="px-4 py-3 text-slate-500 capitalize">
                              {weakest ? `${weakest[0]} (${weakest[1].toFixed(0)})` : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <Link href={`/grader?id=${r.etsy_listing_id}`} className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors">
                                View report →
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
