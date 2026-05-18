import { cn } from '@/lib/utils'

interface Props {
  grade: string
  size?: 'sm' | 'md' | 'lg'
}

const GRADE_STYLES: Record<string, string> = {
  A: 'bg-green-100 text-green-700 ring-green-200',
  B: 'bg-teal-100 text-teal-700 ring-teal-200',
  C: 'bg-amber-100 text-amber-700 ring-amber-200',
  D: 'bg-orange-100 text-orange-700 ring-orange-200',
  F: 'bg-red-100 text-red-700 ring-red-200',
}

const SIZE_STYLES = {
  sm: 'h-7 w-7 text-sm font-bold ring-1',
  md: 'h-12 w-12 text-xl font-extrabold ring-2',
  lg: 'h-20 w-20 text-4xl font-extrabold ring-2',
}

export function GradeBadge({ grade, size = 'md' }: Props) {
  const style = GRADE_STYLES[grade] ?? 'bg-gray-100 text-gray-600 ring-gray-200'
  return (
    <span className={cn('inline-flex items-center justify-center rounded-full', style, SIZE_STYLES[size])}>
      {grade}
    </span>
  )
}
