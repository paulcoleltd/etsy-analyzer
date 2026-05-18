'use client'

import { useState } from 'react'
import Link from 'next/link'
import { RefreshCw, Loader2, PlugZap, ArrowRight } from 'lucide-react'
import { useDashboardOverview, useDashboardRevenue, useTriggerSync } from '@/hooks/useDashboard'
import { KPICard } from '@/components/dashboard/KPICard'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { TopListingsTable } from '@/components/dashboard/TopListingsTable'
import { useQueryClient } from '@tanstack/react-query'

type Period = '7d' | '30d' | '90d'
type Granularity = 'day' | 'week' | 'month'

const PERIOD_CONFIG: Record<Period, { days: number; granularity: Granularity; label: string }> = {
  '7d':  { days: 7,  granularity: 'day',   label: '7 days'   },
  '30d': { days: 30, granularity: 'day',   label: '30 days'  },
  '90d': { days: 90, granularity: 'week',  label: '90 days'  },
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const cfg = PERIOD_CONFIG[period]
  const qc = useQueryClient()

  const { data: overview, isLoading: overviewLoading } = useDashboardOverview(period)
  const { data: revenueData, isLoading: revenueLoading } = useDashboardRevenue(
    daysAgo(cfg.days), new Date().toISOString().split('T')[0], cfg.granularity,
  )
  const { mutate: triggerSync, isPending: syncing } = useTriggerSync()

  const ov = overview as Record<string, any> | undefined
  const rv = revenueData as Record<string, any> | undefined

  const etsyConnected = ov?.etsy_connected ?? false

  function handleSync() {
    triggerSync(undefined, {
      onSuccess: () => {
        setTimeout(() => qc.invalidateQueries({ queryKey: ['dashboard'] }), 3000)
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {ov?.shop_name ? `${ov.shop_name}` : 'Dashboard'}
          </h1>
          {ov?.last_synced && (
            <p className="mt-0.5 text-xs text-gray-400">
              Last synced {new Date(ov.last_synced).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex gap-1 rounded-lg border bg-white p-0.5">
            {(['7d', '30d', '90d'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === p
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {PERIOD_CONFIG[p].label}
              </button>
            ))}
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            {syncing
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <RefreshCw className="h-3.5 w-3.5" />}
            Sync
          </button>
        </div>
      </div>

      {/* Etsy not connected banner */}
      {!overviewLoading && !etsyConnected && (
        <div className="flex items-center justify-between rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <PlugZap className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm font-semibold text-orange-800">Connect your Etsy shop</p>
              <p className="text-xs text-orange-600">Sync transactions and listing data to see your real analytics.</p>
            </div>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition-colors"
          >
            Connect <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard
          title="Revenue today"
          data={ov?.revenue_today}
          loading={overviewLoading}
          format="currency"
        />
        <KPICard
          title={`Revenue ${cfg.label}`}
          data={ov?.revenue_30d}
          loading={overviewLoading}
          format="currency"
        />
        <KPICard
          title="Orders 30d"
          data={ov?.orders_30d}
          loading={overviewLoading}
          format="count"
        />
        <KPICard
          title="Avg order value"
          data={ov?.avg_order_value}
          loading={overviewLoading}
          format="currency"
        />
      </div>

      {/* Revenue chart + Top listings */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Revenue over time</p>
            <span className="text-xs text-gray-400">{cfg.label}</span>
          </div>
          <RevenueChart
            data={rv?.data}
            loading={revenueLoading}
            granularity={cfg.granularity}
          />
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Top listings</p>
            <Link href="/dashboard/listings" className="text-xs text-orange-600 hover:underline">
              View all
            </Link>
          </div>
          <TopListingsTable
            listings={ov?.top_listings}
            loading={overviewLoading}
          />
        </div>
      </div>
    </div>
  )
}
