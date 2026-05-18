import { describe, it, expect } from 'vitest'

// Extract the detection logic as pure functions so they can be tested without a DOM
function detectPage(url: string): 'search' | 'listing' | 'shop' | 'other' {
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

describe('page detector', () => {
  it('detects search page', () => {
    expect(detectPage('https://www.etsy.com/search?q=ring')).toBe('search')
    expect(detectPage('https://www.etsy.com/search')).toBe('search')
  })

  it('detects listing page', () => {
    expect(detectPage('https://www.etsy.com/listing/123456789/silver-ring')).toBe('listing')
  })

  it('detects shop page', () => {
    expect(detectPage('https://www.etsy.com/shop/MyShop')).toBe('shop')
    expect(detectPage('https://www.etsy.com/shop/MyShop?ref=seller-platform-mcnav')).toBe('shop')
  })

  it('returns other for unknown pages', () => {
    expect(detectPage('https://www.etsy.com')).toBe('other')
    expect(detectPage('https://www.etsy.com/cart')).toBe('other')
  })

  it('extracts listing ID from URL', () => {
    expect(extractListingId('https://www.etsy.com/listing/987654321/my-item')).toBe('987654321')
    expect(extractListingId('https://www.etsy.com/')).toBeNull()
  })

  it('extracts shop ID from URL', () => {
    expect(extractShopId('https://www.etsy.com/shop/AwesomeShop')).toBe('AwesomeShop')
    expect(extractShopId('https://www.etsy.com/shop/AwesomeShop?ref=x')).toBe('AwesomeShop')
    expect(extractShopId('https://www.etsy.com/listing/123')).toBeNull()
  })
})
