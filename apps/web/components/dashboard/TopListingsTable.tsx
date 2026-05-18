import Link from 'next/link'
import { GradeBadge } from '@/components/grader/GradeBadge'
import { formatCurrency } from '@/lib/utils'

interface TopListing {
  etsy_listing_id: string
  title: string | null
  listing_grade: string | null
  est_monthly_revenue: number | null
  views_30d: number | null
  num_reviews: number
  opportunity_score: number | null
}

interface Props {
  listings: TopListing[] | undefined
  loading?: boolean
}

export function TopListingsTable({ listings, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!listings?.length) {
    return (
      <p className="text-sm text-gray-400 py-6 text-center">
        No listing data yet — connect your Etsy shop to see performance.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-gray-400 uppercase tracking-wide">
            <th className="pb-2 pr-4">Listing</th>
            <th className="pb-2 pr-4 text-right">Revenue/mo</th>
            <th className="pb-2 pr-4 text-right">Views 30d</th>
            <th className="pb-2 text-center">Grade</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {listings.map(l => (
            <tr key={l.etsy_listing_id} className="hover:bg-gray-50 transition-colors">
              <td className="py-2.5 pr-4">
                <Link
                  href={`/dashboard/listings/${l.etsy_listing_id}`}
                  className="line-clamp-1 font-medium text-gray-800 hover:text-orange-600 transition-colors"
                >
                  {l.title ?? l.etsy_listing_id}
                </Link>
              </td>
              <td className="py-2.5 pr-4 text-right tabular-nums font-semibold text-gray-700">
                {l.est_monthly_revenue != null ? formatCurrency(l.est_monthly_revenue) : '—'}
              </td>
              <td className="py-2.5 pr-4 text-right tabular-nums text-gray-500">
                {l.views_30d?.toLocaleString() ?? '—'}
              </td>
              <td className="py-2.5 text-center">
                {l.listing_grade ? <GradeBadge grade={l.listing_grade} size="sm" /> : <span className="text-gray-300">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
