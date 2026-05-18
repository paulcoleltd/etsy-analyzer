'use client'

import { useSession, signOut } from 'next-auth/react'
import { Bell, ChevronDown, LogOut, Settings } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function TopBar() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const user = session?.user
  const plan = (user as { plan?: string } | undefined)?.plan ?? 'free'

  return (
    <header className="fixed left-56 right-0 top-0 z-20 flex h-14 items-center justify-between border-b bg-white px-6">
      <div />
      <div className="flex items-center gap-3">
        {/* Plan badge */}
        <span className={cn(
          'rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
          plan === 'free'    && 'bg-gray-100 text-gray-600',
          plan === 'starter' && 'bg-blue-100 text-blue-700',
          plan === 'pro'     && 'bg-orange-100 text-orange-700',
          plan === 'agency'  && 'bg-purple-100 text-purple-700',
        )}>
          {plan}
        </span>

        {/* Notifications */}
        <Link href="/settings" className="relative rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
          <Bell className="h-4 w-4" />
        </Link>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
              {(user?.name ?? user?.email ?? 'U').charAt(0).toUpperCase()}
            </div>
            <span className="max-w-[120px] truncate">{user?.name ?? user?.email}</span>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border bg-white shadow-lg py-1 z-50">
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings className="h-3.5 w-3.5" /> Settings
              </Link>
              <hr className="my-1" />
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
