/**
 * Fixture data and page.route() helpers for E2E tests.
 *
 * Usage:
 *   import { mockResearchSearch, mockGrade } from './fixtures'
 *   test('...', async ({ page }) => {
 *     await mockResearchSearch(page)
 *     ...
 *   })
 */
import type { Page } from '@playwright/test'

// ── Fixture data ──────────────────────────────────────────────────────────────

export const FIXTURE_LISTING_ID = '4493579933'

export const FIXTURE_LISTING = {
  etsy_listing_id:      FIXTURE_LISTING_ID,
  shop_id:              'VinylRecordArtUK',
  title:                'Vintage Cocktail Print Vinyl Record Bar Art',
  price_usd:            16.50,
  num_reviews:          47,
  avg_rating:           4.9,
  est_monthly_revenue:  1460.00,
  est_monthly_units:    88,
  revenue_confidence:   'medium',
  opportunity_score:    72.4,
  listing_grade:        'B',
  is_bestseller:        true,
  category_l1:          'Home & Living',
  tags:                 ['vinyl record art', 'bar decor', 'cocktail print', 'home bar',
                         'retro bar sign', 'vintage bar art', 'wall art', 'bar gift',
                         'cocktail bar', 'man cave decor', 'bar wall art', 'pub decor', 'drinks sign'],
  photo_count:          6,
  has_video:            false,
  shipping_free:        false,
}

export const FIXTURE_SEARCH_RESPONSE = {
  keyword: 'vinyl record art',
  total:   142,
  results: [FIXTURE_LISTING],
}

export const FIXTURE_NICHE = {
  keyword:       'vinyl record art',
  niche_score:   78.3,
  rating:        'good',
  total_listings: 3500,
  components: { volume: 8000, competition: 3500, avg_reviews: 25, trend: 'stable' },
  top_shops:   [{ shop_id: 'VinylRecordArtUK', listing_count: 42, est_revenue: 3200 }],
  price_range: { min: 6.99, avg: 14.50, max: 35.00 },
}

export const FIXTURE_GRADE: Record<string, unknown> = {
  etsy_listing_id: FIXTURE_LISTING_ID,
  overall_grade:   'B',
  overall_score:   72.5,
  dimension_scores: {
    title:       85,
    tags:        100,
    description: 35,
    photos:      52,
    price:       90,
    shipping:    40,
  },
  ai_suggestions: {
    title_rewrite:     null,
    tag_additions:     [],
    tag_removals:      [],
    description_tips:  ['Add bullet points listing materials and dimensions', 'Include care instructions'],
    photo_tips:        ['Add 4 more photos to reach the 10-photo optimum', 'Include a lifestyle shot'],
    priority_actions:  ['Expand description to 500+ words', 'Offer free shipping to boost conversion'],
  },
  image_analysis: null,
  graded_at:       new Date().toISOString(),
}

export const FIXTURE_KEYWORD = {
  keyword:         'vinyl record art',
  volume_est:      8000,
  competing_count: 3500,
  competition:     'medium',
  trend_direction: 'stable',
  related:         ['bar decor', 'man cave art', 'record player art', 'retro wall art'],
}

export const FIXTURE_TRENDING = [
  { keyword: 'vinyl record art', listing_count: 3500, avg_revenue: 1200, avg_opportunity_score: 72 },
  { keyword: 'bar decor',        listing_count: 8000, avg_revenue: 890,  avg_opportunity_score: 65 },
  { keyword: 'man cave decor',   listing_count: 4200, avg_revenue: 1100, avg_opportunity_score: 69 },
]

export const FIXTURE_DASHBOARD_OVERVIEW = {
  period:         '30d',
  etsy_connected: false,
  shop_name:      null,
  last_synced:    null,
  revenue_today:  { value: 0 },
  revenue_7d:     { value: 0 },
  revenue_30d:    { value: 0, pct_change: null },
  orders_30d:     { value: 0, unit: 'count' },
  avg_order_value:{ value: 0 },
  total_views_30d:{ value: 0, unit: 'count' },
  top_listings:   [],
}

// ── Route helpers ─────────────────────────────────────────────────────────────

const RESEARCH_BASE  = process.env.NEXT_PUBLIC_RESEARCH_URL  ?? 'http://localhost:8002'
const KEYWORD_BASE   = process.env.NEXT_PUBLIC_KEYWORD_URL   ?? 'http://localhost:8003'
const GRADER_BASE    = process.env.NEXT_PUBLIC_GRADER_URL    ?? 'http://localhost:8004'
const ANALYTICS_BASE = process.env.NEXT_PUBLIC_ANALYTICS_URL ?? 'http://localhost:8001'

/** Intercept all research search calls and return fixture data. */
export async function mockResearchSearch(page: Page) {
  await page.route(`${RESEARCH_BASE}/v1/research/search**`, route =>
    route.fulfill({ status: 200, contentType: 'application/json',
                    body: JSON.stringify(FIXTURE_SEARCH_RESPONSE) }))
}

/** Intercept the niche endpoint for a given keyword. */
export async function mockNiche(page: Page, keyword = 'vinyl+record+art') {
  await page.route(`${RESEARCH_BASE}/v1/research/niche/**`, route =>
    route.fulfill({ status: 200, contentType: 'application/json',
                    body: JSON.stringify(FIXTURE_NICHE) }))
}

/** Intercept listing intelligence. */
export async function mockListingIntelligence(page: Page) {
  await page.route(`${RESEARCH_BASE}/v1/research/listing/**`, route =>
    route.fulfill({ status: 200, contentType: 'application/json',
                    body: JSON.stringify(FIXTURE_LISTING) }))
}

/** Intercept the grader endpoint. */
export async function mockGrade(page: Page) {
  await page.route(`${GRADER_BASE}/v1/grade/listing`, route =>
    route.fulfill({ status: 200, contentType: 'application/json',
                    body: JSON.stringify(FIXTURE_GRADE) }))
}

/** Intercept keyword explore. */
export async function mockKeywordExplore(page: Page) {
  await page.route(`${KEYWORD_BASE}/v1/keywords/explore**`, route =>
    route.fulfill({ status: 200, contentType: 'application/json',
                    body: JSON.stringify(FIXTURE_KEYWORD) }))
}

/** Intercept trending. */
export async function mockTrending(page: Page) {
  await page.route(`${RESEARCH_BASE}/v1/research/trending**`, route =>
    route.fulfill({ status: 200, contentType: 'application/json',
                    body: JSON.stringify(FIXTURE_TRENDING) }))
}

/** Intercept dashboard overview (for no-Etsy-connection state). */
export async function mockDashboardOverview(page: Page) {
  await page.route(`${ANALYTICS_BASE}/v1/dashboard/overview**`, route =>
    route.fulfill({ status: 200, contentType: 'application/json',
                    body: JSON.stringify(FIXTURE_DASHBOARD_OVERVIEW) }))
}

/** Mock Stripe.js to prevent external CDN calls blocking button renders. */
export async function mockStripe(page: Page) {
  await page.route('https://js.stripe.com/**', route =>
    route.fulfill({ status: 200, contentType: 'text/javascript', body: '/* stripe stub */' }))
  await page.route('https://hooks.stripe.com/**', route =>
    route.fulfill({ status: 200, contentType: 'text/javascript', body: '/* stripe stub */' }))
}
