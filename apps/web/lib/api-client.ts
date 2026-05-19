import type { ApiError } from '@etsy-analyzer/types'

const AUTH_URL        = process.env.NEXT_PUBLIC_AUTH_URL         ?? 'http://localhost:3001'
const ANALYTICS_URL   = process.env.NEXT_PUBLIC_ANALYTICS_URL    ?? 'http://localhost:8001'
const RESEARCH_URL    = process.env.NEXT_PUBLIC_RESEARCH_URL     ?? 'http://localhost:8012'
const KEYWORD_URL     = process.env.NEXT_PUBLIC_KEYWORD_URL      ?? 'http://localhost:8013'
const GRADER_URL      = process.env.NEXT_PUBLIC_GRADER_URL       ?? 'http://localhost:8004'
const COMPETITOR_URL  = process.env.NEXT_PUBLIC_COMPETITOR_URL   ?? 'http://localhost:3002'
const NOTIFICATION_URL = process.env.NEXT_PUBLIC_NOTIFICATION_URL ?? 'http://localhost:3003'

let _accessToken:  string | null = null
let _refreshToken: string | null = null
let _refreshPromise: Promise<string> | null = null

export function setTokens(access: string, refresh: string) {
  _accessToken  = access
  _refreshToken = refresh
}

export function clearTokens() {
  _accessToken  = null
  _refreshToken = null
}

/** Decode JWT payload without verification (browser-side only). */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

async function doRefresh(): Promise<string> {
  if (!_refreshToken) throw new Error('No refresh token')
  const res = await fetch(`${AUTH_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: _refreshToken }),
  })
  if (!res.ok) {
    clearTokens()
    window.location.href = '/auth/signin'
    throw new Error('Session expired')
  }
  const data = (await res.json()) as { accessToken: string; refreshToken: string }
  setTokens(data.accessToken, data.refreshToken)
  return data.accessToken
}

async function getToken(): Promise<string | null> {
  return _accessToken
}

async function request<T>(
  baseUrl: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken()

  const makeRequest = async (t: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (t) {
      headers['Authorization'] = `Bearer ${t}`

      // Python FastAPI services read user identity from x-user-id header
      // Extract sub claim from the JWT payload without network round-trip
      const payload = decodeJwtPayload(t)
      if (payload?.sub) {
        headers['x-user-id'] = String(payload.sub)
      } else if (payload?.userId) {
        headers['x-user-id'] = String(payload.userId)
      }
    }

    return fetch(`${baseUrl}${path}`, { ...options, headers })
  }

  let res = await makeRequest(token)

  // Token refresh on 401
  if (res.status === 401 && _refreshToken) {
    if (!_refreshPromise) {
      _refreshPromise = doRefresh().finally(() => { _refreshPromise = null })
    }
    const newToken = await _refreshPromise
    res = await makeRequest(newToken)
  }

  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({
      error:     'unknown_error',
      message:   'An unexpected error occurred',
      requestId: '',
      timestamp: new Date().toISOString(),
    }))
    throw error
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ── Typed API namespaces ──────────────────────────────────────────

export const api = {
  auth: {
    signup: (data: { email: string; password: string; name: string }) =>
      request(AUTH_URL, '/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
    signin: (data: { email: string; password: string }) =>
      request<{ accessToken: string; refreshToken: string; expiresIn: number }>(
        AUTH_URL, '/auth/signin', { method: 'POST', body: JSON.stringify(data) },
      ),
    signout: () => request(AUTH_URL, '/auth/signout', { method: 'POST' }),
    me:      () => request(AUTH_URL, '/auth/me'),
    verifyEmail:    (token: string) =>
      request(AUTH_URL, '/auth/verify-email',    { method: 'POST', body: JSON.stringify({ token }) }),
    forgotPassword: (email: string) =>
      request(AUTH_URL, '/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword:  (token: string, newPassword: string) =>
      request(AUTH_URL, '/auth/reset-password',  { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
  },

  dashboard: {
    overview: (period: string) =>
      request(ANALYTICS_URL, `/v1/dashboard/overview?period=${period}`),
    listings: (params: Record<string, string>) =>
      request(ANALYTICS_URL, `/v1/dashboard/listings?${new URLSearchParams(params)}`),
    revenue:  (from: string, to: string, granularity: string) =>
      request(ANALYTICS_URL, `/v1/dashboard/revenue?from=${from}&to=${to}&granularity=${granularity}`),
  },

  research: {
    search:   (q: string, params?: Record<string, string>) =>
      request(RESEARCH_URL, `/v1/research/search?q=${encodeURIComponent(q)}&${new URLSearchParams(params)}`),
    niche:    (keyword: string) =>
      request(RESEARCH_URL, `/v1/research/niche/${encodeURIComponent(keyword)}`),
    listing:  (id: string) =>
      request(RESEARCH_URL, `/v1/research/listing/${id}`),
    trending: () =>
      request(RESEARCH_URL, '/v1/research/trending'),
  },

  keywords: {
    explore:      (q: string) =>
      request(KEYWORD_URL, `/v1/keywords/explore?q=${encodeURIComponent(q)}`),
    optimiseTitle: (data: { title: string; tags: string[]; category: string }) =>
      request(KEYWORD_URL, '/v1/keywords/title-optimize', { method: 'POST', body: JSON.stringify(data) }),
    cluster:      (keywords: string[]) =>
      request(KEYWORD_URL, '/v1/keywords/cluster', { method: 'POST', body: JSON.stringify({ keywords }) }),
    trends:       (q: string, period = '12m') =>
      request(KEYWORD_URL, `/v1/keywords/trends?q=${encodeURIComponent(q)}&period=${period}`),
  },

  grader: {
    grade:      (data: { etsy_listing_id?: string; url?: string }) =>
      request(GRADER_URL, '/v1/grade/listing', { method: 'POST', body: JSON.stringify(data) }),
    bulkStart:  (shopId: string) =>
      request(GRADER_URL, '/v1/grade/bulk',            { method: 'POST', body: JSON.stringify({ shop_id: shopId }) }),
    bulkStatus: (jobId: string) =>
      request(GRADER_URL, `/v1/grade/bulk/${jobId}/status`),
  },

  competitors: {
    list:   () =>
      request(COMPETITOR_URL, '/v1/competitors'),
    add:    (etsyShopId: string) =>
      request(COMPETITOR_URL, '/v1/competitors', { method: 'POST', body: JSON.stringify({ etsy_shop_id: etsyShopId }) }),
    remove: (id: string) =>
      request(COMPETITOR_URL, `/v1/competitors/${id}`, { method: 'DELETE' }),
  },

  notifications: {
    list:       (page = 1, limit = 20) =>
      request(NOTIFICATION_URL, `/v1/notifications?page=${page}&limit=${limit}`),
    markRead:   (id: string) =>
      request(NOTIFICATION_URL, `/v1/notifications/${id}/read`,  { method: 'PUT' }),
    markAllRead: () =>
      request(NOTIFICATION_URL, '/v1/notifications/read-all',    { method: 'PUT' }),
  },
}
