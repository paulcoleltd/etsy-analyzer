'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[DashboardError]', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center animate-fade-up">
      <div className="card max-w-md w-full px-10 py-12">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Failed to load this page</h2>
        <p className="text-sm text-slate-500 mb-6">
          Something went wrong loading this section. This is usually a temporary issue.
        </p>

        {error.message && (
          <p className="mb-5 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 font-mono text-xs text-slate-400 text-left break-all">
            {error.message.slice(0, 120)}
          </p>
        )}

        <div className="flex flex-col gap-2.5">
          <button
            onClick={reset}
            className="btn-primary w-full justify-center"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
          <Link href="/dashboard" className="btn-ghost w-full justify-center text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
