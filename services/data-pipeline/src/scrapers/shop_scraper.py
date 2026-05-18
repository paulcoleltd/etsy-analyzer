from typing import Any
from tenacity import retry, stop_after_attempt, wait_exponential
from src.scrapers.base import BaseScraper
from src.logger import logger


class ShopScraper(BaseScraper):
    """Scrapes an Etsy shop page for listing inventory and shop stats."""

    BASE_URL = "https://www.etsy.com/shop"

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=4, max=30))
    async def scrape(self, shop_name: str) -> dict[str, Any] | None:
        async with self:
            ctx = await self._new_context()
            page = await ctx.new_page()

            try:
                await self._anti_detect_delay()
                url = f"{self.BASE_URL}/{shop_name}"
                logger.info("scraping_shop", shop=shop_name)

                response = await page.goto(url, wait_until="domcontentloaded", timeout=30_000)
                if response and response.status == 404:
                    return None

                await self._human_scroll(page, scrolls=5)

                data = await page.evaluate("""() => {
                    // Sales count
                    const statsEl = document.querySelector('[class*="shop-sales"]') ||
                                    document.querySelector('[class*="sales-count"]');
                    const statsText = statsEl ? statsEl.textContent : '';
                    const salesMatch = statsText.match(/([\\d,]+)\\s*sale/i);

                    // Shop rating
                    const ratingEl = document.querySelector('[class*="shop-rating"]') ||
                                     document.querySelector('[class*="stars"]');
                    const ratingText = ratingEl ? ratingEl.textContent : '';
                    const ratingMatch = ratingText.match(/([\\d.]+)/);

                    // All listing cards in the shop
                    const listingCards = document.querySelectorAll('[data-listing-id]');
                    const listings = Array.from(listingCards).map(el => {
                        const priceEl = el.querySelector('[data-currency-value]');
                        const titleEl = el.querySelector('h3') || el.querySelector('[class*="title"]');
                        const reviewEl = el.querySelector('[aria-label*="star"]');
                        const reviewText = reviewEl ? reviewEl.textContent : '';
                        const reviewMatch = reviewText.match(/([\\d,]+)\\s*review/i);
                        const badgeEl = el.querySelector('[class*="bestseller"]');

                        return {
                            etsy_listing_id: el.dataset.listingId,
                            title: titleEl ? titleEl.textContent.trim() : null,
                            price_raw: priceEl ? priceEl.dataset.currencyValue : null,
                            currency: priceEl ? (priceEl.dataset.currencyCode || 'USD') : 'USD',
                            num_reviews: reviewMatch ? parseInt(reviewMatch[1].replace(',', '')) : 0,
                            is_bestseller: !!badgeEl,
                            photo_url: el.querySelector('img')?.src || null,
                        };
                    }).filter(l => l.etsy_listing_id);

                    // Shop name from header
                    const nameEl = document.querySelector('h1[class*="shop-name"]') ||
                                   document.querySelector('[class*="shop-title"] h1');

                    return {
                        shop_name: nameEl ? nameEl.textContent.trim() : null,
                        total_sales_est: salesMatch ? parseInt(salesMatch[1].replace(',', '')) : null,
                        avg_rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
                        listing_count: listingCards.length,
                        listings,
                    };
                }""")

                return data

            except Exception as exc:
                logger.error("shop_scrape_failed", shop=shop_name, error=str(exc))
                raise
            finally:
                await ctx.close()
