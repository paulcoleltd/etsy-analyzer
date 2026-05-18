import { cn } from '@/lib/utils'

interface Props {
  dimension: string
  score: number
  weight: number
}

const DIMENSION_LABELS: Record<string, { label: string; hint: string }> = {
  title:       { label: 'Title',       hint: 'Keyword placement & length' },
  tags:        { label: 'Tags',        hint: 'Count & relevance (max 13)' },
  description: { label: 'Description', hint: 'Length, structure & CTAs' },
  photos:      { label: 'Photos',      hint: 'Count & image quality' },
  price:       { label: 'Price',       hint: 'vs category median' },
  shipping:    { label: 'Shipping',    hint: 'Free shipping conversion boost' },
}

function scoreColor(score: number) {
  if (score >= 80) return { bar: 'bg-green-500', text: 'text-green-700' }
  if (score >= 60) return { bar: 'bg-teal-500',  text: 'text-teal-700'  }
  if (score >= 40) return { bar: 'bg-amber-500', text: 'text-amber-700' }
  return { bar: 'bg-red-500', text: 'text-red-700' }
}

export function DimensionCard({ dimension, score, weight }: Props) {
  const meta = DIMENSION_LABELS[dimension] ?? { label: dimension, hint: '' }
  const colors = scoreColor(score)

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-semibold text-gray-800">{meta.label}</p>
          <p className="text-xs text-gray-400">{meta.hint}</p>
        </div>
        <span className={cn('text-lg font-bold tabular-nums', colors.text)}>
          {score.toFixed(0)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', colors.bar)}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-gray-400">Weight: {(weight * 100).toFixed(0)}%</p>
    </div>
  )
}
