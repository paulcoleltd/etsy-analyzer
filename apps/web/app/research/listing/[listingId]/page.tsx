'use client'

import { use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Star, MessageSquare, Tag, Package,
  DollarSign, TrendingUp, ExternalLink, Zap, Camera,
} from 'lucide-react'
import { useListingIntelligence } from '@/hooks/useResearch'
import { RevenueBadge } from '@/components/research/RevenueBadge'
import { OpportunityBadge } from '@/components/research/OpportunityBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'

interface PageProps { params: Promise<{ listingId: string }> }

export default function ListingDetailPage({ params }: PageProps) {
  const { listingId } = use(params)
  const { data, isLoading } = useListingIntelligence(listingId)
  const listing = data as any

  if (isLoading) {
    return (
      <div className="space-y-5 animate-fade-up">
        <div className="card px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="skeleton h-9 w-9 rounded-xl" />
            <div className="skeleton h-5 w-64 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="space-y-5">
        <div className="card px-5 py-4">
          <Link href="/research" className="flex items-center gap-2 text-sm text-slate-500 hover:text-orange-600 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Research
          </Link>
        </div>
        <div className="empty-state">
          <Package className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-base font-semibold text-slate-600">Listing not found</p>
          <p className="mt-1 text-sm text-slate-400">This listing may not be indexed yet.</p>
          <Link href="/research" className="btn-primary mx-auto mt-5 w-fit">Back to Research</Link>
        </div>
      </div>
    )
  }

  const stats = [
    { label: 'Est. revenue/mo', value: <RevenueBadge revenue={listing.est_monthly_revenue} confidence={listing.revenue_confidence} />, icon: DollarSign, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Reviews',  value: formatNumber(listing.num_reviews ?? 0), icon: MessageSquare, color: 'text-blue-500',    bg: 'bg-blue-50'    },
    { label: 'Avg rating', value: listing.avg_rating ? `${Number(listing.avg_rating).toFixed(1)} ★` : '—', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Est. units/mo', value: listing.est_monthly_units ? formatNumber(listing.est_monthly_units) : '—', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ]

  return (
    <div className="space-y-5 animate-fade-up">

      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-3 card px-5 py-3.5">
        <Link href="/research" className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="h-4 w-px bg-slate-200" />
        <p className="flex-1 text-sm font-semibold text-slate-800 line-clamp-1">
          {listing.title ?? listing.etsy_listing_id}
        </p>
        <div className="flex items-center gap-2">
          {listing.is_bestseller && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold text-orange-700">
              <Star className="h-2.5 w-2.5 fill-orange-500" /> Bestseller
            </span>
          )}
          <OpportunityBadge score={listing.opportunity_score} size="md" />
          <a
            href={`https://www.etsy.com/listing/${listingId}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
          >
            Etsy <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
              <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', bg)}>
                <Icon className={cn('h-3.5 w-3.5', color)} />
              </div>
            </div>
            <div className="text-lg font-extrabold text-slate-900">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Main details */}
        <div className="lg:col-span-2 space-y-4">

          {/* Price & specs */}
          <div className="card p-5">
            <p className="section-label mb-3">Listing details</p>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: 'Price',        value: listing.price_usd ? formatCurrency(listing.price_usd) : '—' },
                { label: 'Category',     value: listing.category_l1 ?? '—' },
                { label: 'Photos',       value: listing.photo_count ?? '—' },
                { label: 'Has video',    value: listing.has_video ? 'Yes' : 'No' },
                { label: 'Free shipping', value: listing.shipping_free ? 'Yes' : 'No' },
                { label: 'Listing age',  value: listing.listing_age_days ? `${listing.listing_age_days}d` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
                </div>
              ))}
            </dl>
          </div>

          {/* Tags */}
          {listing.tags?.length > 0 && (
            <div className="card p-5">
              <div className="mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-bold text-slate-800">Tags ({listing.tags.length})</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {listing.tags.map((tag: string) => (
                  <Link
                    key={tag}
                    href={`/keywords/${encodeURIComponent(tag)}`}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 transition-all"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Description preview */}
          {listing.description && (
            <div className="card p-5">
              <p className="section-label mb-2">Description preview</p>
              <p className="text-sm leading-relaxed text-slate-600 line-clamp-6">{listing.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Revenue confidence */}
          <div className="card p-5">
            <p className="section-label mb-3">Revenue estimate</p>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monthly revenue</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900 tabular-nums">
                  {listing.est_monthly_revenue ? formatCurrency(listing.est_monthly_revenue) : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monthly units</p>
                <p className="mt-1 text-lg font-bold text-slate-800 tabular-nums">
                  {listing.est_monthly_units ? formatNumber(listing.est_monthly_units) : '—'}
                </p>
              </div>
              {listing.revenue_confidence && (
                <div className={cn(
                  'rounded-xl border px-3 py-2 text-xs font-semibold capitalize',
                  listing.revenue_confidence === 'high'   && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                  listing.revenue_confidence === 'medium' && 'border-amber-200 bg-amber-50 text-amber-700',
                  listing.revenue_confidence === 'low'    && 'border-slate-200 bg-slate-50 text-slate-600',
                )}>
                  {listing.revenue_confidence} confidence estimate
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card p-5 space-y-2">
            <p className="section-label mb-3">Quick actions</p>
            <Link href={`/grader?id=${listingId}`} className="btn-primary w-full justify-center text-sm">
              <Zap className="h-4 w-4" /> Grade this listing
            </Link>
            <Link href={`/research/${encodeURIComponent(listing.category_l1 ?? 'handmade')}`} className="btn-ghost w-full justify-center text-sm">
              <TrendingUp className="h-4 w-4" /> Research this niche
            </Link>
            {listing.shop_id && (
              <Link href={`/competitors/${listing.shop_id}`} className="btn-ghost w-full justify-center text-sm">
                <Camera className="h-4 w-4" /> View shop
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
