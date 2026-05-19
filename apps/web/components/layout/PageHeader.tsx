import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  icon: LucideIcon
  iconColor?: string   // tailwind text-* class
  iconBg?: string      // tailwind bg-* class
  title: string
  subtitle?: string
  badge?: string
  badgeColor?: string  // tailwind classes for the badge pill
  actions?: React.ReactNode
}

/**
 * Consistent page header used on every authenticated inside-app page.
 * Gives a white card header strip with a coloured left-border accent.
 */
export function PageHeader({
  icon: Icon,
  iconColor = 'text-orange-500',
  iconBg    = 'bg-orange-50',
  title,
  subtitle,
  badge,
  badgeColor = 'bg-orange-100 text-orange-700',
  actions,
}: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Icon blob */}
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', iconBg)}>
          <Icon className={cn('h-4.5 w-4.5', iconColor)} size={18} />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900">{title}</h1>
            {badge && (
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', badgeColor)}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
