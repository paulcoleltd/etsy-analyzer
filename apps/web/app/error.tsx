'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { BarChart2, AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error tracking in production
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="en">
      <body
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center font-sans"
        style={{ background: '#eef1f8' }}
      >
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30">
            <BarChart2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-bold text-slate-900">Etsy Analyzer</span>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white px-12 py-12 shadow-sm max-w-md w-full">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h1>
          <p className="text-sm text-slate-500 mb-6">
            An unexpected error occurred. Please try again — if it persists, contact support.
          </p>

          {error.digest && (
            <p className="mb-6 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-400">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/25 hover:from-orange-600 hover:to-orange-700 transition-all"
            >
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
