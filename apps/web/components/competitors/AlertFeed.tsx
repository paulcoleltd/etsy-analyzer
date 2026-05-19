import { Bell, Check, Tag, TrendingUp, Star, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

const TYPE_CONFIG: Record<string, { color: string; dot: string; icon: React.ElementType }> = {
  new_listing:      { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: Tag        },
  price_change:     { color: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500',   icon: TrendingUp  },
  review_milestone: { color: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-500',    icon: Star        },
  grade_complete:   { color: 'bg-violet-50 text-violet-700 border-violet-200',    dot: 'bg-violet-500',  icon: AlertCircle },
}

const DEFAULT_CONFIG = { color: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400', icon: Bell }

export function AlertFeed({ notifications, onMarkRead }: {
  notifications: Notification[]
  onMarkRead: (id: string) => void
}) {
  return (
    <div className="divide-y divide-slate-100">
      {notifications.map(n => {
        const cfg = TYPE_CONFIG[n.type] ?? DEFAULT_CONFIG
        const Icon = cfg.icon
        return (
          <div
            key={n.id}
            className={cn(
              'flex items-start gap-4 px-5 py-4 transition-colors',
              n.read ? 'bg-white' : 'bg-orange-50/40',
            )}
          >
            {/* Icon circle */}
            <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border', cfg.color)}>
              <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={cn('text-sm font-semibold', n.read ? 'text-slate-700' : 'text-slate-900')}>
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{n.body}</p>
                </div>
                {!n.read && (
                  <button
                    onClick={() => onMarkRead(n.id)}
                    className="shrink-0 flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    <Check className="h-3 w-3" /> Mark read
                  </button>
                )}
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize', cfg.color)}>
                  {n.type.replace(/_/g, ' ')}
                </span>
                <span className="text-[11px] text-slate-400">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Unread dot */}
            {!n.read && (
              <div className={cn('mt-2 h-2 w-2 shrink-0 rounded-full', cfg.dot)} />
            )}
          </div>
        )
      })}
    </div>
  )
}
