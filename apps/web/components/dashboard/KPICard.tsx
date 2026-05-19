import { cn, formatCurrency, formatNumber } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react'

interface KPIData {
  value: number
  prev_value?: number | null
  pct_change?: number | null
  unit?: string
}

interface Props {
  title: string
  data: KPIData | undefined
  loading?: boolean
  format?: 'currency' | 'number' | 'count'
  icon?: LucideIcon
  color?: 'orange' | 'blue' | 'green' | 'purple' | 'rose'
}

const COLOR_MAP = {
  orange: { gradient: 'from-orange-500 to-orange-600', light: 'bg-orange-50', icon: 'text-orange-500' },
  blue:   { gradient: 'from-blue-500 to-blue-600',     light: 'bg-blue-50',   icon: 'text-blue-500'   },
  green:  { gradient: 'from-emerald-500 to-emerald-600', light: 'bg-emerald-50', icon: 'text-emerald-500' },
  purple: { gradient: 'from-violet-500 to-violet-600', light: 'bg-violet-50', icon: 'text-violet-500' },
  rose:   { gradient: 'from-rose-500 to-rose-600',     light: 'bg-rose-50',   icon: 'text-rose-500'   },
}

function formatValue(value: number, format: Props['format']): string {
  if (format === 'currency') return formatCurrency(value)
  if (format === 'count' || format === 'number') return formatNumber(value)
  return formatCurrency(value)
}

export function KPICard({ title, data, loading, format = 'currency', icon: Icon, color = 'orange' }: Props) {
  const c = COLOR_MAP[color]

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
        <div className="h-3 w-24 rounded-full bg-slate-200 animate-pulse" />
        <div className="h-8 w-32 rounded-full bg-slate-200 animate-pulse" />
        <div className="h-3 w-16 rounded-full bg-slate-200 animate-pulse" />
      </div>
    )
  }

  const value  = data?.value ?? 0
  const pct    = data?.pct_change
  const isUp   = pct != null && pct > 0
  const isDown = pct != null && pct < 0

  return (
    <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      {/* Accent bar on hover */}
      <div className={cn('absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300', c.gradient)} />

      {/* Header */}
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
        {Icon && (
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', c.light)}>
            <Icon className={cn('h-4 w-4', c.icon)} />
          </div>
        )}
      </div>

      {/* Value */}
      <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900 tracking-tight">
        {formatValue(value, format)}
      </p>

      {/* Trend pill */}
      {pct != null ? (
        <div className={cn(
          'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
          isUp   && 'bg-emerald-50 text-emerald-700',
          isDown && 'bg-red-50 text-red-600',
          !isUp && !isDown && 'bg-slate-100 text-slate-500',
        )}>
          {isUp   && <TrendingUp   className="h-3 w-3" />}
          {isDown && <TrendingDown className="h-3 w-3" />}
          {!isUp && !isDown && <Minus className="h-3 w-3" />}
          {isUp ? '+' : ''}{Math.abs(pct).toFixed(1)}% vs prev
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-400">No comparison data</p>
      )}
    </div>
  )
}
