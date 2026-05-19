'use client'

import { GradeBadge } from './GradeBadge'
import { GradeRadar } from './GradeRadar'
import { DimensionCard } from './DimensionCard'
import { SuggestionsPanel } from './SuggestionsPanel'
import { ExternalLink } from 'lucide-react'

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

export function GradeReport({ data, title }: { data: GradeData; title?: string | null }) {
  return (
    <div className="divide-y divide-slate-100">

      {/* ── Header strip ── */}
      <div className="flex items-start gap-5 p-6">
        <GradeBadge grade={data.overall_grade} size="lg" />
        <div className="flex-1">
          {title && (
            <p className="mb-1 text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">{title}</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overall score</p>
              <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
                {data.overall_score.toFixed(0)}<span className="text-sm font-normal text-slate-400">/100</span>
              </p>
            </div>
            {data.graded_at && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Graded</p>
                <p className="text-sm text-slate-600">{new Date(data.graded_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>
          <a
            href={`https://www.etsy.com/listing/${data.etsy_listing_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors"
          >
            View on Etsy <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* ── Radar chart ── */}
      {Object.keys(data.dimension_scores).length > 2 && (
        <div className="p-6">
          <p className="section-label mb-3">Score radar</p>
          <GradeRadar scores={data.dimension_scores} />
        </div>
      )}

      {/* ── Dimension cards ── */}
      <div className="p-6">
        <p className="section-label mb-3">Dimension breakdown</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* ── AI suggestions ── */}
      {data.ai_suggestions && (
        <div className="p-6">
          <p className="section-label mb-3">AI improvement suggestions</p>
          <SuggestionsPanel suggestions={data.ai_suggestions as any} />
        </div>
      )}
    </div>
  )
}
