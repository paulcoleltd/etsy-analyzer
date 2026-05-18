import { cn, formatCurrency, formatNumber } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

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
}

function formatValue(value: number, format: Props['format']): string {
  if (format === 'currency') return formatCurrency(value)
  if (format === 'count' || format === 'number') return formatNumber(value)
  return formatCurrency(value)
}

export function KPICard({ title, data, loading, format = 'currency' }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-5 space-y-3">
        <div className="h-3.5 w-24 rounded bg-gray-200 animate-pulse" />
        <div className="h-8 w-32 rounded bg-gray-200 animate-pulse" />
        <div className="h-3 w-16 rounded bg-gray-200 animate-pulse" />
      </div>
    )
  }

  const value = data?.value ?? 0
  const pct = data?.pct_change

  return (
    <div className="rounded-2xl border bg-white p-5 hover:shadow-sm transition-shadow">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900 tabular-nums">
        {formatValue(value, format)}
      </p>
      {pct != null && (
        <div className={cn(
          'mt-2 flex items-center gap-1 text-xs font-medium',
          pct > 0 ? 'text-green-600' : pct < 0 ? 'text-red-500' : 'text-gray-400',
        )}>
          {pct > 0
            ? <TrendingUp className="h-3.5 w-3.5" />
            : pct < 0
              ? <TrendingDown className="h-3.5 w-3.5" />
              : <Minus className="h-3.5 w-3.5" />}
          {Math.abs(pct).toFixed(1)}% vs prev period
        </div>
      )}
    </div>
  )
}
