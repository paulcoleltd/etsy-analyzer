import { Bell, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

interface Props {
  notifications: Notification[]
  onMarkRead: (id: string) => void
}

const TYPE_STYLES: Record<string, string> = {
  new_listing:      'bg-green-100 text-green-700',
  price_change:     'bg-amber-100 text-amber-700',
  review_milestone: 'bg-blue-100 text-blue-700',
  grade_complete:   'bg-purple-100 text-purple-700',
}

export function AlertFeed({ notifications, onMarkRead }: Props) {
  if (!notifications.length) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center">
        <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-400">No alerts yet — we&apos;ll notify you when tracked shops make changes.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={cn(
            'flex items-start gap-3 rounded-xl border bg-white p-4 transition-colors',
            !n.read && 'border-orange-200 bg-orange-50/40',
          )}
        >
          <span className={cn(
            'mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold capitalize',
            TYPE_STYLES[n.type] ?? 'bg-gray-100 text-gray-600',
          )}>
            {n.type.replace(/_/g, ' ')}
          </span>

          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium text-gray-800', !n.read && 'font-semibold')}>
              {n.title}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
            <p className="text-xs text-gray-300 mt-1">
              {new Date(n.createdAt).toLocaleString()}
            </p>
          </div>

          {!n.read && (
            <button
              onClick={() => onMarkRead(n.id)}
              className="shrink-0 rounded-lg p-1 text-gray-300 hover:text-green-500 hover:bg-green-50 transition-colors"
              title="Mark as read"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
