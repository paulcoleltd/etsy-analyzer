'use client'

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from 'recharts'

interface Props { scores: Record<string, number> }

const LABELS: Record<string, string> = {
  title: 'Title', tags: 'Tags', description: 'Desc',
  photos: 'Photos', price: 'Price', shipping: 'Shipping',
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-bold text-slate-800">{payload[0].payload.dimension}</p>
      <p className="text-slate-500">{payload[0].value.toFixed(0)} / 100</p>
    </div>
  )
}

export function GradeRadar({ scores }: Props) {
  const data = Object.entries(scores).map(([k, v]) => ({
    dimension: LABELS[k] ?? k,
    score: v,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: '#64748b' }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#cbd5e1' }} tickCount={4} axisLine={false} />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#f97316"
          fill="#f97316"
          fillOpacity={0.12}
          strokeWidth={2.5}
        />
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
