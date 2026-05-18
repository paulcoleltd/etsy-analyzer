'use client'

import { useState } from 'react'
import { Plus, Loader2, Bell, BellOff } from 'lucide-react'
import { useCompetitors, useAddCompetitor, useRemoveCompetitor, useNotifications } from '@/hooks/useCompetitors'
import { ShopCard } from '@/components/competitors/ShopCard'
import { AlertFeed } from '@/components/competitors/AlertFeed'
import { api } from '@/lib/api-client'
import { useQueryClient } from '@tanstack/react-query'

export default function CompetitorsPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [shopInput, setShopInput] = useState('')
  const [tab, setTab] = useState<'shops' | 'alerts'>('shops')
  const qc = useQueryClient()

  const { data: shops, isLoading: shopsLoading } = useCompetitors()
  const { mutate: addShop, isPending: adding, error: addError } = useAddCompetitor()
  const { mutate: removeShop } = useRemoveCompetitor()
  const { data: notifData } = useNotifications()

  const shopList = (shops as any[]) ?? []
  const notifications = (notifData as any[]) ?? []
  const unreadCount = notifications.filter((n: any) => !n.read).length

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const id = shopInput.trim()
    if (!id) return
    addShop(id, {
      onSuccess: () => { setShopInput(''); setShowAdd(false) },
    })
  }

  async function handleMarkRead(notifId: string) {
    await api.notifications.markRead(notifId)
    qc.invalidateQueries({ queryKey: ['notifications'] })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Competitor Intelligence</h1>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Track shop
        </button>
      </div>

      {/* Add shop form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="flex gap-2 rounded-2xl border bg-white p-4">
          <input
            type="text"
            value={shopInput}
            onChange={(e) => setShopInput(e.target.value)}
            placeholder="Etsy shop name or ID (e.g. MyHandmadeShop)"
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            autoFocus
          />
          <button
            type="submit"
            disabled={adding || !shopInput.trim()}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 transition-colors"
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
          </button>
        </form>
      )}
      {addError && (
        <p className="text-xs text-red-500 px-1">
          {(addError as { message?: string }).message ?? 'Could not add shop — check the name and try again.'}
        </p>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setTab('shops')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'shops' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Tracked shops ({shopList.length})
        </button>
        <button
          onClick={() => setTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'alerts' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Alert feed
          {unreadCount > 0 && (
            <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {tab === 'shops' && (
        shopsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : shopList.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center">
            <BellOff className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700">No shops tracked yet</h3>
            <p className="mt-1 text-sm text-gray-400">
              Add a competitor shop to start monitoring new listings, price changes, and review milestones.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shopList.map((shop: any) => (
              <ShopCard
                key={shop.id}
                shop={shop}
                onRemove={(id) => removeShop(id)}
              />
            ))}
          </div>
        )
      )}

      {tab === 'alerts' && (
        <AlertFeed notifications={notifications} onMarkRead={handleMarkRead} />
      )}
    </div>
  )
}
