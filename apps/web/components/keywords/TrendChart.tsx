'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { formatNumber } from '@/lib/utils'

interface TrendPoint { date: string; volume_est: number }

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg">
      <p className="mb-1 text-xs text-slate-400">{label}</p>
      <p className="text-sm font-bold text-slate-900">{formatNumber(payload[0].value)} searches</p>
    </div>
  )
}

export function TrendChart({ data, period }: { data: TrendPoint[]; period?: string }) {
  if (!data?.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400">
        No trend data available
      </div>
    )
  }

  const formatted = data.map(d => ({
    ...d,
    month: new Date(d.date).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
  }))

  const avg = data.reduce((s, d) => s + d.volume_est, 0) / data.length

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false} tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={v => formatNumber(v)}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false} tickLine={false}
          width={44}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={avg}
          stroke="#cbd5e1"
          strokeDasharray="4 4"
          label={{ value: 'avg', position: 'insideTopRight', fontSize: 10, fill: '#94a3b8' }}
        />
        <Line
          type="monotone"
          dataKey="volume_est"
          stroke="#f97316"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4, fill: '#f97316', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
