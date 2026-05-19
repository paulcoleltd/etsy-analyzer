import { cn } from '@/lib/utils'

interface Props {
  grade: string
  size?: 'sm' | 'md' | 'lg'
}

const GRADE_STYLES: Record<string, string> = {
  'A+': 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30',
  A:    'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30',
  'A-': 'bg-emerald-400 text-white shadow-lg shadow-emerald-400/30',
  'B+': 'bg-blue-500 text-white shadow-lg shadow-blue-500/30',
  B:    'bg-blue-500 text-white shadow-lg shadow-blue-500/30',
  'B-': 'bg-blue-400 text-white shadow-lg shadow-blue-400/30',
  'C+': 'bg-amber-500 text-white shadow-lg shadow-amber-500/30',
  C:    'bg-amber-500 text-white shadow-lg shadow-amber-500/30',
  'C-': 'bg-amber-400 text-white shadow-lg shadow-amber-400/30',
  D:    'bg-orange-500 text-white shadow-lg shadow-orange-500/30',
  F:    'bg-red-500 text-white shadow-lg shadow-red-500/30',
}

const SIZE_STYLES = {
  sm: 'h-7 w-7 text-xs font-extrabold',
  md: 'h-12 w-12 text-xl font-extrabold',
  lg: 'h-20 w-20 text-4xl font-extrabold',
}

export function GradeBadge({ grade, size = 'md' }: Props) {
  const baseGrade = grade.charAt(0).toUpperCase()
  const style = GRADE_STYLES[grade] ?? GRADE_STYLES[baseGrade] ?? 'bg-slate-200 text-slate-600'
  return (
    <span className={cn('inline-flex items-center justify-center rounded-2xl', style, SIZE_STYLES[size])}>
      {grade}
    </span>
  )
}
