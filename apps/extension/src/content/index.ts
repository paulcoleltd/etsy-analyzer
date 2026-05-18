/**
 * Content script entry-point.
 * Detects the current Etsy page type and initialises the correct overlay.
 * Watches for Etsy's SPA navigation (URL changes without full page reload).
 */
import { getAccessToken } from '../shared/auth'
import { initSearchPage, cleanupSearchPage } from './search-page'
import { initListingPage, cleanupListingPage } from './listing-page'
import { initShopPage, cleanupShopPage } from './shop-page'

type PageType = 'search' | 'listing' | 'shop' | 'other'

function detectPage(url: string): PageType {
  if (/\/search(\?|$)/.test(url)) return 'search'
  if (/\/listing\/\d+/.test(url))  return 'listing'
  if (/\/shop\/[^/]+/.test(url))   return 'shop'
  return 'other'
}

function extractListingId(url: string): string | null {
  const m = url.match(/\/listing\/(\d+)/)
  return m ? m[1] : null
}

function extractShopId(url: string): string | null {
  const m = url.match(/\/shop\/([^/?#]+)/)
  return m ? m[1] : null
}

let currentPage: PageType = 'other'

async function init(url = location.href): Promise<void> {
  const token = await getAccessToken()
  if (!token) return   // not signed in — nothing to inject

  const page = detectPage(url)
  if (page === currentPage && page !== 'other') return  // same page, no re-init

  // Cleanup previous page overlays
  cleanupSearchPage()
  cleanupListingPage()
  cleanupShopPage()

  currentPage = page

  if (page === 'search') {
    await initSearchPage()
  } else if (page === 'listing') {
    const listingId = extractListingId(url)
    if (listingId) await initListingPage(listingId)
  } else if (page === 'shop') {
    const shopId = extractShopId(url)
    if (shopId) await initShopPage(shopId)
  }
}

// ── Initial load ──────────────────────────────────────────────────

init()

// ── SPA navigation watcher ────────────────────────────────────────

let lastUrl = location.href

const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href
    // Small delay to let Etsy's React render the new page
    setTimeout(() => init(location.href), 600)
  }
})

observer.observe(document, { subtree: true, childList: true })
