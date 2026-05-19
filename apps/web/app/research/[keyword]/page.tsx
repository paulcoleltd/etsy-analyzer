'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Store, Search } from 'lucide-react'
import { useNicheScore, useResearchSearch } from '@/hooks/useResearch'
import { NicheScoreCard } from '@/components/research/NicheScoreCard'
import { ListingCard } from '@/components/research/ListingCard'
import { formatCurrency } from '@/lib/utils'

interface PageProps { params: Promise<{ keyword: string }> }

export default function KeywordDetailPage({ params }: PageProps) {
  const { keyword: enc } = use(params)
  const keyword = decodeURIComponent(enc)

  const { data: niche, isLoading: nicheLoading } = useNicheScore(keyword)
  const { data: results, isLoading: resultsLoading } = useResearchSearch(keyword, { limit: '12' })
  const n = niche as any

  return (
    <div className="space-y-5 animate-fade-up">

      {/* Breadcrumb header */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white px-5 py-3.5 shadow-sm">
        <Link href="/research" className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="h-4 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-orange-500" />
          <h1 className="text-base font-bold capitalize text-slate-900">{keyword}</h1>
        </div>
        <span className="ml-auto rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold text-orange-700">
          Niche analysis
        </span>
      </div>

      {/* Top row: niche score + top shops */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Niche score card */}
        <div className="lg:col-span-1">
          {nicheLoading
            ? <div className="skeleton h-64 rounded-2xl" />
            : n
              ? <NicheScoreCard score={n.niche_score} rating={n.rating} components={n.components} totalListings={n.total_listings} />
              : <div className="empty-state"><p className="text-sm text-slate-400">No niche data available yet.</p></div>
          }
        </div>

        {/* Top shops in niche */}
        <div className="lg:col-span-2 card p-5">
          <p className="section-label mb-3">Top shops in this niche</p>
          {nicheLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}
            </div>
          ) : n?.top_shops?.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {n.top_shops.map((shop: any, i: number) => (
                <div key={shop.shop_id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-500">
                      {i + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50">
                        <Store className="h-3.5 w-3.5 text-orange-500" />
                      </div>
                      <Link href={`/competitors/${shop.shop_id}`} className="text-sm font-semibold text-slate-800 hover:text-orange-600 transition-colors">
                        {shop.shop_id}
                      </Link>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{shop.listing_count} listings</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-800">{formatCurrency(shop.est_revenue)}/mo</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state py-10">
              <p className="text-sm text-slate-400">No shop data yet for this keyword.</p>
            </div>
          )}

          {/* Price range */}
          {n?.price_range && (
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
              {[
                { label: 'Min price', val: n.price_range.min },
                { label: 'Avg price', val: n.price_range.avg },
                { label: 'Max price', val: n.price_range.max },
              ].map(({ label, val }) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{formatCurrency(val)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Listings grid */}
      <div>
        <p className="section-label mb-3">Top listings for &ldquo;{keyword}&rdquo;</p>
        {resultsLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-5 space-y-3">
                <div className="skeleton h-3.5 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
                <div className="skeleton h-3 w-1/3" />
              </div>
            ))}
          </div>
        ) : (results as any)?.results?.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(results as any).results.map((listing: any) => (
              <ListingCard key={listing.etsy_listing_id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Search className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400">No listings indexed yet for this keyword.</p>
          </div>
        )}
      </div>
    </div>
  )
}
