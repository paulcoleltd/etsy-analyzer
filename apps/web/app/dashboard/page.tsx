import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-600">Welcome, {session.user?.name ?? session.user?.email}</p>
      <p className="mt-1 text-sm text-gray-400">Plan: {(session as unknown as { user: { plan?: string } }).user?.plan ?? 'free'}</p>
      <div className="mt-8 rounded-xl border bg-white p-6">
        <p className="text-sm text-gray-500">Dashboard analytics coming in Phase 5.</p>
      </div>
    </main>
  )
}
