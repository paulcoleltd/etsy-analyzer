'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import {
  User, CreditCard, Store, Key, Bell,
  Loader2, CheckCircle2, ExternalLink, Trash2, Plus,
} from 'lucide-react'
import { useBillingUsage, useBillingPortal, useApiKeys, useCreateApiKey, useRevokeApiKey } from '@/hooks/useBilling'
import { cn } from '@/lib/utils'

type Tab = 'profile' | 'billing' | 'etsy' | 'api-keys'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'profile',  label: 'Profile',      icon: User       },
  { id: 'billing',  label: 'Billing',       icon: CreditCard },
  { id: 'etsy',     label: 'Etsy shop',     icon: Store      },
  { id: 'api-keys', label: 'API keys',      icon: Key        },
]

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile')
  const { data: session } = useSession()
  const user = session?.user as { name?: string; email?: string; plan?: string } | undefined
  const plan = user?.plan ?? 'free'

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>

      <div className="flex gap-8">
        {/* Sidebar nav */}
        <nav className="w-48 shrink-0 space-y-0.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              disabled={id === 'api-keys' && plan !== 'agency'}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left',
                tab === id
                  ? 'bg-orange-50 text-orange-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                id === 'api-keys' && plan !== 'agency' && 'opacity-40 cursor-not-allowed',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {id === 'api-keys' && plan !== 'agency' && (
                <span className="ml-auto text-xs text-gray-400">Agency</span>
              )}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 max-w-xl">
          {tab === 'profile'  && <ProfileTab user={user} />}
          {tab === 'billing'  && <BillingTab plan={plan} />}
          {tab === 'etsy'     && <EtsyTab />}
          {tab === 'api-keys' && <ApiKeysTab />}
        </div>
      </div>
    </div>
  )
}

// ── Profile Tab ─────────────────────────────────────────────────

function ProfileTab({ user }: { user: { name?: string; email?: string } | undefined }) {
  return (
    <div className="rounded-2xl border bg-white p-6 space-y-5">
      <h2 className="text-base font-semibold text-gray-800">Profile</h2>
      <div className="space-y-4">
        <Field label="Name"  value={user?.name  ?? '—'} />
        <Field label="Email" value={user?.email ?? '—'} />
      </div>
      <p className="text-xs text-gray-400">
        To change your name or email, contact support.
      </p>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-700">{value}</p>
    </div>
  )
}

// ── Billing Tab ─────────────────────────────────────────────────

function BillingTab({ plan }: { plan: string }) {
  const { data: usage, isLoading } = useBillingUsage()
  const { mutate: openPortal, isPending: openingPortal } = useBillingPortal()
  const billing = usage as Record<string, any> | undefined

  const PLAN_COLOR: Record<string, string> = {
    free:    'bg-gray-100 text-gray-600',
    starter: 'bg-blue-100 text-blue-700',
    pro:     'bg-orange-100 text-orange-700',
    agency:  'bg-purple-100 text-purple-700',
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Current plan</h2>
          <span className={cn('rounded-full px-3 py-1 text-sm font-semibold capitalize', PLAN_COLOR[plan])}>
            {plan}
          </span>
        </div>

        {billing?.planExpiresAt && (
          <p className="text-xs text-gray-400">
            Renews {new Date(billing.planExpiresAt).toLocaleDateString()}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          {plan === 'free' ? (
            <a
              href="/pricing"
              className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
            >
              Upgrade plan
            </a>
          ) : (
            <button
              onClick={() => openPortal()}
              disabled={openingPortal}
              className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {openingPortal ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              Manage subscription
            </button>
          )}
        </div>
      </div>

      {/* Usage meters */}
      <div className="rounded-2xl border bg-white p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-800">Today&apos;s usage</h2>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : billing?.usage ? (
          <div className="space-y-3">
            {Object.entries(billing.usage as Record<string, { used: number; limit: number }>).map(([key, val]) => {
              const pct = val.limit === -1 ? 0 : Math.min(100, (val.used / Math.max(1, val.limit)) * 100)
              const unlimited = val.limit === -1
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-xs tabular-nums text-gray-500">
                      {val.used} / {unlimited ? '∞' : val.limit}
                    </span>
                  </div>
                  {!unlimited && (
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', pct >= 90 ? 'bg-red-500' : 'bg-orange-500')}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Usage data unavailable.</p>
        )}
      </div>
    </div>
  )
}

// ── Etsy Tab ────────────────────────────────────────────────────

function EtsyTab() {
  const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://localhost:3001'
  return (
    <div className="rounded-2xl border bg-white p-6 space-y-5">
      <h2 className="text-base font-semibold text-gray-800">Etsy shop connection</h2>
      <p className="text-sm text-gray-500">
        Connect your Etsy shop to sync transactions, listing stats, and unlock your personal dashboard.
      </p>
      <div className="flex gap-3">
        <a
          href={`${AUTH_URL}/auth/etsy/connect`}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
        >
          <Store className="h-4 w-4" />
          Connect Etsy shop
        </a>
      </div>
      <p className="text-xs text-gray-400">
        We use OAuth 2.0 with PKCE. We only request read permissions and never post on your behalf.
      </p>
    </div>
  )
}

// ── API Keys Tab ────────────────────────────────────────────────

function ApiKeysTab() {
  const [name, setName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)
  const qc = useQueryClient()

  const { data: keys, isLoading } = useApiKeys()
  const { mutate: createKey, isPending: creating } = useCreateApiKey()
  const { mutate: revokeKey } = useRevokeApiKey()

  const keyList = (keys as any[]) ?? []

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createKey(name.trim(), {
      onSuccess: (data: any) => {
        setNewKey(data.key)
        setName('')
        qc.invalidateQueries({ queryKey: ['api-keys'] })
      },
    })
  }

  return (
    <div className="space-y-4">
      {newKey && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <p className="text-sm font-semibold text-green-800">API key created — copy it now</p>
          </div>
          <code className="block rounded bg-white border px-3 py-2 text-xs font-mono text-green-800 break-all">
            {newKey}
          </code>
          <p className="mt-2 text-xs text-green-600">This key won&apos;t be shown again.</p>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-800">API keys</h2>
        <p className="text-sm text-gray-500">
          Use API keys to access the Etsy Analyzer API programmatically.
        </p>

        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Key name (e.g. My Integration)"
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 transition-colors"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create
          </button>
        </form>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : keyList.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No API keys yet.</p>
        ) : (
          <div className="space-y-2">
            {keyList.map((k: any) => (
              <div key={k.id} className="flex items-center justify-between rounded-xl border px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{k.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{k.keyPrefix}••••••••</p>
                </div>
                <div className="flex items-center gap-3">
                  {k.lastUsed && (
                    <span className="text-xs text-gray-400">
                      Last used {new Date(k.lastUsed).toLocaleDateString()}
                    </span>
                  )}
                  <button
                    onClick={() => revokeKey(k.id, { onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }) })}
                    className="rounded-lg p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                    title="Revoke key"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
