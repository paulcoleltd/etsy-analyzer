import asyncio
import re
from typing import Any
from tenacity import retry, stop_after_attempt, wait_exponential
from src.scrapers.base import BaseScraper
from src.logger import logger


class EtsySearchScraper(BaseScraper):
    """Scrapes Etsy search results pages for listing cards."""

    BASE_URL = "https://www.etsy.com/search"

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=4, max=30))
    async def scrape(self, keyword: str, max_pages: int = 2) -> list[dict[str, Any]]:
        async with self:
            ctx = await self._new_context()
            page = await ctx.new_page()
            results: list[dict[str, Any]] = []

            try:
                for page_num in range(1, max_pages + 1):
                    url = f"{self.BASE_URL}?q={keyword.replace(' ', '+')}&page={page_num}"
                    logger.info("scraping_search", keyword=keyword, page=page_num)

                    await self._anti_detect_delay()
                    await page.goto(url, wait_until="domcontentloaded", timeout=30_000)
                    await self._human_scroll(page, scrolls=4)

                    # Wait for listing cards to render
                    await page.wait_for_selector("[data-listing-id]", timeout=15_000)

                    cards = await page.evaluate("""() => {
                        const cards = document.querySelectorAll('[data-listing-id]');
                        return Array.from(cards).map(el => {
                            const priceEl = el.querySelector('[data-currency-value]');
                            const reviewEl = el.querySelector('[aria-label*="star rating"]') ||
                                             el.querySelector('[class*="review"]');
                            const titleEl = el.querySelector('h3') || el.querySelector('[class*="title"]');
                            const shopEl  = el.querySelector('[class*="shop-name"]') ||
                                            el.querySelector('[data-shop-name]');
                            const badgeEl = el.querySelector('[class*="bestseller"]');

                            const reviewText = reviewEl ? reviewEl.textContent : '';
                            const reviewMatch = reviewText.match(/([\\d,]+)\\s*review/i);
                            const ratingMatch = reviewText.match(/([\\d.]+)\\s*out of 5/i) ||
                                                reviewText.match(/([\\d.]+)\\s*star/i);

                            return {
                                etsy_listing_id: el.dataset.listingId || null,
                                title: titleEl ? titleEl.textContent.trim() : null,
                                price_raw: priceEl ? priceEl.dataset.currencyValue : null,
                                currency: priceEl ? (priceEl.dataset.currencyCode || 'USD') : 'USD',
                                num_reviews: reviewMatch ? parseInt(reviewMatch[1].replace(',', '')) : 0,
                                avg_rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
                                shop_name: shopEl ? shopEl.textContent.trim() : null,
                                is_bestseller: !!badgeEl,
                                photo_url: el.querySelector('img')?.src || null,
                            };
                        }).filter(c => c.etsy_listing_id);
                    }""")

                    results.extend(cards)
                    logger.info("search_page_done", keyword=keyword, page=page_num, found=len(cards))

                    if len(cards) < 10:
                        break  # Last page reached

            except Exception as exc:
                logger.error("search_scrape_failed", keyword=keyword, error=str(exc))
                raise
            finally:
                await ctx.close()

            return results
