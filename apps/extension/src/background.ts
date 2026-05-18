/**
 * MV3 Service Worker.
 * Responsibilities:
 *   1. Handle the token-refresh alarm → silently refresh the access token.
 *   2. Respond to messages from content scripts / popup via chrome.runtime.onMessage.
 */
import { getStoredTokens, refreshAccessToken, clearTokens } from './shared/auth'

const ALARM_NAME = 'token-refresh'

// ── Alarm handler ─────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return

  const stored = await getStoredTokens()
  if (!stored?.refreshToken) return

  const newToken = await refreshAccessToken(stored.refreshToken)
  if (!newToken) {
    // Refresh failed — clear tokens so popup shows sign-in
    await clearTokens()
  }
})

// ── Install / update ──────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  console.log('[EA] Extension installed / updated')
})

// ── Message bridge ────────────────────────────────────────────────
// Content scripts can't use chrome.storage.local in some contexts;
// they send messages here and the background relays the response.

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_TOKEN') {
    getStoredTokens().then((stored) => {
      sendResponse({ token: stored?.accessToken ?? null })
    })
    return true  // keep channel open for async response
  }

  if (message.type === 'IS_SIGNED_IN') {
    getStoredTokens().then((stored) => {
      sendResponse({ signedIn: !!stored?.accessToken })
    })
    return true
  }
})
