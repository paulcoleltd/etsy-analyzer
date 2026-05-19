'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, CheckCircle2, UserPlus, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api-client'
import { AuthShell } from '@/components/layout/AuthShell'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'One uppercase letter required')
    .regex(/[0-9]/, 'One number required'),
})
type FormData = z.infer<typeof schema>

export default function SignUpPage() {
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setError(null)
    try {
      await api.auth.signup(data)
      setDone(true)
    } catch (e) {
      const err = e as { message?: string }
      setError(err.message ?? 'Something went wrong. Please try again.')
    }
  }

  /* ── Success state ── */
  if (done) {
    return (
      <AuthShell tagline="Almost there!">
        <div className="rounded-2xl border border-slate-200/70 bg-white px-8 py-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Check your inbox</h2>
          <p className="mt-2 text-sm text-slate-500">
            We&apos;ve sent a verification link to your email. Click it to activate your account.
          </p>
          <Link
            href="/auth/signin"
            className="btn-primary mx-auto mt-6 w-fit"
          >
            Go to sign in
          </Link>
        </div>
      </AuthShell>
    )
  }

  /* ── Form ── */
  return (
    <AuthShell tagline="Start for free today.">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Create your account</h2>
        <p className="mt-1 text-sm text-slate-500">No credit card required.</p>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white px-8 py-8 shadow-sm">
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              id="name" type="text" autoComplete="name" placeholder="Jane Smith"
              className="input"
              {...register('name')}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              id="email" type="email" autoComplete="email" placeholder="you@example.com"
              className="input"
              {...register('email')}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password" type="password" autoComplete="new-password" placeholder="Min 8 chars, 1 uppercase, 1 number"
              className="input"
              {...register('password')}
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center mt-1">
            {isSubmitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
              : <><UserPlus className="h-4 w-4" /> Create account</>}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          By signing up you agree to our{' '}
          <Link href="/terms" className="text-slate-600 hover:underline">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-slate-600 hover:underline">Privacy Policy</Link>.
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/auth/signin" className="font-semibold text-orange-600 hover:text-orange-700 transition-colors">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
