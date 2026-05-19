'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, Zap, BarChart2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Billing = 'monthly' | 'annual'

interface Plan {
  id: string
  name: string
  monthlyPrice: number
  annualPrice: number
  description: string
  features: string[]
  limits: string[]
  stripePriceMonthly: string
  stripePriceAnnual: string
  highlighted?: boolean
  badge?: string
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Try the platform with limited searches.',
    features: ['5 research searches/day', '2 listing grades/day', '10 keyword lookups/day', '1 CSV export/day'],
    limits: ['No competitor tracking', 'No bulk audit', 'No API access'],
    stripePriceMonthly: '',
    stripePriceAnnual:  '',
  },
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 19,
    annualPrice: 15,
    description: 'For sellers researching their next niche.',
    features: ['50 research searches/day', '20 listing grades/day', '100 keyword lookups/day', '5 competitor shops', '10 CSV exports/day', 'Email alerts'],
    limits: ['No bulk audit', 'No API access'],
    stripePriceMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY ?? '',
    stripePriceAnnual:  process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL  ?? '',
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 49,
    annualPrice: 39,
    description: 'For active sellers who want every edge.',
    features: ['500 research searches/day', '200 listing grades/day', 'Unlimited keyword lookups', '25 competitor shops', '50 CSV exports/day', 'Bulk shop audit', 'Priority support'],
    limits: ['No API access'],
    stripePriceMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? '',
    stripePriceAnnual:  process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL  ?? '',
    highlighted: true,
    badge: 'Most popular',
  },
  {
    id: 'agency',
    name: 'Agency',
    monthlyPrice: 149,
    annualPrice: 119,
    description: 'For agencies managing multiple Etsy shops.',
    features: ['Unlimited everything', '100 competitor shops', 'API access', 'Team seats (coming soon)', 'Dedicated support', 'White-label reports'],
    limits: [],
    stripePriceMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY_MONTHLY ?? '',
    stripePriceAnnual:  process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY_ANNUAL  ?? '',
  },
]

const FAQ = [
  { q: 'Can I cancel anytime?', a: 'Yes — cancel from your billing portal at any time. You keep access until the end of your billing period.' },
  { q: 'Do you offer a free trial?', a: 'The Free plan lets you try the core features indefinitely. No credit card required.' },
  { q: 'How do daily limits work?', a: 'Limits reset at midnight UTC each day. Unused requests do not roll over.' },
  { q: 'Is my Etsy data secure?', a: 'Yes. We store only encrypted OAuth tokens and never access your shop on your behalf without an active session.' },
]

