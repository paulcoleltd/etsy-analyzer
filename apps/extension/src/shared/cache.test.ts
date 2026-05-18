import { describe, it, expect, beforeEach, vi } from 'vitest'

// Stub chrome with no session storage → forces memory fallback path
vi.stubGlobal('chrome', { storage: { session: undefined } })

const { cacheGet, cacheSet, cacheClear, TTL } = await import('./cache')

describe('cache module (memory fallback)', () => {
  beforeEach(async () => {
    await cacheClear()
  })

  it('returns null for unknown key', async () => {
    expect(await cacheGet('no-such-key')).toBeNull()
  })

  it('stores and retrieves a value', async () => {
    await cacheSet('test', { foo: 'bar' }, 60)
    expect(await cacheGet('test')).toEqual({ foo: 'bar' })
  })

  it('returns null after TTL expires', async () => {
    await cacheSet('expiring', 'value', 0)  // 0s TTL → already expired
    expect(await cacheGet('expiring')).toBeNull()
  })

  it('cacheClear with prefix removes only matching keys', async () => {
    await cacheSet('listing:1', 'a', 60)
    await cacheSet('listing:2', 'b', 60)
    await cacheSet('grade:1',   'c', 60)
    await cacheClear('listing:')
    expect(await cacheGet('listing:1')).toBeNull()
    expect(await cacheGet('listing:2')).toBeNull()
    expect(await cacheGet('grade:1')).toBe('c')
  })

  it('cacheClear with no prefix removes all keys', async () => {
    await cacheSet('k1', 1, 60)
    await cacheSet('k2', 2, 60)
    await cacheClear()
    expect(await cacheGet('k1')).toBeNull()
    expect(await cacheGet('k2')).toBeNull()
  })

  it('TTL constants are positive integers', () => {
    expect(TTL.LISTING).toBeGreaterThan(0)
    expect(TTL.SEARCH).toBeGreaterThan(0)
    expect(TTL.SHOP).toBeGreaterThan(0)
  })
})
