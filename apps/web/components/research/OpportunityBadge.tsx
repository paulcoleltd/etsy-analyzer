import { cn } from '@/lib/utils'

interface Props {
  score: number | null | undefined
  size?: 'sm' | 'md'
}

function scoreColor(s: number) {
  if (s >= 70) return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  if (s >= 50) return 'bg-blue-50 text-blue-700 border border-blue-200'
  if (s >= 30) return 'bg-amber-50 text-amber-700 border border-amber-200'
  return 'bg-red-50 text-red-700 border border-red-200'
}

export function OpportunityBadge({ score, size = 'sm' }: Props) {
  if (score == null) return null
  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-bold tabular-nums',
      scoreColor(score),
      size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-sm',
    )}>
      {score.toFixed(0)}
    </span>
  )
}
