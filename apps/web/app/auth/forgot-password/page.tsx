'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, CheckCircle2, Mail, ArrowLeft } from 'lucide-react'
import { api } from '@/lib/api-client'
import { AuthShell } from '@/components/layout/AuthShell'

const schema = z.object({ email: z.string().email('Enter a valid email') })
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [done, setDone] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    await api.auth.forgotPassword(data.email).catch(() => {})
    setDone(true)
  }

  /* ── Success ── */
  if (done) {
    return (
      <AuthShell tagline="Check your inbox.">
        <div className="rounded-2xl border border-slate-200/70 bg-white px-8 py-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Reset link sent</h2>
          <p className="mt-2 text-sm text-slate-500">
            If that email is registered, we&apos;ve sent a password reset link. Check your spam folder too.
          </p>
          <Link href="/auth/signin" className="btn-primary mx-auto mt-6 w-fit">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </div>
      </AuthShell>
    )
  }

  /* ── Form ── */
  return (
    <AuthShell tagline="We'll get you back in.">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Reset your password</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white px-8 py-8 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center mt-1">
            {isSubmitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
              : <><Mail className="h-4 w-4" /> Send reset link</>}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </Link>
      </p>
    </AuthShell>
  )
}
