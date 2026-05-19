'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import {
  User, CreditCard, Store, Key,
  Loader2, CheckCircle2, ExternalLink, Trash2, Plus,
  ShieldCheck, Lock, Settings,
} from 'lucide-react'
import { useBillingUsage, useBillingPortal, useApiKeys, useCreateApiKey, useRevokeApiKey } from '@/hooks/useBilling'
import { PageHeader } from '@/components/layout/PageHeader'
import { cn } from '@/lib/utils'

type Tab = 'profile' | 'billing' | 'etsy' | 'api-keys'

const TABS: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'profile',  label: 'Profile',   icon: User,       desc: 'Account info'    },
  { id: 'billing',  label: 'Billing',   icon: CreditCard, desc: 'Plan & usage'    },
  { id: 'etsy',     label: 'Etsy Shop', icon: Store,      desc: 'Shop connection' },
  { id: 'api-keys', label: 'API Keys',  icon: Key,        desc: 'Developer access'},
]

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile')
  const { data: session } = useSession()
  const user = session?.user as { name?: string; email?: string; plan?: string } | undefined
  const plan = user?.plan ?? 'free'

  return (
    <div className="space-y-5 animate-fade-up">

      <PageHeader
        icon={Settings}
        iconColor="text-orange-500"
        iconBg="bg-orange-50"
        title="Settings"
        subtitle="Manage your account, billing, and integrations"
      />

      <div className="flex gap-5">

        {/* Left nav */}
        <nav className="w-52 shrink-0 space-y-1">
          {TABS.map(({ id, label, icon: Icon, desc }) => {
            const locked = id === 'api-keys' && plan !== 'agency'
            return (
              <button
                key={id}
                onClick={() => !locked && setTab(id)}
                disabled={locked}
                className={cn(
                  'group flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all',
                  tab === id
                    ? 'border-orange-200/80 bg-white shadow-sm'
                    : 'border-transparent hover:border-slate-200/70 hover:bg-white/70',
                  locked && 'cursor-not-allowed opacity-40',
                )}
              >
                <div className={cn(
                  'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all',
                  tab === id
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-sm shadow-orange-500/30'
                    : 'bg-slate-100 text-slate-400',
                )}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className={cn('text-sm font-semibold leading-none', tab === id ? 'text-slate-900' : 'text-slate-600')}>
                    {label}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">{desc}</p>
                </div>
                {locked && (
                  <span className="ml-auto self-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
                    Agency
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Content panel */}
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

/* ── Profile ─────────────────────────────────────────────── */

function ProfileTab({ user }: { user: { name?: string; email?: string } | undefined }) {
  const initials = (user?.name ?? user?.email ?? 'U').charAt(0).toUpperCase()
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card p-6">
        {/* Avatar row */}
        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-xl font-bold text-white shadow-lg shadow-orange-500/25">
            {initials}
          </div>
          <div>
            <p className="font-bold text-slate-900">{user?.name ?? 'My Account'}</p>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-3">
          <FieldRow label="Display name" value={user?.name ?? '—'} />
          <FieldRow label="Email address" value={user?.email ?? '—'} />
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
          <Lock className="h-3 w-3" /> To change your details, contact support.
        </div>
      </div>
    </div>
  )
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="input !cursor-default !bg-slate-50">{value}</p>
    </div>
  )
}

/* ── Billing ─────────────────────────────────────────────── */

function BillingTab({ plan }: { plan: string }) {
  const { data: usage, isLoading } = useBillingUsage()
  const { mutate: openPortal, isPending: openingPortal } = useBillingPortal()
  const billing = usage as Record<string, any> | undefined

  const PLAN_PILL: Record<string, string> = {
    free:    'bg-slate-100 text-slate-600',
    starter: 'bg-blue-50 text-blue-700',
    pro:     'bg-gradient-to-r from-orange-500 to-orange-600 text-white',
    agency:  'bg-gradient-to-r from-violet-500 to-violet-600 text-white',
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Plan card */}
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="section-label">Current plan</p>
            <p className="text-2xl font-extrabold capitalize text-slate-900">{plan}</p>
            {billing?.planExpiresAt && (
              <p className="mt-0.5 text-xs text-slate-400">
                Renews {new Date(billing.planExpiresAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <span className={cn('rounded-full px-3 py-1 text-xs font-bold capitalize', PLAN_PILL[plan] ?? PLAN_PILL.free)}>
            {plan}
          </span>
        </div>

        <div className="mt-5 flex gap-2">
          {plan === 'free' ? (
            <a href="/pricing" className="btn-primary text-sm">
              Upgrade plan
            </a>
          ) : (
            <button onClick={() => openPortal()} disabled={openingPortal} className="btn-ghost">
              {openingPortal ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4 text-slate-400" />}
              Manage subscription
            </button>
          )}
        </div>
      </div>

      {/* Usage meters */}
      <div className="card p-6">
        <p className="mb-4 text-sm font-bold text-slate-800">Today&apos;s usage</p>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton h-3 w-28" />
                <div className="skeleton h-1.5 w-full" />
              </div>
            ))}
          </div>
        ) : billing?.usage ? (
          <div className="space-y-4">
            {Object.entries(billing.usage as Record<string, { used: number; limit: number }>).map(([key, val]) => {
              const unlimited = val.limit === -1
              const pct = unlimited ? 0 : Math.min(100, (val.used / Math.max(1, val.limit)) * 100)
              return (
                <div key={key}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium capitalize text-slate-600">{key.replace(/_/g, ' ')}</span>
                    <span className="text-xs font-semibold tabular-nums text-slate-500">
                      {val.used} / {unlimited ? '∞' : val.limit}
                    </span>
                  </div>
                  {!unlimited && (
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-gradient-to-r from-orange-400 to-orange-500',
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Usage data unavailable.</p>
        )}
      </div>
    </div>
  )
}

/* ── Etsy ─────────────────────────────────────────────────── */

function EtsyTab() {
  const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://localhost:3001'
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
            <Store className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Etsy shop connection</p>
            <p className="text-xs text-slate-400">Connect to sync real revenue data</p>
          </div>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-slate-500">
          Connect your Etsy shop to sync transactions, listing stats, and unlock your personal revenue dashboard with live data.
        </p>
        <a href={`${AUTH_URL}/auth/etsy/connect`} className="btn-primary inline-flex">
          <Store className="h-4 w-4" />
          Connect Etsy shop
        </a>
      </div>

      <div className="card p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Your data is secure</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              OAuth 2.0 with PKCE · Read-only access only · AES-256 encrypted tokens at rest · We never post on your behalf.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── API Keys ─────────────────────────────────────────────── */

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
    <div className="space-y-4 animate-fade-in">
      {newKey && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-bold text-emerald-800">API key created — copy it now</p>
          </div>
          <code className="block break-all rounded-xl border border-emerald-200 bg-white px-3.5 py-2.5 font-mono text-xs text-emerald-800">
            {newKey}
          </code>
          <p className="mt-2 text-xs text-emerald-600">This key won&apos;t be shown again.</p>
        </div>
      )}

      <div className="card p-6">
        <p className="mb-1 text-sm font-bold text-slate-800">API keys</p>
        <p className="mb-5 text-xs text-slate-500">Programmatic access to the Etsy Analyzer API.</p>

        <form onSubmit={handleCreate} className="mb-5 flex gap-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Key name (e.g. My Integration)"
            className="input flex-1"
          />
          <button type="submit" disabled={creating || !name.trim()} className="btn-primary">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create
          </button>
        </form>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        ) : keyList.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 py-10 text-center">
            <Key className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400">No API keys yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {keyList.map((k: any) => (
              <div key={k.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{k.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-slate-400">{k.keyPrefix}••••••••</p>
                </div>
                <div className="flex items-center gap-3">
                  {k.lastUsed && (
                    <span className="text-xs text-slate-400">Used {new Date(k.lastUsed).toLocaleDateString()}</span>
                  )}
                  <button
                    onClick={() => revokeKey(k.id, { onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }) })}
                    className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-400"
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
