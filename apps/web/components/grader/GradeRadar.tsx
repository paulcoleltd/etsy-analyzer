'use client'

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from 'recharts'

interface Props {
  scores: Record<string, number>
}

const LABELS: Record<string, string> = {
  title: 'Title', tags: 'Tags', description: 'Description',
  photos: 'Photos', price: 'Price', shipping: 'Shipping',
}

export function GradeRadar({ scores }: Props) {
  const data = Object.entries(scores).map(([key, value]) => ({
    dimension: LABELS[key] ?? key,
    score: value,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="#f3f4f6" />
        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: '#6b7280' }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#d1d5db' }} tickCount={4} />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#f97316"
          fill="#f97316"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Tooltip
          formatter={(v: number) => [`${v.toFixed(0)}/100`, 'Score']}
          contentStyle={{ border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
