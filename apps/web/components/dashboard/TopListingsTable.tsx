import Link from 'next/link'
import { GradeBadge } from '@/components/grader/GradeBadge'
import { formatCurrency } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

interface TopListing {
  etsy_listing_id: string
  title: string | null
  listing_grade: string | null
  est_monthly_revenue: number | null
  views_30d: number | null
  num_reviews: number
  opportunity_score: number | null
}

export function TopListingsTable({ listings, loading }: { listings: TopListing[] | undefined; loading?: boolean }) {
  if (loading) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-xl bg-slate-100" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-3/4 animate-pulse rounded-full bg-slate-100" />
              <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!listings?.length) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-slate-400">No listing data yet</p>
        <p className="mt-1 text-xs text-slate-300">Connect your Etsy shop to see performance</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {listings.map((l, idx) => (
        <Link
          key={l.etsy_listing_id}
          href={`/research/listing/${l.etsy_listing_id}`}
          className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-50"
        >
          {/* Rank */}
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-500">
            {idx + 1}
          </span>

          {/* Title + revenue */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-700 group-hover:text-orange-600 transition-colors">
              {l.title ?? 'Untitled'}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {l.est_monthly_revenue != null
                ? `${formatCurrency(l.est_monthly_revenue)}/mo`
                : '—'
              }
              {l.num_reviews > 0 && ` · ${l.num_reviews} reviews`}
            </p>
          </div>

          {/* Grade badge */}
          {l.listing_grade && (
            <GradeBadge grade={l.listing_grade} size="sm" />
          )}

          <ExternalLink className="h-3 w-3 shrink-0 text-slate-200 group-hover:text-orange-400 transition-colors" />
        </Link>
      ))}
    </div>
  )
}
