'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { api } from '@/lib/api-client'

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-10 text-center space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 text-orange-500 mx-auto animate-spin" />
            <h2 className="text-xl font-bold text-gray-900">Verifying your email…</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-gray-900">Email verified!</h2>
            <p className="text-sm text-gray-600">Your account is ready. Sign in to get started.</p>
            <Link
              href="/auth/signin"
              className="inline-block mt-2 rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
            >
              Sign in
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold text-gray-900">Verification failed</h2>
            <p className="text-sm text-gray-600">
              This link is invalid or has expired. Try signing up again or request a new link.
            </p>
            <Link href="/auth/signup" className="block text-sm font-medium text-orange-600 hover:underline">
              Back to sign up
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
