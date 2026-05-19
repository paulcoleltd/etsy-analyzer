import { cn } from '@/lib/utils'

interface Props {
  dimension: string
  score: number
  weight: number
}

const META: Record<string, { label: string; hint: string }> = {
  title:       { label: 'Title',       hint: 'Keyword placement & length'        },
  tags:        { label: 'Tags',        hint: 'Count & relevance (max 13)'        },
  description: { label: 'Description', hint: 'Length, structure & CTAs'          },
  photos:      { label: 'Photos',      hint: 'Count & image quality'             },
  price:       { label: 'Price',       hint: 'vs category median'                },
  shipping:    { label: 'Shipping',    hint: 'Free shipping conversion boost'    },
}

function scoreConfig(s: number) {
  if (s >= 80) return { bar: 'bg-gradient-to-r from-emerald-400 to-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' }
  if (s >= 60) return { bar: 'bg-gradient-to-r from-blue-400 to-blue-500',       text: 'text-blue-700',    bg: 'bg-blue-50'    }
  if (s >= 40) return { bar: 'bg-gradient-to-r from-amber-400 to-amber-500',     text: 'text-amber-700',   bg: 'bg-amber-50'   }
  return         { bar: 'bg-gradient-to-r from-red-400 to-red-500',              text: 'text-red-700',     bg: 'bg-red-50'     }
}

export function DimensionCard({ dimension, score, weight }: Props) {
  const meta = META[dimension] ?? { label: dimension, hint: '' }
  const cfg  = scoreConfig(score)

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-slate-800">{meta.label}</p>
          <p className="mt-0.5 text-xs text-slate-400">{meta.hint}</p>
        </div>
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl text-sm font-extrabold', cfg.bg, cfg.text)}>
          {score.toFixed(0)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn('h-full rounded-full transition-all duration-700', cfg.bar)}
          style={{ width: `${score}%` }}
        />
      </div>

      <p className="mt-2 text-[10px] font-medium text-slate-400">
        Weight: {(weight * 100).toFixed(0)}% of total score
      </p>
    </div>
  )
}
