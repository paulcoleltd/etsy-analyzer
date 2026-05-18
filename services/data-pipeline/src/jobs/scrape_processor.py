"""
BullMQ scrape job processor.

Job names handled:
  scrape.search  → { keyword }
  scrape.listing → { etsy_listing_id }
  scrape.shop    → { etsy_shop_id, shop_name }
  scrape.category→ { category, keywords: [str] }
"""
from __future__ import annotations

import asyncio
from typing import Any

from src.scrapers import EtsySearchScraper, ListingDetailScraper, ShopScraper
from src.normaliser import normalise_listing
from src.ml import get_estimator, calculate_opportunity_score
from src.indexer import ingest_listings
from src.logger import logger


async def process_scrape_job(job_name: str, data: dict[str, Any]) -> dict[str, Any]:
    logger.info("scrape_job_start", job=job_name, data=data)

    if job_name == "scrape.search":
        return await _handle_search(data)
    if job_name == "scrape.listing":
        return await _handle_listing(data)
    if job_name == "scrape.shop":
        return await _handle_shop(data)
    if job_name == "scrape.category":
        return await _handle_category(data)

    raise ValueError(f"Unknown job name: {job_name}")


async def _handle_search(data: dict[str, Any]) -> dict[str, Any]:
    keyword = data["keyword"]
    async with EtsySearchScraper() as scraper:
        raw_cards = await scraper.scrape(keyword, max_pages=2)

    estimator = get_estimator()
    records = []
    for raw in raw_cards:
        if not raw.get("etsy_listing_id"):
            continue
        record = normalise_listing(raw, shop_id=raw.get("shop_name") or "unknown")
        result = estimator.predict(record.to_db_dict())
        record.est_monthly_revenue = result["est_monthly_revenue_usd"]
        record.est_monthly_units   = result["est_monthly_units"]
        record.revenue_confidence  = result["confidence"]
        record.opportunity_score   = calculate_opportunity_score(record.to_db_dict())
        records.append(record)

    await ingest_listings(records)
    logger.info("search_job_done", keyword=keyword, indexed=len(records))
    return {"indexed": len(records)}


async def _handle_listing(data: dict[str, Any]) -> dict[str, Any]:
    listing_id = data["etsy_listing_id"]
    async with ListingDetailScraper() as scraper:
        raw = await scraper.scrape(listing_id)

    if not raw:
        return {"status": "not_found"}

    estimator = get_estimator()
    record = normalise_listing(raw, shop_id=data.get("shop_id") or "unknown")
    result = estimator.predict(record.to_db_dict())
    record.est_monthly_revenue = result["est_monthly_revenue_usd"]
    record.est_monthly_units   = result["est_monthly_units"]
    record.revenue_confidence  = result["confidence"]
    record.opportunity_score   = calculate_opportunity_score(record.to_db_dict())

    await ingest_listings([record])
    return {"status": "ok", "listing_id": listing_id}


async def _handle_shop(data: dict[str, Any]) -> dict[str, Any]:
    shop_name = data.get("shop_name") or data.get("etsy_shop_id")
    async with ShopScraper() as scraper:
        shop_data = await scraper.scrape(shop_name)

    if not shop_data:
        return {"status": "not_found"}

    estimator = get_estimator()
    records = []
    for raw in shop_data.get("listings", []):
        if not raw.get("etsy_listing_id"):
            continue
        record = normalise_listing(raw, shop_id=data.get("etsy_shop_id") or shop_name)
        result = estimator.predict(record.to_db_dict())
        record.est_monthly_revenue = result["est_monthly_revenue_usd"]
        record.est_monthly_units   = result["est_monthly_units"]
        record.revenue_confidence  = result["confidence"]
        record.opportunity_score   = calculate_opportunity_score(record.to_db_dict())
        records.append(record)

    await ingest_listings(records)
    return {"status": "ok", "shop": shop_name, "indexed": len(records)}


async def _handle_category(data: dict[str, Any]) -> dict[str, Any]:
    keywords: list[str] = data.get("keywords") or [data.get("category", "")]
    total = 0
    for kw in keywords[:10]:
        result = await _handle_search({"keyword": kw})
        total += result.get("indexed", 0)
    return {"status": "ok", "total_indexed": total}
