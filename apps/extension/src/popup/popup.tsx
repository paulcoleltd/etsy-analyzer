import { createRoot } from 'react-dom/client'
import { useState, useEffect } from 'react'
import { signIn, signOut, getStoredTokens } from '../shared/auth'
import { getListingIntelligence } from '../shared/api'

interface UserState {
  email?: string
  name?: string
  plan?: string
}

// ── Styles (inline — no Tailwind in extension popup) ─────────────

const S = {
  container: {
    padding: '16px',
    minHeight: '200px',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: '12px',
  },
  header: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '8px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f3f4f6',
  },
  logo: { fontWeight: 800, fontSize: '18px', color: '#f97316' },
  title: { fontWeight: 600, fontSize: '14px', color: '#374151' },
  label: { fontSize: '11px', color: '#6b7280', marginBottom: '4px', fontWeight: 500 },
  input: {
    width: '100%',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '8px 10px',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  btnPrimary: {
    width: '100%',
    background: '#f97316',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '9px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnSecondary: {
    background: 'none',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '7px 12px',
    fontSize: '12px',
    cursor: 'pointer',
    color: '#374151',
    fontFamily: 'inherit',
  },
  error: {
    fontSize: '12px',
    color: '#dc2626',
    background: '#fef2f2',
    borderRadius: '6px',
    padding: '6px 10px',
  },
  planBadge: (plan: string) => ({
    display: 'inline-block' as const,
    padding: '2px 8px',
    borderRadius: '99px',
    fontSize: '11px',
    fontWeight: 700,
    background: plan === 'pro' ? '#fff7ed' : plan === 'agency' ? '#f5f3ff' : '#f3f4f6',
    color: plan === 'pro' ? '#ea580c' : plan === 'agency' ? '#7c3aed' : '#6b7280',
    textTransform: 'capitalize' as const,
  }),
  result: {
    background: '#f9fafb',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '12px',
    color: '#374151',
  },
  link: {
    color: '#f97316',
    fontSize: '11px',
    textDecoration: 'none' as const,
    fontWeight: 600,
  },
}

// ── Sub-components ────────────────────────────────────────────────

function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn(email, password)
    setLoading(false)
    if (result.ok) {
      onSuccess()
    } else {
      setError(result.error ?? 'Sign in failed')
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div>
        <p style={S.label}>Email</p>
        <input
          style={S.input}
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoFocus
          required
        />
      </div>
      <div>
        <p style={S.label}>Password</p>
        <input
          style={S.input}
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>
      {error && <p style={S.error}>{error}</p>}
      <button type="submit" style={S.btnPrimary} disabled={loading}>
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
      <p style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>
        <a href="http://localhost:3000/auth/signup" target="_blank" style={S.link}>
          Create an account
        </a>
      </p>
    </form>
  )
}

function SignedInView({ user, onSignOut }: { user: UserState; onSignOut: () => void }) {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<null | { revenue: string; grade: string | null }>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const id = query.trim().replace(/^.*\/listing\/(\d+).*$/, '$1')
    if (!id) return
    setSearching(true)
    setResult(null)
    const data = await getListingIntelligence(id)
    setSearching(false)
    if (data) {
      const rev = data.est_monthly_revenue
      setResult({
        revenue: rev != null
          ? (rev >= 1000 ? `$${(rev / 1000).toFixed(1)}k/mo` : `$${Math.round(rev)}/mo`)
          : 'N/A',
        grade: data.listing_grade,
      })
    } else {
      setResult({ revenue: 'Not found', grade: null })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* User info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
            {user.name ?? user.email}
          </p>
          <span style={S.planBadge(user.plan ?? 'free')}>{user.plan ?? 'free'}</span>
        </div>
        <button style={S.btnSecondary} onClick={onSignOut}>Sign out</button>
      </div>

      {/* Quick lookup */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '6px' }}>
        <input
          style={{ ...S.input, flex: 1, fontSize: '12px' }}
          placeholder="Listing URL or ID…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button
          type="submit"
          disabled={searching || !query.trim()}
          style={{ ...S.btnPrimary, width: 'auto', padding: '8px 12px', whiteSpace: 'nowrap' }}
        >
          {searching ? '…' : 'Look up'}
        </button>
      </form>

      {result && (
        <div style={S.result}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '16px', color: '#111827' }}>
              {result.revenue}
            </span>
            {result.grade && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '28px', height: '28px', borderRadius: '50%',
                fontWeight: 800, fontSize: '14px', color: '#fff',
                background: result.grade === 'A' ? '#16a34a' : result.grade === 'B' ? '#0d9488' :
                  result.grade === 'C' ? '#d97706' : result.grade === 'D' ? '#ea580c' : '#dc2626',
              }}>
                {result.grade}
              </span>
            )}
          </div>
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
            Est. monthly revenue
          </p>
        </div>
      )}

      {/* CTA links */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { label: 'Research',    href: '/research'    },
          { label: 'Keywords',    href: '/keywords'    },
          { label: 'Competitors', href: '/competitors' },
        ].map(({ label, href }) => (
          <a
            key={href}
            href={`http://localhost:3000${href}`}
            target="_blank"
            style={{
              ...S.btnSecondary,
              textDecoration: 'none',
              fontSize: '11px',
              padding: '5px 10px',
            }}
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  )
}

// ── Root component ────────────────────────────────────────────────

function Popup() {
  const [user, setUser] = useState<UserState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStoredTokens().then((tokens) => {
      if (tokens) {
        setUser({ email: tokens.userEmail, name: tokens.userName, plan: tokens.userPlan })
      }
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div style={{ ...S.container, alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
        Loading…
      </div>
    )
  }

  return (
    <div style={S.container}>
      <div style={S.header}>
        <span style={S.logo}>EA</span>
        <span style={S.title}>Etsy Analyzer</span>
      </div>
      {user
        ? <SignedInView user={user} onSignOut={async () => { await signOut(); setUser(null) }} />
        : <SignInForm onSuccess={async () => {
            const t = await getStoredTokens()
            if (t) setUser({ email: t.userEmail, name: t.userName, plan: t.userPlan })
          }} />
      }
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Popup />)
