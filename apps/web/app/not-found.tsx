import Link from 'next/link'
import { BarChart2, ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#eef1f8' }}
    >
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30">
          <BarChart2 className="h-5 w-5 text-white" />
        </div>
        <span className="text-base font-bold text-slate-900">Etsy Analyzer</span>
      </div>

      {/* 404 display */}
      <div className="rounded-2xl border border-slate-200/70 bg-white px-12 py-12 shadow-sm max-w-md w-full">
        <p className="text-8xl font-extrabold tabular-nums bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent leading-none mb-4">
          404
        </p>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Page not found</h1>
        <p className="text-sm text-slate-500 mb-8">
          This page doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/25 hover:from-orange-600 hover:to-orange-700 transition-all"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/research"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Search className="h-4 w-4" /> Research a niche
          </Link>
        </div>
      </div>

      <Link
        href="/"
        className="mt-6 flex items-center gap-1.5 text-sm text-slate-400 hover:text-orange-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>
    </div>
  )
}
