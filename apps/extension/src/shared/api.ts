/**
 * Typed API client for the extension.
 * All requests go through getAccessToken() for automatic refresh.
 */
import { getAccessToken } from './auth'
import { cacheGet, cacheSet, TTL } from './cache'

const RESEARCH_URL = 'http://localhost:8002'
const GRADER_URL   = 'http://localhost:8004'

// ── Types ─────────────────────────────────────────────────────────

export interface ListingIntelligence {
  etsy_listing_id: string
  shop_id: string
  title: string | null
  tags: string[]
  price_usd: number | null
  num_reviews: number
  est_monthly_revenue: number | null
  est_monthly_units: number | null
  revenue_confidence: 'low' | 'medium' | 'high' | null
  opportunity_score: number | null
  listing_grade: string | null
  photo_count: number
  shipping_free: boolean
  is_bestseller: boolean
  category_l1: string | null
}

export interface ShopIntelligence {
  etsy_shop_id: string
  listing_count: number
  est_monthly_revenue: number
  avg_price_usd: number
  avg_reviews: number
  top_listings: Array<{
    etsy_listing_id: string
    title: string | null
    est_monthly_revenue: number | null
    num_reviews: number
    listing_grade: string | null
  }>
}

export interface GradeResult {
  etsy_listing_id: string
  overall_grade: string
  overall_score: number
  dimension_scores: Record<string, number>
  ai_suggestions: Record<string, unknown> | null
}

// ── Helpers ───────────────────────────────────────────────────────

async function apiFetch<T>(url: string): Promise<T | null> {
  const token = await getAccessToken()
  if (!token) return null

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

// ── Public API ────────────────────────────────────────────────────

export async function getListingIntelligence(
  listingId: string,
): Promise<ListingIntelligence | null> {
  const cacheKey = `listing:${listingId}`
  const cached = await cacheGet<ListingIntelligence>(cacheKey)
  if (cached) return cached

  const data = await apiFetch<ListingIntelligence>(
    `${RESEARCH_URL}/v1/research/listing/${listingId}`,
  )
  if (data) await cacheSet(cacheKey, data, TTL.LISTING)
  return data
}

export async function getListingsBatch(
  listingIds: string[],
): Promise<Map<string, ListingIntelligence>> {
  const results = new Map<string, ListingIntelligence>()
  // Parallel fetch — cap at 10 concurrent to avoid hammering the API
  const chunks = []
  for (let i = 0; i < listingIds.length; i += 10) {
    chunks.push(listingIds.slice(i, i + 10))
  }
  for (const chunk of chunks) {
    const fetched = await Promise.all(
      chunk.map((id) => getListingIntelligence(id).then((d) => ({ id, d }))),
    )
    for (const { id, d } of fetched) {
      if (d) results.set(id, d)
    }
  }
  return results
}

export async function getShopIntelligence(
  shopId: string,
): Promise<ShopIntelligence | null> {
  const cacheKey = `shop:${shopId}`
  const cached = await cacheGet<ShopIntelligence>(cacheKey)
  if (cached) return cached

  const data = await apiFetch<ShopIntelligence>(
    `${RESEARCH_URL}/v1/research/shop/${shopId}`,
  )
  if (data) await cacheSet(cacheKey, data, TTL.SHOP)
  return data
}

export async function getListingGrade(
  listingId: string,
): Promise<GradeResult | null> {
  const cacheKey = `grade:${listingId}`
  const cached = await cacheGet<GradeResult>(cacheKey)
  if (cached) return cached

  const token = await getAccessToken()
  if (!token) return null

  try {
    const res = await fetch(`${GRADER_URL}/v1/grade/listing`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ etsy_listing_id: listingId }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as GradeResult
    await cacheSet(cacheKey, data, TTL.LISTING)
    return data
  } catch {
    return null
  }
}
