import { cn, formatCurrency } from '@/lib/utils'

interface Props {
  revenue: number | null | undefined
  confidence?: string | null
}

function revenueColor(revenue: number) {
  if (revenue >= 500) return 'bg-green-100 text-green-700'
  if (revenue >= 100) return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-600'
}

export function RevenueBadge({ revenue, confidence }: Props) {
  if (revenue == null) return <span className="text-xs text-gray-400">—</span>
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', revenueColor(revenue))}>
      {formatCurrency(revenue)}/mo
      {confidence === 'low' && <span className="opacity-50">~</span>}
    </span>
  )
}
