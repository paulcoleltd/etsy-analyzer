'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Store } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { AlertConfig } from '@/components/competitors/AlertConfig'
import { GradeBadge } from '@/components/grader/GradeBadge'
import { formatCurrency } from '@/lib/utils'

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
      ).then((r) => r.json()),
    staleTime: 1000 * 60 * 5,
  })

  const { mutate: updateAlerts, isPending: savingAlerts } = useMutation({
    mutationFn: async (config: any) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_COMPETITOR_URL ?? 'http://localhost:3002'}/v1/competitors/${shopId}/alerts`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer dummy` },
          body: JSON.stringify(config),
        },
      )
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['competitor', shopId] }),
  })

  const shop = shopData as any

  // Also load listings from research service
  const { data: shopResearch } = useQuery({
    queryKey: ['research', 'shop', shop?.etsyShopId],
    queryFn: () => api.research.listing(shop.etsyShopId),
    enabled: !!shop?.etsyShopId,
    staleTime: 1000 * 60 * 10,
  })
  const research = shopResearch as any

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/competitors" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        {isLoading ? (
          <div className="h-6 w-40 rounded bg-gray-200 animate-pulse" />
        ) : (
          <>
            <Store className="h-5 w-5 text-orange-500" />
            <h1 className="text-xl font-bold text-gray-900">
              {shop?.shopName ?? shopId}
            </h1>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Est. revenue/mo', value: research?.est_monthly_revenue != null ? formatCurrency(research.est_monthly_revenue) : '—' },
              { label: 'Listings',        value: research?.listing_count?.toLocaleString() ?? '—' },
              { label: 'Avg reviews',     value: research?.avg_reviews?.toFixed(0) ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border bg-white p-4">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          {/* Top listings */}
          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">Top listings</p>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-8 rounded bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : research?.top_listings?.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-400 uppercase tracking-wide">
                    <th className="pb-2">Listing</th>
                    <th className="pb-2 text-right">Revenue/mo</th>
                    <th className="pb-2 text-right">Reviews</th>
                    <th className="pb-2 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {research.top_listings.map((l: any) => (
                    <tr key={l.etsy_listing_id} className="hover:bg-gray-50">
                      <td className="py-2 pr-4">
                        <Link
                          href={`/grader?id=${l.etsy_listing_id}`}
                          className="text-gray-800 hover:text-orange-600 line-clamp-1 transition-colors"
                        >
                          {l.title ?? l.etsy_listing_id}
                        </Link>
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums font-semibold text-gray-700">
                        {l.est_monthly_revenue != null ? formatCurrency(l.est_monthly_revenue) : '—'}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums text-gray-500">
                        {l.num_reviews ?? '—'}
                      </td>
                      <td className="py-2 text-center">
                        {l.listing_grade
                          ? <GradeBadge grade={l.listing_grade} size="sm" />
                          : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-400">No listing data yet — run a research search for this shop first.</p>
            )}
          </div>
        </div>

        {/* Alert config sidebar */}
        <div className="space-y-4">
          {shop?.alertConfig ? (
            <AlertConfig
              config={shop.alertConfig}
              onSave={(cfg) => new Promise((res, rej) => updateAlerts(cfg, { onSuccess: res, onError: rej }))}
            />
          ) : (
            <div className="rounded-2xl border bg-white p-5">
              {isLoading
                ? <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 rounded bg-gray-100 animate-pulse" />)}</div>
                : <p className="text-sm text-gray-400">Alert configuration unavailable.</p>}
            </div>
          )}

          <div className="rounded-2xl border bg-white p-4 text-center">
            <p className="text-xs text-gray-400 mb-2">Want full niche data for this shop?</p>
            <Link
              href={`/research/${encodeURIComponent(shop?.shopName ?? shopId)}`}
              className="text-xs font-medium text-orange-600 hover:underline"
            >
              View niche analysis →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
