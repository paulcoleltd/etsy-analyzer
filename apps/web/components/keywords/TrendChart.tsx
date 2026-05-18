'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatNumber } from '@/lib/utils'

interface TrendPoint { date: string; volume_est: number }

interface Props {
  data: TrendPoint[]
  keyword: string
}

export function TrendChart({ data, keyword }: Props) {
  const formatted = data.map(d => ({
    ...d,
    month: new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
  }))

  return (
    <div className="rounded-xl border bg-white p-5">
      <p className="text-sm font-semibold text-gray-700 mb-4">
        Search volume trend — <span className="text-orange-600">{keyword}</span>
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={formatNumber} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            formatter={(v: number) => [formatNumber(v), 'Est. searches']}
            contentStyle={{ border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
          />
          <Line type="monotone" dataKey="volume_est" stroke="#f97316" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
