/**
 * Token management for the Chrome extension.
 * Tokens are stored in chrome.storage.local (persisted across sessions).
 * Access token is refreshed ~1 minute before expiry via a chrome.alarms alarm.
 */

const AUTH_URL = 'http://localhost:3001'
const ALARM_NAME = 'token-refresh'

interface StoredTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number   // Unix ms
  userEmail?: string
  userName?: string
  userPlan?: string
}

// ── Read / write ──────────────────────────────────────────────────

export async function getStoredTokens(): Promise<StoredTokens | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['tokens'], (result) => {
      resolve((result['tokens'] as StoredTokens | undefined) ?? null)
    })
  })
}

async function setStoredTokens(tokens: StoredTokens): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ tokens }, resolve)
  })
}

export async function clearTokens(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['tokens'], resolve)
  })
}

// ── Token retrieval (auto-refresh) ───────────────────────────────

export async function getAccessToken(): Promise<string | null> {
  const stored = await getStoredTokens()
  if (!stored) return null

  // Token still valid (with 60s buffer)
  if (Date.now() < stored.expiresAt - 60_000) {
    return stored.accessToken
  }

  // Token expired — try refreshing
  return refreshAccessToken(stored.refreshToken)
}

export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${AUTH_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) {
      await clearTokens()
      return null
    }
    const data = (await res.json()) as {
      accessToken: string
      refreshToken: string
      expiresIn: number
    }
    const stored = await getStoredTokens()
    await setStoredTokens({
      accessToken:  data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt:    Date.now() + data.expiresIn * 1000,
      userEmail:    stored?.userEmail,
      userName:     stored?.userName,
      userPlan:     stored?.userPlan,
    })
    scheduleRefreshAlarm(data.expiresIn)
    return data.accessToken
  } catch {
    return null
  }
}

// ── Sign-in ───────────────────────────────────────────────────────

export async function signIn(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${AUTH_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = (await res.json()) as { message?: string }
      return { ok: false, error: err.message ?? 'Invalid email or password' }
    }
    const tokens = (await res.json()) as {
      accessToken: string
      refreshToken: string
      expiresIn: number
    }

    // Fetch user profile
    const meRes = await fetch(`${AUTH_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    })
    const me = meRes.ok
      ? (await meRes.json()) as { email?: string; name?: string; plan?: string }
      : {}

    await setStoredTokens({
      accessToken:  tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt:    Date.now() + tokens.expiresIn * 1000,
      userEmail:    me.email,
      userName:     me.name,
      userPlan:     me.plan,
    })
    scheduleRefreshAlarm(tokens.expiresIn)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: 'Network error — check you are connected.' }
  }
}

export async function signOut(): Promise<void> {
  const token = await getAccessToken()
  if (token) {
    fetch(`${AUTH_URL}/auth/signout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
  }
  await clearTokens()
  chrome.alarms.clear(ALARM_NAME)
}

// ── Alarm scheduling ──────────────────────────────────────────────

/** Schedule an alarm to fire ~1 minute before token expiry. */
export function scheduleRefreshAlarm(expiresInSeconds: number): void {
  const delayMinutes = Math.max(1, Math.floor((expiresInSeconds - 60) / 60))
  chrome.alarms.create(ALARM_NAME, { delayInMinutes: delayMinutes })
}
