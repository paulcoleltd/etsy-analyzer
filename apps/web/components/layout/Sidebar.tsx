'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Search, Tag, Star, Users,
  TrendingUp, DollarSign, Settings, BarChart2, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const MAIN_NAV = [
  { href: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/research',    label: 'Research',    icon: Search          },
  { href: '/keywords',    label: 'Keywords',    icon: Tag             },
  { href: '/grader',      label: 'Grader',      icon: Star            },
  { href: '/competitors', label: 'Competitors', icon: Users           },
  { href: '/trends',      label: 'Trends',      icon: TrendingUp      },
]

const BOTTOM_NAV = [
  { href: '/pricing',  label: 'Upgrade',  icon: DollarSign },
  { href: '/settings', label: 'Settings', icon: Settings   },
]

export function Sidebar() {
  const path = usePathname()

  const NavLink = ({
    href, label, icon: Icon,
  }: { href: string; label: string; icon: React.ElementType }) => {
    const active = href === '/dashboard' ? path === href : path.startsWith(href)
    return (
      <Link
        href={href}
        className={cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
          active
            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-600/30'
            : 'text-slate-400 hover:bg-white/[0.07] hover:text-white',
        )}
      >
        <Icon className={cn(
          'h-4 w-4 shrink-0 transition-transform duration-150',
          !active && 'group-hover:scale-110',
        )} />
        <span>{label}</span>
        {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60" />}
      </Link>
    )
  }

  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col"
      style={{ background: 'linear-gradient(180deg, #1a2035 0%, #1d2640 50%, #1a2035 100%)' }}
    >
      {/* ── Logo ── */}
      <div className="flex h-14 items-center gap-2.5 px-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-600/40">
          <BarChart2 className="h-4 w-4 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-white tracking-tight">Etsy Analyzer</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Zap className="h-2.5 w-2.5 text-orange-400" />
            <span className="text-[10px] font-semibold text-orange-400 tracking-wide">PRO</span>
          </div>
        </div>
      </div>

      {/* ── Main nav ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-0.5">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
          Main menu
        </p>
        {MAIN_NAV.map(item => <NavLink key={item.href} {...item} />)}
      </nav>

      {/* ── Connect nudge ── */}
      {!path.startsWith('/settings') && (
        <div
          className="mx-3 mb-3 rounded-xl p-3.5"
          style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.18)' }}
        >
          <p className="text-xs font-semibold text-white">Connect your shop</p>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
            Sync real revenue &amp; listing data.
          </p>
          <Link
            href="/settings"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-orange-400 hover:text-orange-300 transition-colors"
          >
            Get started →
          </Link>
        </div>
      )}

      {/* ── Bottom nav ── */}
      <div className="px-3 py-3 space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {BOTTOM_NAV.map(item => <NavLink key={item.href} {...item} />)}
      </div>
    </aside>
  )
}
