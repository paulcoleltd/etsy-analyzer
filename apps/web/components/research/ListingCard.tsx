import Link from 'next/link'
import { cn, formatCurrency } from '@/lib/utils'
import { RevenueBadge } from './RevenueBadge'
import { OpportunityBadge } from './OpportunityBadge'

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

interface Props {
  listing: Listing
}

export function ListingCard({ listing }: Props) {
  return (
    <Link
      href={`/research/listing/${listing.etsy_listing_id}`}
      className="group block rounded-xl border bg-white p-4 hover:border-orange-200 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
          {listing.title ?? 'Untitled listing'}
        </h3>
        {listing.is_bestseller && (
          <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
            Bestseller
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <RevenueBadge revenue={listing.est_monthly_revenue} confidence={listing.revenue_confidence} />
        <OpportunityBadge score={listing.opportunity_score} />
        {listing.price_usd != null && (
          <span className="text-xs text-gray-500">{formatCurrency(listing.price_usd)}</span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
        <span>{listing.num_reviews.toLocaleString()} reviews</span>
        {listing.tags.slice(0, 2).map(t => (
          <span key={t} className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-500">{t}</span>
        ))}
      </div>
    </Link>
  )
}
