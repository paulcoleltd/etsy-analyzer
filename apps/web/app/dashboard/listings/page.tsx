'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  flexRender, createColumnHelper, type SortingState,
} from '@tanstack/react-table'
import { ArrowUpDown, ChevronLeft, ChevronRight, LayoutGrid, ArrowLeft } from 'lucide-react'
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
        className="line-clamp-2 font-semibold text-slate-700 hover:text-orange-600 transition-colors max-w-xs block"
      >
        {info.getValue() ?? info.row.original.etsy_listing_id}
      </Link>
    ),
    enableSorting: false,
  }),
  col.accessor('listing_grade', {
    header: 'Grade',
    cell: info => info.getValue()
      ? <GradeBadge grade={info.getValue()!} size="sm" />
      : <span className="text-slate-300 text-xs">—</span>,
  }),
  col.accessor('est_monthly_revenue', {
    header: 'Revenue/mo',
    cell: info => (
      <span className="tabular-nums font-bold text-slate-800">
        {info.getValue() != null ? formatCurrency(info.getValue()!) : '—'}
      </span>
    ),
  }),
  col.accessor('views_30d', {
    header: 'Views 30d',
    cell: info => <span className="tabular-nums text-slate-600">{info.getValue()?.toLocaleString() ?? '—'}</span>,
  }),
  col.accessor('num_reviews', {
    header: 'Reviews',
    cell: info => <span className="tabular-nums text-slate-600">{info.getValue().toLocaleString()}</span>,
  }),
  col.accessor('price_usd', {
    header: 'Price',
    cell: info => <span className="tabular-nums text-slate-700">{info.getValue() != null ? formatCurrency(info.getValue()!) : '—'}</span>,
  }),
  col.accessor('opportunity_score', {
    header: 'Opportunity',
    cell: info => {
      const v = info.getValue()
      if (v == null) return <span className="text-slate-300">—</span>
      const cls = v >= 70 ? 'text-emerald-600' : v >= 40 ? 'text-amber-600' : 'text-red-500'
      return <span className={cn('tabular-nums font-bold', cls)}>{v.toFixed(0)}</span>
    },
  }),
  col.accessor('photo_count', {
    header: 'Photos',
    cell: info => <span className="tabular-nums text-slate-500">{info.getValue()}</span>,
  }),
]

export default function ListingsPage() {
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'est_monthly_revenue', desc: true }])
  const LIMIT = 25

  const sortId  = sorting[0]?.id ?? 'est_monthly_revenue'
  const sortDir = sorting[0]?.desc === false ? 'asc' : 'desc'

  const serverSortMap: Record<string, string> = {
    est_monthly_revenue: 'revenue',
    views_30d:           'views',
    num_reviews:         'reviews',
    opportunity_score:   'score',
    price_usd:           'price',
  }

  const { data: resp, isLoading } = useDashboardListings({
    page: String(page),
    limit: String(LIMIT),
    sortBy: serverSortMap[sortId] ?? 'revenue',
    sortDir,
  })

  const rows  = (resp as any)?.listings ?? []
  const total = (resp as any)?.total ?? 0

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: (updater) => { setSorting(updater); setPage(1) },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
    manualPagination: true,
  })

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-5 animate-fade-up">

      {/* Header */}
      <div className="flex items-center gap-3 card px-5 py-3.5">
        <Link href="/dashboard" className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="h-4 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
            <LayoutGrid className="h-4 w-4 text-orange-500" />
          </div>
          <h1 className="text-base font-bold text-slate-900">All Listings</h1>
        </div>
        <span className="ml-auto text-xs text-slate-400">{total.toLocaleString()} active listings</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id} className="border-b border-slate-100 bg-slate-50/80">
                  {hg.headers.map(header => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={cn(
                        'px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400',
                        header.column.getCanSort() && 'cursor-pointer select-none hover:text-slate-600 transition-colors',
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && <ArrowUpDown className="h-3 w-3 opacity-40" />}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {columns.map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="skeleton h-4 rounded-full" style={{ width: j === 0 ? 200 : 60 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-orange-50/30 transition-colors">
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
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3">
          <p className="text-xs text-slate-400">
            {total > 0
              ? `Showing ${Math.min((page - 1) * LIMIT + 1, total)}–${Math.min(page * LIMIT, total)} of ${total.toLocaleString()}`
              : 'No listings'}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="px-3 text-xs font-medium text-slate-600">{page} / {totalPages || 1}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!(resp as any)?.has_more}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
