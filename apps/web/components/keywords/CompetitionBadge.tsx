import { cn } from '@/lib/utils'

const MAP: Record<string, string> = {
  low:    'border border-emerald-200 bg-emerald-50 text-emerald-700',
  medium: 'border border-amber-200 bg-amber-50 text-amber-700',
  high:   'border border-red-200 bg-red-50 text-red-700',
}

export function CompetitionBadge({ level }: { level: string }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
      MAP[level?.toLowerCase()] ?? 'border border-slate-200 bg-slate-100 text-slate-600',
    )}>
      {level ?? '—'}
    </span>
  )
}
