'use client'

import { GradeBadge } from './GradeBadge'
import { GradeRadar } from './GradeRadar'
import { DimensionCard } from './DimensionCard'
import { SuggestionsPanel } from './SuggestionsPanel'

const WEIGHTS: Record<string, number> = {
  title: 0.25, tags: 0.20, description: 0.15,
  photos: 0.20, price: 0.10, shipping: 0.10,
}

interface GradeData {
  etsy_listing_id: string
  overall_grade: string
  overall_score: number
  dimension_scores: Record<string, number>
  ai_suggestions: Record<string, unknown> | null
  image_analysis: unknown[] | null
  graded_at?: string | null
}

interface Props {
  data: GradeData
  title?: string | null
}

export function GradeReport({ data, title }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border bg-white p-6 flex items-start gap-6">
        <GradeBadge grade={data.overall_grade} size="lg" />
        <div className="flex-1">
          {title && <p className="text-sm font-medium text-gray-900 line-clamp-2">{title}</p>}
          <p className="text-xs text-gray-400 mt-0.5">
            ID: {data.etsy_listing_id}
            {data.graded_at && ` · Graded ${new Date(data.graded_at).toLocaleDateString()}`}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-2.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-orange-500 transition-all duration-700"
                style={{ width: `${data.overall_score}%` }}
              />
            </div>
            <span className="text-sm font-bold text-gray-700 tabular-nums w-12 text-right">
              {data.overall_score.toFixed(0)}/100
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar chart */}
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm font-semibold text-gray-700 mb-2">Score breakdown</p>
          <GradeRadar scores={data.dimension_scores} />
        </div>

        {/* Dimension cards */}
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(data.dimension_scores).map(([dim, score]) => (
            <DimensionCard
              key={dim}
              dimension={dim}
              score={score}
              weight={WEIGHTS[dim] ?? 0}
            />
          ))}
        </div>
      </div>

      {/* AI Suggestions */}
      {data.ai_suggestions && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">AI-powered suggestions</h3>
          <SuggestionsPanel suggestions={data.ai_suggestions as unknown as Parameters<typeof SuggestionsPanel>[0]['suggestions']} />
        </div>
      )}
    </div>
  )
}
