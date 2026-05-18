'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Zap } from 'lucide-react'
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
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="text-xl font-bold text-orange-500">Etsy Analyzer</Link>
        <div className="flex items-center gap-4">
          <Link href="/auth/signin" className="text-sm text-gray-600 hover:text-gray-900">Sign in</Link>
          <Link href="/auth/signup" className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors">Start free</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-10 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900">Simple, honest pricing</h1>
        <p className="mt-3 text-lg text-gray-500">Start free. Upgrade when you need more data.</p>

        {/* Billing toggle */}
        <div className="mt-8 inline-flex items-center gap-3 rounded-full border bg-gray-50 p-1">
          {(['monthly', 'annual'] as Billing[]).map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={cn(
                'rounded-full px-5 py-2 text-sm font-medium transition-colors capitalize',
                billing === b ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {b}
              {b === 'annual' && (
                <span className="ml-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                  Save 20%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="max-w-6xl mx-auto px-6 pb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLANS.map((plan) => {
          const price = billing === 'annual' ? plan.annualPrice : plan.monthlyPrice
          const priceId = billing === 'annual' ? plan.stripePriceAnnual : plan.stripePriceMonthly

          return (
            <div
              key={plan.id}
              className={cn(
                'relative flex flex-col rounded-2xl border p-6',
                plan.highlighted
                  ? 'border-orange-400 bg-orange-50 shadow-lg shadow-orange-100'
                  : 'bg-white',
              )}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
                  {plan.badge}
                </span>
              )}

              <div className="mb-5">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{plan.name}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">${price}</span>
                  {price > 0 && <span className="text-sm text-gray-400">/mo</span>}
                </div>
                {billing === 'annual' && price > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">Billed ${price * 12}/year</p>
                )}
                <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
              </div>

              <ul className="flex-1 space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                    {f}
                  </li>
                ))}
                {plan.limits.map((l) => (
                  <li key={l} className="flex items-start gap-2 text-sm text-gray-400 line-through">
                    <span className="h-4 w-4 shrink-0 mt-0.5 text-center">×</span>
                    {l}
                  </li>
                ))}
              </ul>

              {plan.id === 'free' ? (
                <Link
                  href="/auth/signup"
                  className="block text-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Get started free
                </Link>
              ) : (
                <button
                  onClick={() => priceId && startCheckout(priceId)}
                  disabled={!priceId}
                  className={cn(
                    'rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
                    plan.highlighted
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50',
                    !priceId && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  Get {plan.name}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently asked questions</h2>
        <div className="space-y-4">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="rounded-xl border bg-gray-50 p-5">
              <p className="font-semibold text-gray-800">{q}</p>
              <p className="mt-1.5 text-sm text-gray-600">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
