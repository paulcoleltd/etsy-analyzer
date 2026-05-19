'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  'Jewelry', 'Clothing', 'Home & Living', 'Art & Collectibles',
  'Craft Supplies & Tools', 'Weddings', 'Toys & Games', 'Bath & Beauty',
]

interface Filters {
  category?: string
  minPrice?: number
  maxPrice?: number
  minReviews?: number
  minScore?: number
}

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
}

function NumInput({ label, value, onChange, placeholder }: {
  label: string
  value?: number
  onChange: (v: number | undefined) => void
  placeholder: string
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <input
        type="number"
        value={value ?? ''}
        onChange={e => onChange(e.target.value ? Number(e.target.value) : undefined)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500/20 transition-all"
      />
    </div>
  )
}

export function FilterSidebar({ filters, onChange }: Props) {
  return (
    <div className="space-y-4">
      {/* Category */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Category</p>
        <div className="space-y-0.5">
          <button
            onClick={() => onChange({ ...filters, category: undefined })}
            className={cn(
              'w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors',
              !filters.category
                ? 'bg-orange-50 text-orange-700'
                : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            All categories
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => onChange({ ...filters, category: cat })}
              className={cn(
                'w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors',
                filters.category === cat
                  ? 'bg-orange-50 text-orange-700'
                  : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Price (USD)</p>
        <div className="flex gap-2">
          <NumInput label="Min" value={filters.minPrice} onChange={v => onChange({ ...filters, minPrice: v })} placeholder="0" />
          <NumInput label="Max" value={filters.maxPrice} onChange={v => onChange({ ...filters, maxPrice: v })} placeholder="Any" />
        </div>
      </div>

      {/* Min reviews */}
      <NumInput
        label="Min reviews"
        value={filters.minReviews}
        onChange={v => onChange({ ...filters, minReviews: v })}
        placeholder="e.g. 50"
      />

      {/* Min score */}
      <NumInput
        label="Min opportunity score"
        value={filters.minScore}
        onChange={v => onChange({ ...filters, minScore: v })}
        placeholder="e.g. 50"
      />

      {/* Clear */}
      {Object.values(filters).some(v => v != null) && (
        <button
          onClick={() => onChange({})}
          className="w-full rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}
