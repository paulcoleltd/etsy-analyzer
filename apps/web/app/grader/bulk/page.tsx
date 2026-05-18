'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle2, XCircle, BarChart2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useBulkGrade, useBulkStatus } from '@/hooks/useGrader'
import { GradeBadge } from '@/components/grader/GradeBadge'
import { cn } from '@/lib/utils'

interface BulkResult {
  etsy_listing_id: string
  overall_grade: string
  overall_score: number
  dimension_scores: Record<string, number>
}

export default function BulkGraderPage() {
  const { data: session } = useSession()
  const [shopId, setShopId] = useState('')
  const [jobId, setJobId] = useState<string | null>(null)
  const [results, setResults] = useState<BulkResult[]>([])
  const [gradeFilter, setGradeFilter] = useState<string | null>(null)
  const sseRef = useRef<EventSource | null>(null)

  const { mutate: startBulk, isPending: starting } = useBulkGrade()
  const { data: status } = useBulkStatus(jobId)
  const jobStatus = status as { status?: string; total?: number; completed?: number; failed?: number } | undefined

  // SSE for progress streaming
  useEffect(() => {
    if (!jobId || jobStatus?.status === 'done' || jobStatus?.status === 'error') return

    const GRADER_URL = process.env.NEXT_PUBLIC_GRADER_URL ?? 'http://localhost:8004'
    const es = new EventSource(`${GRADER_URL}/v1/grade/bulk/${jobId}/stream`)
    sseRef.current = es

    es.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data)
        if (data.status === 'done' || data.status === 'error') {
          es.close()
          // Fetch final results
          fetchResults()
        }
      } catch {
        // ignore parse errors
      }
    }

    return () => { es.close() }
  }, [jobId, jobStatus?.status])

  async function fetchResults() {
    if (!jobId) return
    const GRADER_URL = process.env.NEXT_PUBLIC_GRADER_URL ?? 'http://localhost:8004'
    const resp = await fetch(`${GRADER_URL}/v1/grade/bulk/${jobId}/results?limit=200`)
    if (resp.ok) {
      const data = await resp.json()
      setResults(data.results ?? [])
    }
  }

  function handleStart(e: React.FormEvent) {
    e.preventDefault()
    if (!shopId.trim()) return
    startBulk(shopId.trim(), {
      onSuccess: (data) => {
        const d = data as { job_id?: string }
        if (d.job_id) setJobId(d.job_id)
      },
    })
  }

  const isPro = session?.user && ['pro', 'agency'].includes(
    (session.user as { plan?: string }).plan ?? ''
  )

  const filteredResults = gradeFilter
    ? results.filter(r => r.overall_grade === gradeFilter)
    : results

  const gradeCounts = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.overall_grade] = (acc[r.overall_grade] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/grader" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Bulk Shop Audit</h1>
          {!isPro && (
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
              Pro+
            </span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {!isPro ? (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-8 text-center">
            <BarChart2 className="h-10 w-10 text-orange-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-800">Bulk audit requires Pro plan</h2>
            <p className="mt-2 text-sm text-gray-500">
              Grade every listing in your shop at once and get a prioritised improvement queue.
            </p>
            <Link
              href="/pricing"
              className="mt-4 inline-block rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
            >
              Upgrade to Pro
            </Link>
          </div>
        ) : (
          <>
            {/* Input form */}
            {!jobId && (
              <div className="rounded-2xl border bg-white p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Enter your shop name or ID</h2>
                <form onSubmit={handleStart} className="flex gap-2">
                  <input
                    type="text"
                    value={shopId}
                    onChange={e => setShopId(e.target.value)}
                    placeholder="MyEtsyShop"
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <button
                    type="submit"
                    disabled={starting || !shopId.trim()}
                    className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 transition-colors"
                  >
                    {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Start audit'}
                  </button>
                </form>
              </div>
            )}

            {/* Progress panel */}
            {jobId && jobStatus && (
              <div className="rounded-2xl border bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {jobStatus.status === 'done' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : jobStatus.status === 'error' ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                    )}
                    <span className="text-sm font-semibold text-gray-700 capitalize">
                      {jobStatus.status === 'running' ? 'Grading listings…' :
                       jobStatus.status === 'done'    ? 'Audit complete' :
                       jobStatus.status === 'queued'  ? 'Starting…' :
                       jobStatus.status === 'error'   ? 'Audit failed' : jobStatus.status}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 tabular-nums">
                    {jobStatus.completed ?? 0} / {jobStatus.total ?? '?'}
                  </span>
                </div>

                {/* Progress bar */}
                {(jobStatus.total ?? 0) > 0 && (
                  <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        jobStatus.status === 'done' ? 'bg-green-500' : 'bg-orange-500',
                      )}
                      style={{
                        width: `${((jobStatus.completed ?? 0) / (jobStatus.total ?? 1)) * 100}%`,
                      }}
                    />
                  </div>
                )}

                {(jobStatus.failed ?? 0) > 0 && (
                  <p className="mt-2 text-xs text-red-500">{jobStatus.failed} listings could not be graded</p>
                )}
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <div className="space-y-4">
                {/* Grade distribution */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-gray-500">{results.length} listings graded</span>
                  <div className="flex gap-1.5">
                    {['A', 'B', 'C', 'D', 'F'].map(g => (
                      gradeCounts[g] ? (
                        <button
                          key={g}
                          onClick={() => setGradeFilter(gradeFilter === g ? null : g)}
                          className={cn(
                            'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                            gradeFilter === g
                              ? 'bg-gray-900 text-white border-gray-900'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50',
                          )}
                        >
                          <GradeBadge grade={g} size="sm" />
                          <span>{gradeCounts[g]}</span>
                        </button>
                      ) : null
                    ))}
                  </div>
                  {gradeFilter && (
                    <button
                      onClick={() => setGradeFilter(null)}
                      className="text-xs text-orange-600 hover:underline"
                    >
                      Clear filter
                    </button>
                  )}
                </div>

                {/* Results table */}
                <div className="rounded-2xl border bg-white overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                        <th className="px-4 py-3">Grade</th>
                        <th className="px-4 py-3">Score</th>
                        <th className="px-4 py-3">Listing ID</th>
                        <th className="px-4 py-3">Weakest dimension</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredResults
                        .sort((a, b) => a.overall_score - b.overall_score)
                        .map(r => {
                          const weakest = Object.entries(r.dimension_scores)
                            .sort(([, a], [, b]) => a - b)[0]
                          return (
                            <tr key={r.etsy_listing_id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3">
                                <GradeBadge grade={r.overall_grade} size="sm" />
                              </td>
                              <td className="px-4 py-3 tabular-nums font-semibold text-gray-700">
                                {r.overall_score.toFixed(0)}
                              </td>
                              <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                                {r.etsy_listing_id}
                              </td>
                              <td className="px-4 py-3 text-gray-500 capitalize">
                                {weakest ? `${weakest[0]} (${weakest[1].toFixed(0)})` : '—'}
                              </td>
                              <td className="px-4 py-3">
                                <Link
                                  href={`/grader?id=${r.etsy_listing_id}`}
                                  className="text-xs text-orange-600 hover:underline"
                                >
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
    </div>
  )
}
