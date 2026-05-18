import Link from 'next/link'
import { Store, Clock, Trash2, Bell } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface TrackedShop {
  id: string
  etsyShopId: string
  shopName: string
  lastChecked: string | null
  latestSnapshot: {
    listingCount: number | null
    totalSalesEst: number | null
    snapshotData?: {
      listings?: Array<{ listingId: string }>
    }
  } | null
  alertConfig: {
    newListing: boolean
    priceChange: boolean
    reviewMilestone: boolean
    channels: string[]
  }
}

interface Props {
  shop: TrackedShop
  onRemove: (id: string) => void
}

export function ShopCard({ shop, onRemove }: Props) {
  const snap = shop.latestSnapshot
  const listingCount = snap?.listingCount ?? snap?.snapshotData?.listings?.length ?? '—'
  const revenue = snap?.totalSalesEst

  const alertCount = [
    shop.alertConfig.newListing,
    shop.alertConfig.priceChange,
    shop.alertConfig.reviewMilestone,
  ].filter(Boolean).length

  return (
    <div className="rounded-2xl border bg-white p-5 hover:shadow-sm transition-shadow group">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
            <Store className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <Link
              href={`/competitors/${shop.id}`}
              className="text-sm font-semibold text-gray-900 hover:text-orange-600 transition-colors"
            >
              {shop.shopName}
            </Link>
            <p className="text-xs text-gray-400">{shop.etsyShopId}</p>
          </div>
        </div>
        <button
          onClick={() => onRemove(shop.id)}
          className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all"
          title="Stop tracking"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
        <div>
          <p className="text-xs text-gray-400">Est. revenue/mo</p>
          <p className="text-sm font-bold text-gray-800">
            {revenue != null ? formatCurrency(revenue) : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Listings</p>
          <p className="text-sm font-bold text-gray-800">{listingCount}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {shop.lastChecked
            ? `Checked ${new Date(shop.lastChecked).toLocaleDateString()}`
            : 'Not yet checked'}
        </div>
        {alertCount > 0 && (
          <div className="flex items-center gap-1 text-orange-500">
            <Bell className="h-3 w-3" />
            {alertCount} alert{alertCount > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
