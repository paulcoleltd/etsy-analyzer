'use client'

import { useState } from 'react'

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

export function FilterSidebar({ filters, onChange }: Props) {
  return (
    <aside className="w-56 shrink-0 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Category</p>
        <div className="space-y-1">
          <button
            onClick={() => onChange({ ...filters, category: undefined })}
            className={`w-full text-left text-sm px-2 py-1 rounded ${!filters.category ? 'bg-orange-50 text-orange-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            All categories
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => onChange({ ...filters, category: cat })}
              className={`w-full text-left text-sm px-2 py-1 rounded ${filters.category === cat ? 'bg-orange-50 text-orange-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Min opportunity</p>
        {[0, 30, 50, 70].map(v => (
          <button
            key={v}
            onClick={() => onChange({ ...filters, minScore: v || undefined })}
            className={`mr-2 mb-1 rounded-full px-3 py-1 text-xs border ${filters.minScore === (v || undefined) ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {v === 0 ? 'Any' : `${v}+`}
          </button>
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Min reviews</p>
        {[undefined, 10, 50, 100].map(v => (
          <button
            key={String(v)}
            onClick={() => onChange({ ...filters, minReviews: v })}
            className={`mr-2 mb-1 rounded-full px-3 py-1 text-xs border ${filters.minReviews === v ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {v == null ? 'Any' : `${v}+`}
          </button>
        ))}
      </div>
    </aside>
  )
}
