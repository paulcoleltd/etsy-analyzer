'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Search, Tag, Star, Users,
  TrendingUp, DollarSign, Settings, BarChart2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard',    label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/research',     label: 'Research',    icon: Search           },
  { href: '/keywords',     label: 'Keywords',    icon: Tag              },
  { href: '/grader',       label: 'Grader',      icon: Star             },
  { href: '/competitors',  label: 'Competitors', icon: Users            },
  { href: '/trends',       label: 'Trends',      icon: TrendingUp       },
  { href: '/pricing',      label: 'Pricing',     icon: DollarSign       },
  { href: '/settings',     label: 'Settings',    icon: Settings         },
]

export function Sidebar() {
  const path = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <BarChart2 className="h-5 w-5 text-orange-500" />
        <span className="text-base font-bold text-gray-900">Etsy Analyzer</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard' ? path === href : path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-orange-50 text-orange-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
