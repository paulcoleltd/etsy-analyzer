'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatCurrency, formatNumber } from '@/lib/utils'

interface RevenuePoint { date: string; revenue: number }

interface Props {
  data: RevenuePoint[] | undefined
  loading?: boolean
  granularity?: string
}

function formatAxisDate(date: string, granularity: string): string {
  const d = new Date(date)
  if (granularity === 'month') return d.toLocaleDateString('en-US', { month: 'short' })
  if (granularity === 'week')  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function RevenueChart({ data, loading, granularity = 'day' }: Props) {
  if (loading) {
    return <div className="h-56 rounded-xl bg-gray-100 animate-pulse" />
  }

  const formatted = (data ?? []).map(p => ({
    ...p,
    label: formatAxisDate(p.date, granularity),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#f97316" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0}   />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis
          tickFormatter={v => `$${formatNumber(v)}`}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false} tickLine={false} width={48}
        />
        <Tooltip
          formatter={(v: number) => [formatCurrency(v), 'Revenue']}
          contentStyle={{ border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
        />
        <Area
          type="monotone" dataKey="revenue"
          stroke="#f97316" strokeWidth={2}
          fill="url(#revenueGrad)"
          dot={false} activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
