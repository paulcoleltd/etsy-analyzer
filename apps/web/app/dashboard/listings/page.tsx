'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  flexRender, createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useDashboardListings } from '@/hooks/useDashboard'
import { GradeBadge } from '@/components/grader/GradeBadge'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Listing {
  etsy_listing_id: string
  title: string | null
  listing_grade: string | null
  est_monthly_revenue: number | null
  est_monthly_units: number | null
  views_30d: number | null
  num_reviews: number
  avg_rating: number | null
  price_usd: number | null
  photo_count: number
  is_bestseller: boolean
  opportunity_score: number | null
  tags: string[]
}

const col = createColumnHelper<Listing>()

const columns = [
  col.accessor('title', {
    header: 'Listing',
    cell: info => (
      <Link
        href={`/grader?id=${info.row.original.etsy_listing_id}`}
        className="line-clamp-2 font-medium text-gray-800 hover:text-orange-600 transition-colors max-w-xs"
      >
        {info.getValue() ?? info.row.original.etsy_listing_id}
      </Link>
    ),
    enableSorting: false,
  }),
  col.accessor('listing_grade', {
    header: 'Grade',
    cell: info => info.getValue() ? <GradeBadge grade={info.getValue()!} size="sm" /> : <span className="text-gray-300 text-xs">—</span>,
  }),
  col.accessor('est_monthly_revenue', {
    header: 'Revenue/mo',
    cell: info => (
      <span className="tabular-nums font-semibold text-gray-800">
        {info.getValue() != null ? formatCurrency(info.getValue()!) : '—'}
      </span>
    ),
  }),
  col.accessor('views_30d', {
    header: 'Views 30d',
    cell: info => <span className="tabular-nums text-gray-600">{info.getValue()?.toLocaleString() ?? '—'}</span>,
  }),
  col.accessor('num_reviews', {
    header: 'Reviews',
    cell: info => <span className="tabular-nums text-gray-600">{info.getValue().toLocaleString()}</span>,
  }),
  col.accessor('price_usd', {
    header: 'Price',
    cell: info => info.getValue() != null ? formatCurrency(info.getValue()!) : '—',
  }),
  col.accessor('opportunity_score', {
    header: 'Opportunity',
    cell: info => {
      const v = info.getValue()
      if (v == null) return <span className="text-gray-300">—</span>
      const color = v >= 70 ? 'text-green-600' : v >= 40 ? 'text-amber-600' : 'text-red-500'
      return <span className={cn('tabular-nums font-semibold', color)}>{v.toFixed(0)}</span>
    },
  }),
  col.accessor('photo_count', {
    header: 'Photos',
    cell: info => <span className="text-gray-500">{info.getValue()}</span>,
  }),
]

export default function ListingsPage() {
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'est_monthly_revenue', desc: true }])
  const LIMIT = 25

  const sortId   = sorting[0]?.id ?? 'est_monthly_revenue'
  const sortDir  = sorting[0]?.desc === false ? 'asc' : 'desc'

  const serverSortMap: Record<string, string> = {
    est_monthly_revenue: 'revenue',
    views_30d:           'views',
    num_reviews:         'reviews',
    listing_grade:       'grade',
    opportunity_score:   'opportunity',
  }

  const { data, isLoading } = useDashboardListings({
    sort:  serverSortMap[sortId] ?? 'revenue',
    dir:   sortDir,
    page:  String(page),
    limit: String(LIMIT),
  })

  const resp = data as { data: Listing[]; total: number; has_more: boolean } | undefined
  const rows = resp?.data ?? []
  const total = resp?.total ?? 0

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      setSorting(updater)
      setPage(1)
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
    manualPagination: true,
  })

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Your Listings</h1>
        <p className="text-sm text-gray-400">{total.toLocaleString()} active listings</p>
      </div>

      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id} className="border-b bg-gray-50">
                  {hg.headers.map(header => (
                    <th
                      key={header.id}
                      className={cn(
                        'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide',
                        header.column.getCanSort() && 'cursor-pointer select-none hover:text-gray-700',
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {columns.map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded bg-gray-100 animate-pulse" style={{ width: j === 0 ? 200 : 60 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-xs text-gray-400">
            Showing {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-7 w-7 items-center justify-center rounded border text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="px-3 text-xs text-gray-600">{page} / {totalPages || 1}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!resp?.has_more}
              className="flex h-7 w-7 items-center justify-center rounded border text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
