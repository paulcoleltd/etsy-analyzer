import Link from 'next/link'
import { BarChart2, TrendingUp, Search, Star, Users, ArrowRight, Zap, Shield, Clock } from 'lucide-react'

const FEATURES = [
  {
    icon: TrendingUp,
    color: 'from-orange-400 to-orange-600',
    bg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    title: 'Revenue Intelligence',
    desc: 'Instantly estimate monthly revenue for any Etsy listing — without connecting your shop.',
  },
  {
    icon: Search,
    color: 'from-blue-400 to-blue-600',
    bg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    title: 'Keyword Research',
    desc: 'Find high-volume, low-competition keywords with 12-month trend data and opportunity scores.',
  },
  {
    icon: Star,
    color: 'from-violet-400 to-violet-600',
    bg: 'bg-violet-50',
    iconColor: 'text-violet-500',
    title: 'AI Listing Grader',
    desc: 'Get an A–F grade with specific, actionable suggestions to improve any listing instantly.',
  },
  {
    icon: Users,
    color: 'from-emerald-400 to-emerald-600',
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    title: 'Competitor Tracking',
    desc: 'Monitor rival shops and get instant alerts when they add listings or change prices.',
  },
  {
    icon: Zap,
    color: 'from-amber-400 to-amber-600',
    bg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    title: 'Real-time Sync',
    desc: 'Connect your Etsy shop and see live revenue, order trends, and top performers in one view.',
  },
  {
    icon: Shield,
    color: 'from-slate-400 to-slate-600',
    bg: 'bg-slate-50',
    iconColor: 'text-slate-500',
    title: 'Secure & Private',
    desc: 'OAuth 2.0 with PKCE — read-only access, AES-256 encryption, never posting on your behalf.',
  },
]

const STATS = [
  { value: '50K+', label: 'Active sellers' },
  { value: '$2M+', label: 'Revenue tracked' },
  { value: '4.9★', label: 'Average rating' },
  { value: '<2s',  label: 'Analysis time' },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f1f4f9]">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 shadow-md shadow-orange-500/30">
              <BarChart2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-slate-900">Etsy Analyzer</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/pricing" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors sm:block">
              Pricing
            </Link>
            <Link href="/auth/signin" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/25 hover:from-orange-600 hover:to-orange-700 transition-all"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden py-24 md:py-32"
        style={{ background: 'linear-gradient(145deg, #1a2035 0%, #1e2a45 55%, #1a2035 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-orange-500/10 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-blue-500/8 blur-[80px]" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5">
            <Zap className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-sm font-medium text-orange-300">Real-time Etsy market intelligence</span>
          </div>

          <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
            Outcompete every seller<br />
            <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 bg-clip-text text-transparent">
              on Etsy.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
            Revenue estimates, keyword intelligence, AI listing grades, and competitor tracking — everything EverBee and eRank offer, in one beautifully fast dashboard.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-orange-500/30 hover:from-orange-600 hover:to-orange-700 transition-all hover:-translate-y-0.5"
            >
              Start for free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border border-white/20 bg-white/10 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/15 transition-all"
            >
              See pricing
            </Link>
          </div>

          {/* Stat bar */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="mt-0.5 text-sm text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-orange-500">Everything you need</p>
          <h2 className="text-3xl font-extrabold text-slate-900 md:text-4xl">
            Built for serious Etsy sellers
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-500">
            Six powerful tools, one subscription. No spreadsheets. No guesswork.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, bg, iconColor, title, desc }) => (
            <div
              key={title}
              className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <h3 className="mb-2 text-base font-bold text-slate-900">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="mx-auto mb-24 max-w-5xl px-6">
        <div
          className="relative overflow-hidden rounded-3xl p-10 text-center md:p-16"
          style={{ background: 'linear-gradient(135deg, #1a2035 0%, #1e2a45 100%)' }}
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">
              Ready to grow your shop?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              Join thousands of Etsy sellers who use Etsy Analyzer to find profitable niches and optimise their listings daily.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/auth/signup"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-orange-500/30 hover:from-orange-600 hover:to-orange-700 transition-all"
              >
                Get started free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-slate-500">
              <Clock className="h-3.5 w-3.5" /> No credit card required · Free plan forever
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="border-t border-white/10 py-10"
        style={{ background: '#1a2035' }}
      >
        <div className="mx-auto max-w-7xl px-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-orange-400 to-orange-600">
              <BarChart2 className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-white">Etsy Analyzer</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/pricing" className="hover:text-slate-300 transition-colors">Pricing</Link>
            <Link href="/auth/signin" className="hover:text-slate-300 transition-colors">Sign in</Link>
            <Link href="/auth/signup" className="hover:text-slate-300 transition-colors">Sign up</Link>
          </div>
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} Etsy Analyzer</p>
        </div>
      </footer>
    </main>
  )
}
