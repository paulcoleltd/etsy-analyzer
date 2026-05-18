'use client'

import { cn } from '@/lib/utils'

interface Props {
  score: number
  rating: string
  components: {
    volume: number
    competition: number
    avg_reviews: number
    trend: string
  }
  totalListings: number
}

const ratingConfig = {
  excellent: { color: 'text-green-600', bg: 'bg-green-50', ring: 'ring-green-200' },
  good:      { color: 'text-teal-600',  bg: 'bg-teal-50',  ring: 'ring-teal-200'  },
  moderate:  { color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-200' },
  saturated: { color: 'text-red-600',   bg: 'bg-red-50',   ring: 'ring-red-200'   },
} as const

export function NicheScoreCard({ score, rating, components, totalListings }: Props) {
  const cfg = ratingConfig[rating as keyof typeof ratingConfig] ?? ratingConfig.moderate

  return (
    <div className={cn('rounded-2xl border p-6 ring-1', cfg.bg, cfg.ring)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">Niche Score</p>
          <p className={cn('text-6xl font-extrabold tabular-nums mt-1', cfg.color)}>
            {score.toFixed(0)}
          </p>
          <p className={cn('text-sm font-semibold capitalize mt-1', cfg.color)}>{rating}</p>
        </div>
        {/* Score arc */}
        <div className="relative h-20 w-20">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${score}, 100`}
              className={cfg.color}
            />
          </svg>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
        <Stat label="Est. searches/mo" value={components.volume.toLocaleString()} />
        <Stat label="Competing listings" value={totalListings.toLocaleString()} />
        <Stat label="Avg reviews" value={components.avg_reviews.toFixed(0)} />
        <Stat label="Trend" value={components.trend} capitalize />
      </div>
    </div>
  )
}

function Stat({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={cn('text-sm font-semibold text-gray-900 mt-0.5', capitalize && 'capitalize')}>
        {value}
      </p>
    </div>
  )
}
