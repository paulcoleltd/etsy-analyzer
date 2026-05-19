'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Store, Users, DollarSign, BarChart2, ExternalLink } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { AlertConfig } from '@/components/competitors/AlertConfig'
import { GradeBadge } from '@/components/grader/GradeBadge'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface PageProps { params: Promise<{ shopId: string }> }

export default function CompetitorDetailPage({ params }: PageProps) {
  const { shopId } = use(params)
  const qc = useQueryClient()

  const { data: shopData, isLoading } = useQuery({
    queryKey: ['competitor', shopId],
    queryFn: () =>
      fetch(
        `${process.env.NEXT_PUBLIC_COMPETITOR_URL ?? 'http://localhost:3002'}/v1/competitors/${shopId}`,
        { headers: { Authorization: `Bearer dummy` } },
      ).then(r => r.json()),
    staleTime: 1000 * 60 * 5,
  })

  const { mutate: updateAlerts } = useMutation({
    mutationFn: async (config: any) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_COMPETITOR_URL ?? 'http://localhost:3002'}/v1/competitors/${shopId}/alerts`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer dummy` }, body: JSON.stringify(config) },
      )
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['competitor', shopId] }),
  })

  const shop = shopData as any

  const { data: shopResearch } = useQuery({
    queryKey: ['research', 'shop', shop?.etsyShopId],
    queryFn: () => api.research.listing(shop.etsyShopId),
    enabled: !!shop?.etsyShopId,
    staleTime: 1000 * 60 * 10,
  })
  const research = shopResearch as any

  const STATS = [
    { label: 'Est. revenue/mo', value: research?.est_monthly_revenue != null ? formatCurrency(research.est_monthly_revenue) : '—', icon: DollarSign,  color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Listings',        value: research?.listing_count?.toLocaleString() ?? '—',                                             icon: BarChart2,   color: 'text-blue-500',   bg: 'bg-blue-50'   },
    { label: 'Avg reviews',     value: research?.avg_reviews?.toFixed(0) ?? '—',                                                     icon: Users,       color: 'text-emerald-500', bg: 'bg-emerald-50'},
  ]

  return (
    <div className="space-y-5 animate-fade-up">

      {/* Breadcrumb header */}
      <div className="flex items-center gap-3 card px-5 py-3.5">
        <Link href="/competitors" className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="h-4 w-px bg-slate-200" />
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
            <Store className="h-4 w-4 text-orange-500" />
          </div>
          {isLoading
            ? <div className="skeleton h-5 w-40 rounded-full" />
            : <h1 className="text-base font-bold text-slate-900">{shop?.shopName ?? shopId}</h1>
          }
        </div>
        <a
          href={`https://www.etsy.com/shop/${shop?.etsyShopId ?? shopId}`}
          target="_blank" rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors"
        >
          View on Etsy <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-3 gap-4">
        {STATS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
              <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', bg)}>
                <Icon className={cn('h-3.5 w-3.5', color)} />
              </div>
            </div>
            <p className="text-xl font-extrabold text-slate-900 tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Top listings table */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3.5">
            <p className="text-sm font-bold text-slate-800">Top listings</p>
          </div>
          {isLoading ? (
            <div className="p-5 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}
            </div>
          ) : research?.top_listings?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Listing</th>
                    <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Revenue</th>
                    <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Reviews</th>
                    <th className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {research.top_listings.map((l: any) => (
                    <tr key={l.etsy_listing_id} className="group hover:bg-slate-50 transition-colors">
                      <td className="max-w-[200px] px-5 py-3">
                        <Link href={`/grader?id=${l.etsy_listing_id}`} className="line-clamp-1 text-slate-700 hover:text-orange-600 transition-colors font-medium">
                          {l.title ?? l.etsy_listing_id}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-slate-800 tabular-nums">
                        {l.est_monthly_revenue != null ? formatCurrency(l.est_monthly_revenue) : '—'}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-500">{l.num_reviews ?? '—'}</td>
                      <td className="px-5 py-3 text-center">
                        {l.listing_grade ? <GradeBadge grade={l.listing_grade} size="sm" /> : <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state py-12">
              <p className="text-sm text-slate-400">No listing data yet — run a research search for this shop first.</p>
            </div>
          )}
        </div>

        {/* Alert config + quick links */}
        <div className="space-y-4">
          {shop?.alertConfig ? (
            <AlertConfig
              config={shop.alertConfig}
              onSave={(cfg: any) => new Promise((res: any, rej: any) => updateAlerts(cfg, { onSuccess: res, onError: rej }))}
            />
          ) : (
            <div className="card p-5">
              {isLoading
                ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-8 rounded-xl" />)}</div>
                : <p className="text-sm text-slate-400">Alert configuration unavailable.</p>}
            </div>
          )}

          <div className="card p-4 text-center">
            <p className="text-xs text-slate-400 mb-2">Full niche analysis for this shop</p>
            <Link
              href={`/research/${encodeURIComponent(shop?.shopName ?? shopId)}`}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
            >
              View niche analysis →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
