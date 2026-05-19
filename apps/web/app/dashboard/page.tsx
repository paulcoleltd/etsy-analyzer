'use client'

import { useState } from 'react'
import Link from 'next/link'
import { RefreshCw, Loader2, PlugZap, ArrowRight, DollarSign, ShoppingBag, TrendingUp, BarChart3, LayoutDashboard } from 'lucide-react'
import { useDashboardOverview, useDashboardRevenue, useTriggerSync } from '@/hooks/useDashboard'
import { KPICard } from '@/components/dashboard/KPICard'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { TopListingsTable } from '@/components/dashboard/TopListingsTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

type Period = '7d' | '30d' | '90d'
type Granularity = 'day' | 'week' | 'month'

const PERIOD_CONFIG: Record<Period, { days: number; granularity: Granularity; label: string }> = {
  '7d':  { days: 7,  granularity: 'day',  label: '7 days'  },
  '30d': { days: 30, granularity: 'day',  label: '30 days' },
  '90d': { days: 90, granularity: 'week', label: '90 days' },
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
      onSuccess: () => { setTimeout(() => qc.invalidateQueries({ queryKey: ['dashboard'] }), 3000) },
    })
  }

  const lastSynced = ov?.last_synced
    ? `Last synced ${new Date(ov.last_synced).toLocaleString()}`
    : 'Connect your Etsy shop to see live data'

  return (
    <div className="space-y-5 animate-fade-up">

      {/* ── Page header ── */}
      <PageHeader
        icon={LayoutDashboard}
        iconColor="text-orange-500"
        iconBg="bg-orange-50"
        title={ov?.shop_name ?? 'Dashboard'}
        subtitle={lastSynced}
        actions={
          <div className="flex items-center gap-2">
            {/* Period tabs */}
            <div className="tab-row">
              {(['7d', '30d', '90d'] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn('tab-item', period === p && 'tab-item-active')}
                >
                  {PERIOD_CONFIG[p].label}
                </button>
              ))}
            </div>

            {/* Sync */}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="btn-ghost !px-3 !py-2 text-xs"
            >
              {syncing
                ? <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500" />
                : <RefreshCw className="h-3.5 w-3.5" />}
              Sync
            </button>
          </div>
        }
      />

      {/* ── Connect Etsy banner ── */}
      {!overviewLoading && !etsyConnected && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-orange-200/80 bg-gradient-to-r from-orange-50 to-amber-50/40 px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 shadow-md shadow-orange-500/30">
              <PlugZap className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-orange-900">Connect your Etsy shop</p>
              <p className="text-xs text-orange-600">Sync transactions and listing data to unlock real analytics.</p>
            </div>
          </div>
          <Link href="/settings" className="btn-primary !py-2 !text-xs shrink-0">
            Connect <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="Revenue today"          data={ov?.revenue_today}   loading={overviewLoading} format="currency" icon={DollarSign}  color="orange" />
        <KPICard title={`Revenue ${cfg.label}`} data={ov?.revenue_30d}     loading={overviewLoading} format="currency" icon={TrendingUp}  color="blue"   />
        <KPICard title="Orders 30d"             data={ov?.orders_30d}      loading={overviewLoading} format="count"    icon={ShoppingBag} color="green"  />
        <KPICard title="Avg order value"        data={ov?.avg_order_value} loading={overviewLoading} format="currency" icon={BarChart3}   color="purple" />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Revenue chart */}
        <div className="lg:col-span-2 card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800">Revenue over time</p>
              <p className="text-xs text-slate-400 mt-0.5">{cfg.label} · {cfg.granularity} intervals</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              {cfg.label}
            </span>
          </div>
          <RevenueChart data={rv?.data} loading={revenueLoading} granularity={cfg.granularity} />
        </div>

        {/* Top listings */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800">Top listings</p>
              <p className="text-xs text-slate-400 mt-0.5">By revenue · {cfg.label}</p>
            </div>
            <Link href="/dashboard/listings" className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 transition-colors">
              View all →
            </Link>
          </div>
          <TopListingsTable listings={ov?.top_listings} loading={overviewLoading} />
        </div>
      </div>
    </div>
  )
}
