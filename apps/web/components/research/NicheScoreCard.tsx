'use client'

import { cn } from '@/lib/utils'

interface Props {
  score: number
  rating: string
  components: { volume: number; competition: number; avg_reviews: number; trend: string }
  totalListings: number
}

const RATING_CFG = {
  excellent: { text: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200', bar: 'bg-gradient-to-r from-emerald-400 to-emerald-500' },
  good:      { text: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200',    bar: 'bg-gradient-to-r from-blue-400 to-blue-500'       },
  moderate:  { text: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200',   bar: 'bg-gradient-to-r from-amber-400 to-amber-500'     },
  saturated: { text: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-200',     bar: 'bg-gradient-to-r from-red-400 to-red-500'         },
} as const

export function NicheScoreCard({ score, rating, components, totalListings }: Props) {
  const cfg = RATING_CFG[rating as keyof typeof RATING_CFG] ?? RATING_CFG.moderate

  return (
    <div className={cn('rounded-2xl border p-6 shadow-sm', cfg.bg, cfg.border)}>
      {/* Score header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Niche Score</p>
          <p className={cn('text-5xl font-extrabold tabular-nums leading-none mt-1', cfg.text)}>
            {score.toFixed(0)}
          </p>
          <span className={cn('mt-1.5 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize', cfg.text, cfg.bg, cfg.border)}>
            {rating}
          </span>
        </div>

        {/* Arc gauge */}
        <div className="relative h-16 w-16">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f97316" strokeWidth="3.5" strokeDasharray={`${score}, 100`} strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Score bar */}
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/60">
        <div className={cn('h-full rounded-full transition-all duration-700', cfg.bar)} style={{ width: `${score}%` }} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 border-t border-current/10 pt-4">
        {[
          { label: 'Est. searches/mo', value: components.volume.toLocaleString() },
          { label: 'Listings',         value: totalListings.toLocaleString()      },
          { label: 'Avg reviews',      value: components.avg_reviews.toFixed(0)   },
          { label: 'Trend',            value: components.trend,  cap: true         },
        ].map(({ label, value, cap }) => (
          <div key={label}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
            <p className={cn('mt-0.5 text-sm font-bold text-slate-800', cap && 'capitalize')}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
