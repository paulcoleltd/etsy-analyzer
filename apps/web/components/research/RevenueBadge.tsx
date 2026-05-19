import { cn, formatCurrency } from '@/lib/utils'

interface Props {
  revenue: number | null | undefined
  confidence?: string | null
}

function revenueColor(r: number) {
  if (r >= 500) return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  if (r >= 100) return 'bg-amber-50 text-amber-700 border border-amber-200'
  return 'bg-slate-100 text-slate-600 border border-slate-200'
}

export function RevenueBadge({ revenue, confidence }: Props) {
  if (revenue == null) return <span className="text-xs text-slate-400">—</span>
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', revenueColor(revenue))}>
      {formatCurrency(revenue)}/mo
      {confidence === 'low' && <span className="opacity-50" title="Low confidence estimate">~</span>}
    </span>
  )
}
