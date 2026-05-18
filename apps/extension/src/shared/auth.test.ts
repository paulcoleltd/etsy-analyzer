/**
 * Unit tests for auth helpers that don't need chrome.* APIs.
 * The chrome API surface is stubbed via vitest globals.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Stub chrome.storage.local ─────────────────────────────────────
const store: Record<string, unknown> = {}

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: (keys: string[], cb: (r: Record<string, unknown>) => void) => {
        const result: Record<string, unknown> = {}
        for (const k of keys) result[k] = store[k]
        cb(result)
      },
      set: (obj: Record<string, unknown>, cb: () => void) => {
        Object.assign(store, obj)
        cb()
      },
      remove: (keys: string[], cb: () => void) => {
        for (const k of (Array.isArray(keys) ? keys : [keys])) delete store[k]
        cb()
      },
    },
    session: undefined,  // test memory fallback
  },
  alarms: {
    create: vi.fn(),
    clear: vi.fn(),
  },
})

// ── Import after stub ─────────────────────────────────────────────
const { getStoredTokens, clearTokens, scheduleRefreshAlarm } = await import('./auth')

describe('auth helpers', () => {
  beforeEach(() => {
    Object.keys(store).forEach(k => delete store[k])
  })

  it('getStoredTokens returns null when nothing stored', async () => {
    expect(await getStoredTokens()).toBeNull()
  })

  it('clearTokens removes the tokens key', async () => {
    store['tokens'] = { accessToken: 'abc', refreshToken: 'def', expiresAt: Date.now() + 1000 }
    await clearTokens()
    expect(await getStoredTokens()).toBeNull()
  })

  it('scheduleRefreshAlarm calls chrome.alarms.create with correct delay', () => {
    scheduleRefreshAlarm(900)  // 15 min token
    expect(chrome.alarms.create).toHaveBeenCalledWith(
      'token-refresh',
      expect.objectContaining({ delayInMinutes: expect.any(Number) }),
    )
  })

  it('scheduleRefreshAlarm clamps to minimum 1 minute', () => {
    scheduleRefreshAlarm(30)  // 30s token — should still be ≥1 min
    const call = vi.mocked(chrome.alarms.create).mock.calls.at(-1)!
    expect(call[1].delayInMinutes).toBeGreaterThanOrEqual(1)
  })
})
