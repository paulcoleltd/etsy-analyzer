import { cn } from '@/lib/utils'

interface Props {
  score: number | null | undefined
  size?: 'sm' | 'md'
}

function scoreColor(score: number) {
  if (score >= 70) return 'bg-green-100 text-green-700'
  if (score >= 50) return 'bg-teal-100 text-teal-700'
  if (score >= 30) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

export function OpportunityBadge({ score, size = 'sm' }: Props) {
  if (score == null) return null
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold tabular-nums',
        scoreColor(score),
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      )}
    >
      {score.toFixed(0)}
    </span>
  )
}
