'use client'

import { useSession, signOut } from 'next-auth/react'
import { Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const PLAN_PILL: Record<string, string> = {
  free:    'border border-slate-200 bg-slate-100 text-slate-600',
  starter: 'border border-blue-200 bg-blue-50 text-blue-700',
  pro:     'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm shadow-orange-500/25',
  agency:  'bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-sm shadow-violet-500/25',
}

export function TopBar() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const user  = session?.user
  const plan  = (user as { plan?: string } | undefined)?.plan ?? 'free'
  const initials = (user?.name ?? user?.email ?? 'U').charAt(0).toUpperCase()

  return (
    <header
      className="fixed left-56 right-0 top-0 z-20 flex h-14 items-center justify-between px-6"
      style={{
        background:   'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(203,213,225,0.7)',
        boxShadow:    '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Left — breadcrumb / search placeholder */}
      <div />

      {/* Right controls */}
      <div className="flex items-center gap-2">

        {/* Plan pill */}
        <span className={cn('rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide', PLAN_PILL[plan] ?? PLAN_PILL.free)}>
          {plan}
        </span>

        {/* Notifications */}
        <Link
          href="/settings"
          aria-label="Notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-orange-500 ring-1 ring-white" />
        </Link>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-[11px] font-bold text-white shadow-sm">
              {initials}
            </div>
            <span className="max-w-[100px] truncate font-medium">{user?.name ?? user?.email}</span>
            <ChevronDown className={cn('h-3.5 w-3.5 text-slate-400 transition-transform duration-200', open && 'rotate-180')} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-52 animate-slide-down overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/10">
                {/* Header */}
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="truncate text-sm font-bold text-slate-900">{user?.name ?? 'My Account'}</p>
                  <p className="truncate text-xs text-slate-400">{user?.email}</p>
                </div>
                {/* Items */}
                <div className="py-1.5">
                  <Link href="/settings" onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50">
                    <Settings className="h-3.5 w-3.5 text-slate-400" /> Settings
                  </Link>
                  <Link href="/pricing" onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50">
                    <User className="h-3.5 w-3.5 text-slate-400" /> Manage plan
                  </Link>
                </div>
                <div className="border-t border-slate-100 py-1.5">
                  <button
                    onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
