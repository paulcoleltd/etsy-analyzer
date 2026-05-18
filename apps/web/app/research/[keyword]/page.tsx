'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useNicheScore, useResearchSearch } from '@/hooks/useResearch'
import { NicheScoreCard } from '@/components/research/NicheScoreCard'
import { ListingCard } from '@/components/research/ListingCard'
import { formatCurrency } from '@/lib/utils'

interface PageProps {
  params: Promise<{ keyword: string }>
}

export default function KeywordDetailPage({ params }: PageProps) {
  const { keyword: encodedKeyword } = use(params)
  const keyword = decodeURIComponent(encodedKeyword)

  const { data: niche, isLoading: nicheLoading } = useNicheScore(keyword)
  const { data: results, isLoading: resultsLoading } = useResearchSearch(keyword, { limit: '12' })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Link href="/research" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900 capitalize">{keyword}</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Niche score + top shops */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            {nicheLoading ? (
              <div className="h-64 rounded-2xl bg-gray-200 animate-pulse" />
            ) : niche ? (
              <NicheScoreCard
                score={(niche as any).niche_score}
                rating={(niche as any).rating}
                components={(niche as any).components}
                totalListings={(niche as any).total_listings}
              />
            ) : null}
          </div>

          {/* Top shops */}
          <div className="lg:col-span-2 rounded-2xl border bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Top shops in this niche</h2>
            {nicheLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : (niche as any)?.top_shops?.length > 0 ? (
              <div className="space-y-2">
                {(niche as any).top_shops.map((shop: any, i: number) => (
                  <div key={shop.shop_id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                      <Link
                        href={`/competitors/${shop.shop_id}`}
                        className="text-sm font-medium text-gray-800 hover:text-orange-600 transition-colors"
                      >
                        {shop.shop_id}
                      </Link>
                      <span className="text-xs text-gray-400">{shop.listing_count} listings</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {formatCurrency(shop.est_revenue)}/mo
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No shop data yet for this keyword.</p>
            )}

            {/* Price range */}
            {(niche as any)?.price_range && (
              <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4">
                {[
                  { label: 'Min price', val: (niche as any).price_range.min },
                  { label: 'Avg price', val: (niche as any).price_range.avg },
                  { label: 'Max price', val: (niche as any).price_range.max },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-semibold text-gray-800">{formatCurrency(val)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Listings grid */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Top listings for &ldquo;{keyword}&rdquo;
          </h2>
          {resultsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 rounded-xl bg-gray-200 animate-pulse" />
              ))}
            </div>
          ) : (results as any)?.results?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(results as any).results.map((listing: any) => (
                <ListingCard key={listing.etsy_listing_id} listing={listing} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              No listings indexed for this keyword yet.{' '}
              <Link href="/research" className="text-orange-600 hover:underline">Search another keyword</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
