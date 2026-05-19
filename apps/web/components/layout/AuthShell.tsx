/**
 * AuthShell — shared split-panel wrapper for all public auth pages.
 * Left: dark navy branding panel. Right: white form panel.
 */
import { BarChart2, TrendingUp, Search, Star, Users } from 'lucide-react'
import Link from 'next/link'

const BULLETS = [
  { icon: TrendingUp, text: 'Revenue estimates for any Etsy listing' },
  { icon: Search,     text: 'Keyword research & search volume data'  },
  { icon: Star,       text: 'AI-powered listing grade & suggestions' },
  { icon: Users,      text: 'Competitor tracking & price alerts'     },
]

interface Props {
  children: React.ReactNode
  /** Shown below the headline on the left panel */
  tagline?: string
}

export function AuthShell({ children, tagline }: Props) {
  return (
    <div className="min-h-screen flex">

      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1a2035 0%, #1d2640 60%, #1a2035 100%)' }}
      >
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-orange-500/10 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-blue-500/8 blur-[80px]" />

        {/* Logo */}
        <Link href="/" className="relative flex items-center gap-3 w-fit">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-600/40">
            <BarChart2 className="h-4.5 w-4.5 text-white" size={18} />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">Etsy Analyzer</span>
        </Link>

        {/* Headline */}
        <div className="relative space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight text-white">
            Grow your Etsy shop<br />
            <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
              {tagline ?? 'with real data.'}
            </span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Revenue intelligence, keyword research, AI listing grades, and competitor tracking — all in one place.
          </p>

          <ul className="space-y-3">
            {BULLETS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/15">
                  <Icon className="h-3.5 w-3.5 text-orange-400" />
                </div>
                <span className="text-sm text-slate-300">{text}</span>
              </li>
            ))}
          </ul>

          {/* Stats */}
          <div className="flex gap-4 pt-2">
            {[
              { v: '50K+', l: 'Sellers' },
              { v: '$2M+', l: 'Tracked' },
              { v: '4.9★', l: 'Rating'  },
            ].map(s => (
              <div key={s.l} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
                <p className="text-sm font-bold text-white">{s.v}</p>
                <p className="text-[10px] text-slate-400">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-600">
          © {new Date().getFullYear()} Etsy Analyzer
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex w-full lg:w-[55%] flex-col items-center justify-center px-6 py-12"
           style={{ background: '#eef1f8' }}>

        {/* Mobile logo */}
        <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-md">
            <BarChart2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-slate-900">Etsy Analyzer</span>
        </Link>

        <div className="w-full max-w-sm animate-fade-up">
          {children}
        </div>
      </div>
    </div>
  )
}
