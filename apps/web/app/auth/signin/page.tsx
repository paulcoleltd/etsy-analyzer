'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, BarChart2, TrendingUp, Search, Star, AlertCircle } from 'lucide-react'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

const FEATURES = [
  { icon: TrendingUp, text: 'Revenue estimates for any Etsy listing' },
  { icon: Search,     text: 'Keyword research & search volume data' },
  { icon: Star,       text: 'AI-powered listing grade & suggestions' },
]

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setError(null)
    const result = await signIn('credentials', {
      email:    data.email,
      password: data.password,
      redirect: false,
    })
    if (result?.error) {
      setError('Invalid email or password. Please try again.')
      return
    }
    router.push(callbackUrl)
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — branding ── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(140deg, #1a2035 0%, #1e2a45 60%, #1a2035 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-600/40">
            <BarChart2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">Etsy Analyzer</span>
        </div>

        {/* Headline */}
        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold leading-tight text-white">
            Grow your Etsy shop<br />
            <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
              with real data.
            </span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            Revenue estimates, keyword intelligence, and competitor tracking — all in one dashboard.
          </p>

          {/* Feature list */}
          <ul className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/15">
                  <Icon className="h-3.5 w-3.5 text-orange-400" />
                </div>
                <span className="text-sm text-slate-300">{text}</span>
              </li>
            ))}
          </ul>

          {/* Stat pills */}
          <div className="flex gap-3 pt-2">
            {[
              { value: '50K+', label: 'Sellers' },
              { value: '$2M+', label: 'Revenue tracked' },
              { value: '4.9★', label: 'Rating' },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
                <p className="text-base font-bold text-white">{s.value}</p>
                <p className="text-[11px] text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative text-xs text-slate-500">
          © {new Date().getFullYear()} Etsy Analyzer. All rights reserved.
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-[#f1f4f9] px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600">
            <BarChart2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">Etsy Analyzer</span>
        </div>

        <div className="w-full max-w-sm animate-fade-up">
          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">Sign in to your account to continue.</p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white px-8 py-8 shadow-sm shadow-slate-900/5">
            {/* Error alert */}
            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <Link href="/auth/forgot-password" className="text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/25 hover:from-orange-600 hover:to-orange-700 hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
              >
                {isSubmitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
                  : 'Sign in'}
              </button>
            </form>
          </div>

          {/* Footer link */}
          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="font-semibold text-orange-600 hover:text-orange-700 transition-colors">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
