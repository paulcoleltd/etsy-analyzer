import { cn } from '@/lib/utils'

const MAP = {
  low:    'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high:   'bg-red-100 text-red-700',
} as const

export function CompetitionBadge({ competition }: { competition: string }) {
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize',
      MAP[competition as keyof typeof MAP] ?? 'bg-gray-100 text-gray-600')}>
      {competition}
    </span>
  )
}
