'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface RevenuePoint { date: string; revenue: number }

interface Props {
  data: RevenuePoint[] | undefined
  loading?: boolean
  granularity?: string
}

function fmtDate(date: string, g: string) {
  const d = new Date(date)
  if (g === 'month') return d.toLocaleDateString('en-GB', { month: 'short' })
  if (g === 'week')  return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
  return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg">
      <p className="mb-1 text-xs text-slate-400">{label}</p>
      <p className="text-sm font-bold text-slate-900">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export function RevenueChart({ data, loading, granularity = 'day' }: Props) {
  if (loading) {
    return <div className="h-56 animate-pulse rounded-xl bg-slate-100" />
  }

  const formatted = (data ?? []).map(p => ({
    ...p,
    label: fmtDate(p.date, granularity),
  }))

  if (!formatted.length) {
    return (
      <div className="flex h-56 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200">
        <p className="text-sm text-slate-400">No revenue data yet</p>
        <p className="mt-1 text-xs text-slate-300">Connect your Etsy shop to see your chart</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#f97316" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#f97316" stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false} tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false} tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#f97316"
          strokeWidth={2.5}
          fill="url(#revGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#f97316', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
