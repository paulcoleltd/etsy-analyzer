import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { RevenueBadge } from './RevenueBadge'
import { OpportunityBadge } from './OpportunityBadge'
import { Star, MessageSquare } from 'lucide-react'

interface Listing {
  etsy_listing_id: string
  title: string | null
  price_usd: number | null
  num_reviews: number
  est_monthly_revenue: number | null
  revenue_confidence: string | null
  opportunity_score: number | null
  is_bestseller: boolean
  tags: string[]
}

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/research/listing/${listing.etsy_listing_id}`}
      className="group block rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-200/80 hover:shadow-md"
    >
      {/* Title + bestseller badge */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800 transition-colors group-hover:text-orange-600">
          {listing.title ?? 'Untitled listing'}
        </h3>
        {listing.is_bestseller && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
            <Star className="h-2.5 w-2.5 fill-orange-500 text-orange-500" />
            Bestseller
          </span>
        )}
      </div>

      {/* Metric badges */}
      <div className="flex flex-wrap items-center gap-2">
        <RevenueBadge revenue={listing.est_monthly_revenue} confidence={listing.revenue_confidence} />
        {listing.opportunity_score != null && (
          <span className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400">Score</span>
            <OpportunityBadge score={listing.opportunity_score} />
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-3 text-xs">
          {listing.price_usd != null && (
            <span className="font-bold text-slate-700">{formatCurrency(listing.price_usd)}</span>
          )}
          <span className="flex items-center gap-1 text-slate-400">
            <MessageSquare className="h-3 w-3" />
            {listing.num_reviews.toLocaleString()} reviews
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-300">#{listing.etsy_listing_id.slice(-6)}</span>
      </div>
    </Link>
  )
}
