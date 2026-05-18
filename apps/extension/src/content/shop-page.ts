/**
 * Injects a stats bar at the top of an Etsy shop page.
 * Shows: est. monthly revenue, listing count, avg reviews, top listing.
 */
import { getShopIntelligence } from '../shared/api'

const BAR_ID   = 'ea-shop-bar'
const WEB_APP  = 'http://localhost:3000'

function buildBar(): HTMLDivElement {
  const bar = document.createElement('div')
  bar.id = BAR_ID
  bar.style.cssText = `
    background:#fff7ed; border-bottom:2px solid #fed7aa;
    padding:10px 20px; display:flex; align-items:center; gap:24px;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    font-size:13px; color:#92400e; position:relative; z-index:1000;
  `
  bar.innerHTML = `
    <span style="font-weight:700;color:#f97316;font-size:14px;">EA</span>
    <span id="ea-shop-stats" style="display:flex;gap:24px;align-items:center;flex:1;">
      <span style="color:#9ca3af;">Loading shop intelligence…</span>
    </span>
  `
  return bar
}

function statItem(label: string, value: string): string {
  return `
    <span style="display:flex;flex-direction:column;align-items:flex-start;">
      <span style="font-size:10px;color:#92400e;opacity:.7;text-transform:uppercase;letter-spacing:.05em;">${label}</span>
      <span style="font-weight:700;color:#78350f;font-size:14px;">${value}</span>
    </span>
  `
}

export async function initShopPage(shopId: string): Promise<void> {
  cleanupShopPage()

  const bar = buildBar()

  // Insert at the top of the page, before the first shop element
  const shopHeader = document.querySelector<HTMLElement>(
    '[data-section="shop-home-main"], main, #content',
  )
  if (shopHeader?.parentElement) {
    shopHeader.parentElement.insertBefore(bar, shopHeader)
  } else {
    document.body.insertBefore(bar, document.body.firstChild)
  }

  const data = await getShopIntelligence(shopId)
  const stats = bar.querySelector<HTMLElement>('#ea-shop-stats')
  if (!stats) return

  if (!data) {
    stats.innerHTML = `<span style="color:#9ca3af;">No data available for this shop yet.</span>`
    return
  }

  const revenue = data.est_monthly_revenue >= 1000
    ? `$${(data.est_monthly_revenue / 1000).toFixed(1)}k`
    : `$${Math.round(data.est_monthly_revenue)}`

  stats.innerHTML =
    statItem('Est. revenue/mo',  revenue) +
    statItem('Active listings',  data.listing_count.toString()) +
    statItem('Avg reviews',      data.avg_reviews.toFixed(0)) +
    statItem('Avg price',        `$${data.avg_price_usd.toFixed(0)}`) +
    `<a href="${WEB_APP}/competitors?add=${encodeURIComponent(shopId)}" target="_blank"
       style="margin-left:auto;background:#f97316;color:#fff;border-radius:8px;
         padding:5px 12px;font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;">
       Track shop
     </a>`
}

export function cleanupShopPage(): void {
  document.getElementById(BAR_ID)?.remove()
}
