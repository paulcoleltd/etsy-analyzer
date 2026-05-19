import Link from 'next/link'
import { Store, Clock, Trash2, Bell, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface TrackedShop {
  id: string
  etsyShopId: string
  shopName: string
  lastChecked: string | null
  latestSnapshot: {
    listingCount: number | null
    totalSalesEst: number | null
    snapshotData?: { listings?: Array<{ listingId: string }> }
  } | null
  alertConfig: {
    newListing: boolean
    priceChange: boolean
    reviewMilestone: boolean
    channels: string[]
  }
}

export function ShopCard({ shop, onRemove }: { shop: TrackedShop; onRemove: (id: string) => void }) {
  const snap = shop.latestSnapshot
  const listingCount = snap?.listingCount ?? snap?.snapshotData?.listings?.length ?? '—'
  const revenue = snap?.totalSalesEst
  const alertCount = [shop.alertConfig.newListing, shop.alertConfig.priceChange, shop.alertConfig.reviewMilestone].filter(Boolean).length

  return (
    <div className="group rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
            <Store className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <Link
              href={`/competitors/${shop.id}`}
              className="text-sm font-bold text-slate-900 hover:text-orange-600 transition-colors"
            >
              {shop.shopName}
            </Link>
            <p className="mt-0.5 font-mono text-[11px] text-slate-400">{shop.etsyShopId}</p>
          </div>
        </div>
        <button
          onClick={() => onRemove(shop.id)}
          className="rounded-lg p-1.5 text-slate-200 opacity-0 transition-all hover:bg-red-50 hover:text-red-400 group-hover:opacity-100"
          title="Stop tracking"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Metrics */}
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Est. revenue/mo</p>
          <p className="mt-1 text-sm font-bold text-slate-800">
            {revenue != null ? formatCurrency(revenue) : '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Listings</p>
          <p className="mt-1 text-sm font-bold text-slate-800">{listingCount}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <Clock className="h-3 w-3" />
          {shop.lastChecked
            ? `Checked ${new Date(shop.lastChecked).toLocaleDateString()}`
            : 'Not checked yet'}
        </span>
        {alertCount > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-600">
            <Bell className="h-3 w-3" />
            {alertCount} alert{alertCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  )
}