async function startCheckout(priceId: string) {
  const NOTIF_URL = process.env.NEXT_PUBLIC_NOTIFICATION_URL ?? 'http://localhost:3003'
  const token = (window as any).__accessToken ?? ''
  const res = await fetch(`${NOTIF_URL}/v1/billing/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ priceId }),
  })
  const data = await res.json() as { url?: string }
  if (data.url) window.location.href = data.url
}

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>('monthly')

  return (
    <div className="min-h-screen bg-[#f1f4f9]">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 shadow-md shadow-orange-500/30">
              <BarChart2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-slate-900">Etsy Analyzer</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/signin" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Sign in</Link>
            <Link href="/auth/signup" className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/25 hover:from-orange-600 hover:to-orange-700 transition-all">
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="mx-auto max-w-3xl px-6 pb-10 pt-16 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5">
          <Zap className="h-3.5 w-3.5 text-orange-500" />
          <span className="text-sm font-semibold text-orange-600">Simple, honest pricing</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
          Start free.<br className="hidden sm:block" /> Scale when you&rsquo;re ready.
        </h1>
        <p className="mt-4 text-lg text-slate-500">No hidden fees. No credit card required for the free plan.</p>

        {/* Billing toggle */}
        <div className="mt-8 inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          {(['monthly', 'annual'] as Billing[]).map(b => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={cn(
                'rounded-xl px-5 py-2 text-sm font-semibold transition-all capitalize',
                billing === b
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {b}
              {b === 'annual' && billing !== 'annual' && (
                <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  Save 20%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map(plan => {
            const price = billing === 'annual' ? plan.annualPrice : plan.monthlyPrice
            const priceId = billing === 'annual' ? plan.stripePriceAnnual : plan.stripePriceMonthly
            const isPro = plan.highlighted

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative flex flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1',
                  isPro
                    ? 'shadow-2xl shadow-slate-900/20'
                    : 'border border-slate-200/80 bg-white shadow-sm hover:shadow-lg',
                )}
                style={isPro ? { background: 'linear-gradient(160deg, #1a2035 0%, #1e2a45 100%)' } : {}}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-1 text-[11px] font-bold text-white shadow-md shadow-orange-500/30">
                      <Zap className="h-3 w-3" /> {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan info */}
                <div className="mb-5">
                  <p className={cn('text-xs font-bold uppercase tracking-widest', isPro ? 'text-orange-400' : 'text-slate-400')}>
                    {plan.name}
                  </p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className={cn('text-4xl font-extrabold tabular-nums', isPro ? 'text-white' : 'text-slate-900')}>
                      ${price}
                    </span>
                    {price > 0 && (
                      <span className={cn('text-sm', isPro ? 'text-slate-400' : 'text-slate-400')}>/mo</span>
                    )}
                  </div>
                  {billing === 'annual' && price > 0 && (
                    <p className={cn('mt-0.5 text-xs', isPro ? 'text-slate-500' : 'text-slate-400')}>
                      Billed ${price * 12}/year
                    </p>
                  )}
                  <p className={cn('mt-2 text-sm', isPro ? 'text-slate-400' : 'text-slate-500')}>{plan.description}</p>
                </div>

                {/* CTA */}
                {plan.id === 'free' ? (
                  <Link
                    href="/auth/signup"
                    className="mb-5 block rounded-xl border border-slate-200 bg-white py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Get started free
                  </Link>
                ) : (
                  <button
                    onClick={() => priceId && startCheckout(priceId)}
                    disabled={!priceId}
                    className={cn(
                      'mb-5 rounded-xl py-2.5 text-sm font-bold transition-all',
                      isPro
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30 hover:from-orange-600 hover:to-orange-700'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                      !priceId && 'cursor-not-allowed opacity-40',
                    )}
                  >
                    Get {plan.name}
                  </button>
                )}

                {/* Features */}
                <ul className="flex-1 space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <div className={cn('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full', isPro ? 'bg-emerald-500/20' : 'bg-emerald-50')}>
                        <Check className="h-2.5 w-2.5 text-emerald-500" />
                      </div>
                      <span className={cn('text-sm', isPro ? 'text-slate-300' : 'text-slate-700')}>{f}</span>
                    </li>
                  ))}
                  {plan.limits.map(l => (
                    <li key={l} className="flex items-start gap-2">
                      <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-100">
                        <X className={cn('h-2.5 w-2.5', isPro ? 'text-slate-600' : 'text-slate-400')} />
                      </div>
                      <span className={cn('text-sm', isPro ? 'text-slate-600' : 'text-slate-400')}>{l}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Enterprise row */}
        <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white px-8 py-6 shadow-sm">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="text-base font-bold text-slate-900">Need something bigger?</p>
              <p className="mt-0.5 text-sm text-slate-500">Custom volumes, dedicated infrastructure, and SLA-backed support.</p>
            </div>
            <Link
              href="mailto:hello@etsyanalyzer.com"
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Contact sales <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mx-auto max-w-2xl px-6 pb-24">
        <h2 className="mb-8 text-center text-2xl font-extrabold text-slate-900">Frequently asked questions</h2>
        <div className="space-y-3">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-800">{q}</p>
              <p className="mt-1.5 text-sm text-slate-500">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
