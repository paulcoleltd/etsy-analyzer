/**
 * Session cache backed by chrome.storage.session (cleared on browser close).
 * Falls back to an in-memory Map when the session storage API is unavailable
 * (e.g. content-script context in older Chrome builds).
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number  // Unix ms
}

// In-memory fallback
const memCache = new Map<string, CacheEntry<unknown>>()

function sessionAvailable(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage?.session
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (sessionAvailable()) {
    const result: Record<string, CacheEntry<T>> = await new Promise((resolve) =>
      chrome.storage.session.get([key], (r) => resolve(r as Record<string, CacheEntry<T>>)),
    )
    const entry = result[key]
    if (!entry) return null
    if (Date.now() >= entry.expiresAt) {
      chrome.storage.session.remove([key])
      return null
    }
    return entry.data
  }

  // Memory fallback
  const entry = memCache.get(key) as CacheEntry<T> | undefined
  if (!entry || Date.now() >= entry.expiresAt) {
    memCache.delete(key)
    return null
  }
  return entry.data
}

export async function cacheSet<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
  const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlSeconds * 1000 }

  if (sessionAvailable()) {
    await new Promise<void>((resolve) =>
      chrome.storage.session.set({ [key]: entry }, resolve),
    )
  } else {
    memCache.set(key, entry as CacheEntry<unknown>)
  }
}

export async function cacheClear(prefix?: string): Promise<void> {
  if (sessionAvailable()) {
    if (!prefix) {
      await new Promise<void>((resolve) => chrome.storage.session.clear(resolve))
    } else {
      const all = await new Promise<Record<string, unknown>>((resolve) =>
        chrome.storage.session.get(null, resolve),
      )
      const toRemove = Object.keys(all).filter((k) => k.startsWith(prefix))
      if (toRemove.length) {
        await new Promise<void>((resolve) => chrome.storage.session.remove(toRemove, resolve))
      }
    }
  } else {
    if (!prefix) {
      memCache.clear()
    } else {
      for (const key of memCache.keys()) {
        if (key.startsWith(prefix)) memCache.delete(key)
      }
    }
  }
}

// TTL constants (seconds)
export const TTL = {
  LISTING:   30 * 60,   // 30 min
  SEARCH:    60 * 60,   // 1 h
  SHOP:      60 * 60,   // 1 h
} as const
