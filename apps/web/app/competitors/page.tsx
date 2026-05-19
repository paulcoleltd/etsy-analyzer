'use client'

import { useState } from 'react'
import { Plus, Loader2, Bell, Users, ShieldAlert, X } from 'lucide-react'
import { useCompetitors, useAddCompetitor, useRemoveCompetitor, useNotifications } from '@/hooks/useCompetitors'
import { ShopCard } from '@/components/competitors/ShopCard'
import { AlertFeed } from '@/components/competitors/AlertFeed'
import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api-client'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

type Tab = 'shops' | 'alerts'

export default function CompetitorsPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [shopInput, setShopInput] = useState('')
  const [tab, setTab] = useState<Tab>('shops')
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
    addShop(id, { onSuccess: () => { setShopInput(''); setShowAdd(false) } })
  }

  async function handleMarkRead(notifId: string) {
    await api.notifications.markRead(notifId)
    qc.invalidateQueries({ queryKey: ['notifications'] })
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        icon={Users}
        iconColor="text-orange-500"
        iconBg="bg-orange-50"
        title="Competitor Intelligence"
        subtitle="Monitor rival shops and get instant alerts on new listings and price changes"
        actions={
          <button
            onClick={() => setShowAdd(v => !v)}
            className={cn(showAdd ? 'btn-ghost' : 'btn-primary')}
          >
            {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showAdd ? 'Cancel' : 'Track shop'}
          </button>
        }
      />

      {/* Add shop form */}
      {showAdd && (
        <div className="card p-5 animate-slide-down">
          <p className="mb-1 text-sm font-bold text-slate-800">Track a competitor shop</p>
          <p className="mb-4 text-xs text-slate-400">Enter the Etsy shop ID or name (e.g. CraftyGiftsUK)</p>
          <form onSubmit={handleAdd} className="flex gap-2">
            <div className="relative flex-1">
              <Users className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={shopInput}
                onChange={e => setShopInput(e.target.value)}
                placeholder="Shop ID or name…"
                className="input pl-10"
                autoFocus
              />
            </div>
            <button type="submit" disabled={adding || !shopInput.trim()} className="btn-primary">
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Track
            </button>
          </form>
          {addError && <p className="mt-2 text-xs text-red-500">Could not add this shop. Check the name and try again.</p>}
        </div>
      )}

      {/* Underline tabs */}
      <div className="flex border-b border-slate-200">
        {([
          { id: 'shops',  label: 'Tracked Shops', icon: Users,       count: shopList.length },
          { id: 'alerts', label: 'Alert Feed',     icon: ShieldAlert, count: unreadCount     },
        ] as { id: Tab; label: string; icon: React.ElementType; count: number }[]).map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn('u-tab', tab === id && 'u-tab-active')}
          >
            <Icon className="h-4 w-4" />
            {label}
            {count > 0 && (
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                tab === id ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500',
              )}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Shops tab */}
      {tab === 'shops' && (
        <>
          {shopsLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card p-5 space-y-3">
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-3 w-1/3" />
                </div>
              ))}
            </div>
          ) : shopList.length === 0 ? (
            <div className="empty-state">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
                <Users className="h-6 w-6 text-orange-400" />
              </div>
              <p className="text-base font-semibold text-slate-600">No competitors tracked yet</p>
              <p className="mt-1 text-sm text-slate-400">Add a competitor shop to start monitoring their activity</p>
              <button onClick={() => setShowAdd(true)} className="btn-primary mx-auto mt-5">
                <Plus className="h-4 w-4" /> Track your first competitor
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {shopList.map((shop: any) => (
                <ShopCard
                  key={shop.id}
                  shop={shop}
                  onRemove={() => removeShop(shop.id, { onSuccess: () => qc.invalidateQueries({ queryKey: ['competitors'] }) })}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Alerts tab */}
      {tab === 'alerts' && (
        <>
          {notifications.length === 0 ? (
            <div className="empty-state">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
                <Bell className="h-6 w-6 text-orange-400" />
              </div>
              <p className="text-base font-semibold text-slate-600">No alerts yet</p>
              <p className="mt-1 text-sm text-slate-400">Alerts appear when tracked shops add listings or change prices</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <AlertFeed notifications={notifications} onMarkRead={handleMarkRead} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
