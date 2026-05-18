'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Loader2, RotateCcw, LayoutGrid } from 'lucide-react'
import { useGradeMutation } from '@/hooks/useGrader'
import { GradeReport } from '@/components/grader/GradeReport'

export default function GraderPage() {
  const [input, setInput] = useState('')
  const [lastGraded, setLastGraded] = useState('')
  const { mutate: grade, data, isPending, error, reset } = useGradeMutation()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return

    setLastGraded(trimmed)
    // Detect URL vs plain ID
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Listing Grader</h1>
          <p className="mt-1 text-sm text-gray-500">
            Paste an Etsy listing URL or ID to get an A–F grade with AI-powered improvement tips.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="https://www.etsy.com/listing/123456789/... or listing ID"
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={isPending || !input.trim()}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Grade'}
            </button>
          </form>

          <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
            <span>Accepts listing URL or numeric ID</span>
            <Link
              href="/grader/bulk"
              className="flex items-center gap-1 text-orange-600 hover:underline font-medium"
            >
              <LayoutGrid className="h-3 w-3" />
              Bulk audit my shop (Pro+)
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Loading skeleton */}
        {isPending && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-2xl border bg-white p-6">
              <div className="h-20 w-20 rounded-full bg-gray-200 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded bg-gray-200 animate-pulse" />
                <div className="h-2.5 rounded-full bg-gray-200 animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-gray-200 animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !isPending && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-medium text-red-700">
              {(error as { message?: string }).message ?? 'Could not grade this listing. Make sure the ID is valid and the listing is active.'}
            </p>
            <button
              onClick={() => { reset(); setInput(lastGraded) }}
              className="mt-3 flex items-center gap-1.5 mx-auto text-xs text-red-600 hover:underline"
            >
              <RotateCcw className="h-3 w-3" /> Try again
            </button>
          </div>
        )}

        {/* Grade result */}
        {gradeData && !isPending && (
          <div className="space-y-6">
            <GradeReport
              data={gradeData as unknown as Parameters<typeof GradeReport>[0]['data']}
              title={null}
            />

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => { reset(); setInput('') }}
                className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Grade another
              </button>
              <Link
                href="/grader/bulk"
                className="flex items-center gap-2 rounded-xl bg-orange-50 border border-orange-200 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors"
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Bulk audit my shop
              </Link>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!gradeData && !isPending && !error && (
          <div className="text-center py-16">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
              <Search className="h-7 w-7 text-orange-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-700">Grade any Etsy listing</h2>
            <p className="mt-2 text-sm text-gray-400 max-w-sm mx-auto">
              Get a detailed A–F grade across title, tags, description, photos, price, and shipping — plus AI suggestions to improve each dimension.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {['Great title SEO', 'All 13 tags used', 'Strong photos', 'Free shipping'].map(label => (
                <span key={label} className="rounded-full border bg-white px-3 py-1 text-xs text-gray-500">
                  ✓ {label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
