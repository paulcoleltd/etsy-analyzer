'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Loader2, RotateCcw, Star, Sparkles } from 'lucide-react'
import { useGradeMutation } from '@/hooks/useGrader'
import { GradeReport } from '@/components/grader/GradeReport'
import { PageHeader } from '@/components/layout/PageHeader'
import { cn } from '@/lib/utils'

const HOW_IT_WORKS = [
  { step: '1', color: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/25', title: 'Paste a listing', desc: 'Enter any Etsy listing URL or numeric ID.' },
  { step: '2', color: 'from-blue-500 to-blue-600',     shadow: 'shadow-blue-500/25',   title: 'AI analysis',    desc: 'We score title, tags, photos, price, and shipping.' },
  { step: '3', color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/25', title: 'Get your grade', desc: 'Receive an A–F grade with specific improvement tips.' },
]

export default function GraderPage() {
  const searchParams = useSearchParams()
  const [input, setInput] = useState(searchParams.get('id') ?? searchParams.get('url') ?? '')
  const [lastGraded, setLastGraded] = useState('')
  const { mutate: grade, data, isPending, error, reset } = useGradeMutation()

  // Auto-grade when arriving via deep-link (?id=123 or ?url=https://...)
  useEffect(() => {
    const id  = searchParams.get('id')
    const url = searchParams.get('url')
    if (id || url) {
      const val = id || url!
      setInput(val)
      if (id)  grade({ etsy_listing_id: id })
      if (url) grade({ url })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    setLastGraded(trimmed)
    if (trimmed.includes('etsy.com/listing/')) {
      grade({ url: trimmed })
    } else if (/^\d+$/.test(trimmed)) {
      grade({ etsy_listing_id: trimmed })
    } else {
      grade({ url: trimmed })
    }
  }

  const gradeData = data as Record<string, unknown> | undefined

  return (
    <div className="animate-fade-up">
      <PageHeader
        icon={Star}
        iconColor="text-orange-500"
        iconBg="bg-orange-50"
        title="Listing Grader"
        subtitle="Get an A–F grade with AI-powered improvement suggestions for any Etsy listing"
        badge="AI powered"
        badgeColor="bg-orange-100 text-orange-700"
      />

      {/* Input card */}
      <div className="mb-5 card p-5">
        <p className="mb-3 text-sm font-semibold text-slate-700">
          Paste an Etsy listing URL or ID
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="https://www.etsy.com/listing/123456789/... or 123456789"
              className="input pl-10"
            />
          </div>
          <button
            type="submit"
            disabled={isPending || !input.trim()}
            className="btn-primary"
          >
            {isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Analysing…</>
              : <><Sparkles className="h-4 w-4" /> Grade it</>}
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-400">
          Try listing ID: <button onClick={() => setInput('4493579933')} className="font-mono text-orange-500 hover:underline">4493579933</button>
        </p>
      </div>

      {/* Loading */}
      {isPending && (
        <div className="card py-20 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          </div>
          <p className="text-base font-semibold text-slate-700">Analysing your listing…</p>
          <p className="mt-1 text-sm text-slate-400">Scoring title, tags, photos, price & shipping</p>
        </div>
      )}

      {/* Error */}
      {error && !isPending && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-red-700">Could not grade this listing</p>
          <p className="mt-1 text-xs text-red-500">Check the URL or ID and try again.</p>
          <button
            onClick={() => { reset(); setInput(lastGraded) }}
            className="btn-ghost mx-auto mt-4 text-red-600 border-red-200 hover:bg-red-50"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Try again
          </button>
        </div>
      )}

      {/* Grade report */}
      {gradeData && !isPending && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="section-label">Grade report</p>
            <button
              onClick={() => { reset(); setInput('') }}
              className="btn-ghost text-xs px-3 py-1.5"
            >
              <RotateCcw className="h-3 w-3" /> Grade another
            </button>
          </div>
          <div className="card overflow-hidden">
            <GradeReport data={gradeData} />
          </div>
        </div>
      )}

      {/* How it works — shown when no result */}
      {!gradeData && !isPending && !error && (
        <div>
          <p className="section-label">How it works</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {HOW_IT_WORKS.map(({ step, color, shadow, title, desc }) => (
              <div key={step} className="card p-5">
                <div className={cn(
                  'mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-md',
                  color, shadow,
                )}>
                  {step}
                </div>
                <p className="text-sm font-bold text-slate-800">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
