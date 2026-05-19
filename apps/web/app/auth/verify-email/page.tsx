'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api-client'
import { AuthShell } from '@/components/layout/AuthShell'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (!token) { setStatus('error'); return }
    api.auth.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <AuthShell tagline="One last step.">
      <div className="rounded-2xl border border-slate-200/70 bg-white px-8 py-12 text-center shadow-sm">

        {status === 'loading' && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
              <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Verifying your email…</h2>
            <p className="mt-2 text-sm text-slate-400">This only takes a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Email verified!</h2>
            <p className="mt-2 text-sm text-slate-500">
              Your account is ready. Sign in to get started.
            </p>
            <Link href="/auth/signin" className="btn-primary mx-auto mt-6 w-fit">
              Sign in <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
              <XCircle className="h-7 w-7 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Verification failed</h2>
            <p className="mt-2 text-sm text-slate-500">
              This link is invalid or has expired.
            </p>
            <div className="mt-6 flex flex-col items-center gap-2">
              <Link href="/auth/signup" className="btn-primary w-fit">
                Sign up again
              </Link>
              <Link
                href="/auth/signin"
                className="text-sm font-medium text-slate-500 hover:text-orange-600 transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </AuthShell>
  )
}
