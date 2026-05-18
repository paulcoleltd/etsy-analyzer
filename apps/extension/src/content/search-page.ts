/**
 * Injects revenue + opportunity badges onto Etsy search result listing cards.
 * Batch-fetches listing data and injects coloured badges under each title.
 */
import { getListingsBatch } from '../shared/api'

const INJECTED_ATTR = 'data-ea-badge'
const BADGE_CLASS   = 'ea-badge'

// ── Badge HTML ────────────────────────────────────────────────────

function revenueColor(revenue: number): string {
  if (revenue >= 500) return '#16a34a'  // green
  if (revenue >= 100) return '#d97706'  // amber
  return '#dc2626'                       // red
}

function formatRevenue(revenue: number): string {
  if (revenue >= 1000) return `$${(revenue / 1000).toFixed(1)}k/mo`
  return `$${Math.round(revenue)}/mo`
}

function createBadgeEl(
  revenue: number | null,
  confidence: string | null,
  score: number | null,
): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = BADGE_CLASS
  wrap.style.cssText = 'display:inline-flex;align-items:center;gap:4px;margin-top:4px;'

  if (revenue != null) {
    const revBadge = document.createElement('span')
    revBadge.style.cssText = `
      display:inline-block;padding:2px 7px;border-radius:99px;
      font-size:11px;font-weight:700;color:#fff;
      background:${revenueColor(revenue)};
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    `
    revBadge.textContent = formatRevenue(revenue)
    if (confidence === 'low') revBadge.title = 'Estimate confidence: low'
    wrap.appendChild(revBadge)
  }

  if (score != null) {
    const scoreBadge = document.createElement('span')
    scoreBadge.style.cssText = `
      display:inline-block;padding:2px 6px;border-radius:99px;
      font-size:11px;font-weight:600;color:#fff;
      background:#6366f1;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    `
    scoreBadge.textContent = `${Math.round(score)} opp`
    scoreBadge.title = 'Opportunity score (0-100)'
    wrap.appendChild(scoreBadge)
  }

  return wrap
}

// ── Main injection ────────────────────────────────────────────────

export async function initSearchPage(): Promise<void> {
  const cards = document.querySelectorAll<HTMLElement>('[data-listing-id]')
  if (!cards.length) return

  const listingIds = Array.from(cards)
    .map((c) => c.dataset['listingId'] ?? '')
    .filter(Boolean)

  const dataMap = await getListingsBatch(listingIds)

  for (const card of Array.from(cards)) {
    const id = card.dataset['listingId']
    if (!id || card.hasAttribute(INJECTED_ATTR)) continue

    const data = dataMap.get(id)
    if (!data) continue

    const badge = createBadgeEl(
      data.est_monthly_revenue,
      data.revenue_confidence,
      data.opportunity_score,
    )

    // Insert after the listing title
    const titleEl = card.querySelector('h3') ?? card.querySelector('[class*="title"]')
    if (titleEl?.parentElement) {
      titleEl.parentElement.insertBefore(badge, titleEl.nextSibling)
    } else {
      card.appendChild(badge)
    }

    card.setAttribute(INJECTED_ATTR, '1')
  }
}

export function cleanupSearchPage(): void {
  document.querySelectorAll(`.${BADGE_CLASS}`).forEach((el) => el.remove())
  document.querySelectorAll(`[${INJECTED_ATTR}]`).forEach((el) =>
    el.removeAttribute(INJECTED_ATTR),
  )
}
