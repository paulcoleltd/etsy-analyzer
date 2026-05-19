import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function gradeColor(grade: string): string {
  const map: Record<string, string> = {
    A: 'text-green-600 bg-green-50',
    B: 'text-teal-600 bg-teal-50',
    C: 'text-amber-600 bg-amber-50',
    D: 'text-orange-600 bg-orange-50',
    F: 'text-red-600 bg-red-50',
  }
  return map[grade] ?? 'text-slate-600 bg-slate-50'
}
