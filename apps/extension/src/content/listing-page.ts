/**
 * Injects a fixed-position side panel on Etsy listing pages.
 * Shows: revenue estimate, grade badge, tag quality scores, CTAs.
 */
import { getListingIntelligence, getListingGrade } from '../shared/api'

const PANEL_ID = 'ea-listing-panel'
const WEB_APP  = 'http://localhost:3000'

function gradeColor(grade: string): string {
  const map: Record<string, string> = {
    A: '#16a34a', B: '#0d9488', C: '#d97706', D: '#ea580c', F: '#dc2626',
  }
  return map[grade] ?? '#6b7280'
}

function confidenceLabel(c: string | null): string {
  if (c === 'high')   return '● High confidence'
  if (c === 'medium') return '◐ Medium confidence'
  return '○ Low confidence'
}

function buildPanel(_listingId: string): HTMLDivElement {
  const panel = document.createElement('div')
  panel.id = PANEL_ID
  panel.style.cssText = `
    position:fixed; right:16px; top:80px; z-index:99999;
    width:240px; background:#fff; border:1px solid #e5e7eb;
    border-radius:12px; padding:16px; box-shadow:0 4px 24px rgba(0,0,0,.12);
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    font-size:13px; color:#111827;
  `
  panel.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
      <span style="font-weight:700;font-size:14px;color:#f97316;">EA</span>
      <span style="font-weight:600;color:#374151;">Etsy Analyzer</span>
    </div>
    <div id="ea-panel-content" style="color:#6b7280;font-size:12px;">Loading…</div>
  `
  return panel
}

function renderContent(
  panel: HTMLDivElement,
  listingId: string,
  revenue: number | null,
  units: number | null,
  confidence: string | null,
  grade: string | null,
  score: number | null,
  tags: string[],
): void {
  const content = panel.querySelector<HTMLDivElement>('#ea-panel-content')
  if (!content) return

  const revenueHtml = revenue != null
    ? `<div style="text-align:center;margin-bottom:12px;">
         <div style="font-size:22px;font-weight:800;color:#111827;">
           $${revenue >= 1000 ? (revenue / 1000).toFixed(1) + 'k' : Math.round(revenue)}
         </div>
         <div style="font-size:11px;color:#6b7280;">est. revenue / month</div>
         ${units != null ? `<div style="font-size:11px;color:#6b7280;">${units} units/mo</div>` : ''}
         <div style="font-size:10px;color:#9ca3af;margin-top:2px;">${confidenceLabel(confidence)}</div>
       </div>`
    : `<div style="color:#9ca3af;text-align:center;margin-bottom:12px;">Revenue data unavailable</div>`

  const gradeHtml = grade
    ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
         <span style="display:inline-flex;align-items:center;justify-content:center;
           width:32px;height:32px;border-radius:50%;font-weight:800;font-size:16px;
           color:#fff;background:${gradeColor(grade)};">${grade}</span>
         <div>
           <div style="font-size:11px;font-weight:600;color:#374151;">Listing grade</div>
           ${score != null ? `<div style="font-size:10px;color:#9ca3af;">${score.toFixed(0)}/100</div>` : ''}
         </div>
       </div>`
    : ''

  const tagHtml = tags.length
    ? `<div style="margin-bottom:10px;">
         <div style="font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Tags</div>
         <div style="display:flex;flex-wrap:wrap;gap:3px;">
           ${tags.slice(0, 6).map(t =>
             `<span style="background:#f3f4f6;border-radius:4px;padding:1px 5px;font-size:10px;color:#374151;">${t}</span>`
           ).join('')}
           ${tags.length > 6 ? `<span style="font-size:10px;color:#9ca3af;">+${tags.length - 6}</span>` : ''}
         </div>
       </div>`
    : ''

  const ctaHtml = `
    <div style="border-top:1px solid #f3f4f6;padding-top:10px;display:flex;flex-direction:column;gap:6px;">
      <a href="${WEB_APP}/grader?id=${listingId}" target="_blank"
         style="display:block;text-align:center;background:#f97316;color:#fff;
           border-radius:8px;padding:6px 10px;font-size:12px;font-weight:600;
           text-decoration:none;">
        Full report →
      </a>
    </div>
  `

  content.innerHTML = revenueHtml + gradeHtml + tagHtml + ctaHtml
}

function renderError(panel: HTMLDivElement): void {
  const content = panel.querySelector<HTMLDivElement>('#ea-panel-content')
  if (content) {
    content.innerHTML = `<div style="color:#9ca3af;font-size:12px;text-align:center;">
      Could not load data for this listing.
    </div>`
  }
}

// ── Public interface ──────────────────────────────────────────────

export async function initListingPage(listingId: string): Promise<void> {
  // Remove any existing panel
  cleanupListingPage()

  const panel = buildPanel(listingId)
  document.body.appendChild(panel)

  // Fetch in parallel
  const [intel, grade] = await Promise.all([
    getListingIntelligence(listingId),
    getListingGrade(listingId),
  ])

  if (!intel && !grade) {
    renderError(panel)
    return
  }

  renderContent(
    panel,
    listingId,
    intel?.est_monthly_revenue ?? null,
    intel?.est_monthly_units ?? null,
    intel?.revenue_confidence ?? null,
    grade?.overall_grade ?? intel?.listing_grade ?? null,
    grade?.overall_score ?? null,
    intel?.tags ?? [],
  )
}

export function cleanupListingPage(): void {
  document.getElementById(PANEL_ID)?.remove()
}
