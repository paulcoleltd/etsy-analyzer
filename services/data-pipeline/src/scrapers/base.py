import asyncio
import random
from typing import Any
from playwright.async_api import async_playwright, Browser, BrowserContext, Page
from src.config import settings
from src.logger import logger


DESKTOP_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
]


class BaseScraper:
    def __init__(self, use_proxy: bool = True):
        self._use_proxy = use_proxy and bool(settings.brightdata_username)
        self._request_count = 0
        self._browser: Browser | None = None
        self._playwright = None

    def _proxy_config(self) -> dict[str, str] | None:
        if not self._use_proxy:
            return None
        return {
            "server": f"http://{settings.brightdata_host}:{settings.brightdata_port}",
            "username": settings.brightdata_username,
            "password": settings.brightdata_password,
        }

    async def _new_context(self) -> BrowserContext:
        assert self._browser is not None
        ctx = await self._browser.new_context(
            user_agent=random.choice(DESKTOP_AGENTS),
            viewport={"width": 1280, "height": 800},
            locale="en-US",
            timezone_id="America/New_York",
            proxy=self._proxy_config(),
        )
        # Block images/fonts to reduce bandwidth
        await ctx.route(
            "**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf}",
            lambda r: r.abort(),
        )
        return ctx

    async def _anti_detect_delay(self) -> None:
        delay = random.uniform(settings.min_delay_seconds, settings.max_delay_seconds)
        await asyncio.sleep(delay)

    async def _human_scroll(self, page: Page, scrolls: int = 3) -> None:
        for _ in range(scrolls):
            await page.evaluate("window.scrollBy(0, window.innerHeight * 0.7)")
            await asyncio.sleep(random.uniform(0.4, 0.9))

    async def __aenter__(self):
        self._playwright = await async_playwright().start()
        self._browser = await self._playwright.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
        )
        return self

    async def __aexit__(self, *_):
        if self._browser:
            await self._browser.close()
        if self._playwright:
            await self._playwright.stop()
