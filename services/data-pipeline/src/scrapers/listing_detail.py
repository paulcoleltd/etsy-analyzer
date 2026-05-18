import re
from typing import Any
from tenacity import retry, stop_after_attempt, wait_exponential
from src.scrapers.base import BaseScraper
from src.logger import logger


class ListingDetailScraper(BaseScraper):
    """Scrapes a single Etsy listing page for full detail."""

    BASE_URL = "https://www.etsy.com/listing"

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=4, max=30))
    async def scrape(self, listing_id: str) -> dict[str, Any] | None:
        async with self:
            ctx = await self._new_context()
            page = await ctx.new_page()

            try:
                await self._anti_detect_delay()
                url = f"{self.BASE_URL}/{listing_id}"
                logger.info("scraping_listing", listing_id=listing_id)

                response = await page.goto(url, wait_until="domcontentloaded", timeout=30_000)
                if response and response.status == 404:
                    return None

                await self._human_scroll(page, scrolls=2)

                data = await page.evaluate("""() => {
                    // Tags
                    const tagEls = document.querySelectorAll('[class*="tag"]');
                    const tags = Array.from(tagEls)
                        .map(el => el.textContent.trim().toLowerCase())
                        .filter(t => t.length > 0 && t.length < 30 && !t.includes(' '));

                    // Photos
                    const photoEls = document.querySelectorAll('[data-image-carousel-index] img, [class*="carousel"] img');
                    const photoUrls = Array.from(new Set(
                        Array.from(photoEls)
                            .map(img => img.src || img.dataset.src)
                            .filter(src => src && src.includes('etsystatic.com'))
                    ));

                    // Description
                    const descEl = document.querySelector('[class*="description"]') ||
                                   document.querySelector('[data-buy-box-listing-description]') ||
                                   document.querySelector('p[class*="body"]');

                    // Category path
                    const breadcrumbs = document.querySelectorAll('[class*="breadcrumb"] a, nav[aria-label*="breadcrumb"] a');
                    const categoryPath = Array.from(breadcrumbs).map(a => a.textContent.trim()).filter(Boolean);

                    // Shipping
                    const shippingEl = document.querySelector('[class*="shipping"]');
                    const shippingText = shippingEl ? shippingEl.textContent.toLowerCase() : '';
                    const freeShipping = shippingText.includes('free shipping') ||
                                         shippingText.includes('free delivery');

                    // Price
                    const priceEl = document.querySelector('[data-buy-box-price] [data-currency-value]') ||
                                    document.querySelector('[class*="price"] [data-currency-value]');

                    // Review count
                    const reviewEl = document.querySelector('[class*="review-count"]') ||
                                     document.querySelector('[aria-label*="review"]');
                    const reviewText = reviewEl ? reviewEl.textContent : '';
                    const reviewMatch = reviewText.match(/([\\d,]+)/);

                    // Has video
                    const hasVideo = !!document.querySelector('video, [class*="video"]');

                    return {
                        tags: [...new Set(tags)].slice(0, 13),
                        photo_urls: photoUrls.slice(0, 10),
                        photo_count: photoUrls.length,
                        has_video: hasVideo,
                        description: descEl ? descEl.textContent.trim().slice(0, 5000) : null,
                        category_path: categoryPath,
                        price_raw: priceEl ? priceEl.dataset.currencyValue : null,
                        currency: priceEl ? (priceEl.dataset.currencyCode || 'USD') : 'USD',
                        shipping_free: freeShipping,
                        num_reviews: reviewMatch ? parseInt(reviewMatch[1].replace(',', '')) : 0,
                    };
                }""")

                data["etsy_listing_id"] = listing_id
                return data

            except Exception as exc:
                logger.error("listing_scrape_failed", listing_id=listing_id, error=str(exc))
                raise
            finally:
                await ctx.close()
