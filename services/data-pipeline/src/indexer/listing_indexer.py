"""
Writes normalised ListingRecords to both PostgreSQL and Elasticsearch.
Uses upsert semantics on etsy_listing_id.
"""
from __future__ import annotations

import asyncio
from typing import Any

import asyncpg
from elasticsearch import helpers as es_helpers

from src.config import settings
from src.indexer.es_client import get_es_client
from src.indexer.mappings import LISTINGS_INDEX
from src.normaliser.listing_normaliser import ListingRecord
from src.logger import logger

_pg_pool: asyncpg.Pool | None = None


async def get_pg_pool() -> asyncpg.Pool:
    global _pg_pool
    if _pg_pool is None:
        _pg_pool = await asyncpg.create_pool(settings.database_url, min_size=2, max_size=10)
    return _pg_pool


# ── PostgreSQL upsert ─────────────────────────────────────────────

_UPSERT_SQL = """
INSERT INTO listings (
    etsy_listing_id, shop_id, title, description, tags, price, currency,
    price_usd, category_path, category_l1, photo_count, has_video,
    shipping_free, is_bestseller, num_reviews, avg_rating, listing_age_days,
    est_monthly_revenue, est_monthly_units, revenue_confidence,
    opportunity_score, listing_grade, last_scraped, is_active
) VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
    $13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24
)
ON CONFLICT (etsy_listing_id) DO UPDATE SET
    title               = EXCLUDED.title,
    description         = EXCLUDED.description,
    tags                = EXCLUDED.tags,
    price               = EXCLUDED.price,
    price_usd           = EXCLUDED.price_usd,
    photo_count         = EXCLUDED.photo_count,
    has_video           = EXCLUDED.has_video,
    shipping_free       = EXCLUDED.shipping_free,
    is_bestseller       = EXCLUDED.is_bestseller,
    num_reviews         = EXCLUDED.num_reviews,
    avg_rating          = EXCLUDED.avg_rating,
    listing_age_days    = EXCLUDED.listing_age_days,
    est_monthly_revenue = EXCLUDED.est_monthly_revenue,
    est_monthly_units   = EXCLUDED.est_monthly_units,
    revenue_confidence  = EXCLUDED.revenue_confidence,
    opportunity_score   = EXCLUDED.opportunity_score,
    listing_grade       = EXCLUDED.listing_grade,
    last_scraped        = EXCLUDED.last_scraped,
    updated_at          = now()
"""


async def upsert_listing_pg(pool: asyncpg.Pool, r: ListingRecord) -> None:
    await pool.execute(
        _UPSERT_SQL,
        r.etsy_listing_id, r.shop_id, r.title, r.description,
        r.tags, r.price, r.currency, r.price_usd,
        r.category_path, r.category_l1, r.photo_count, r.has_video,
        r.shipping_free, r.is_bestseller, r.num_reviews, r.avg_rating,
        r.listing_age_days, r.est_monthly_revenue, r.est_monthly_units,
        r.revenue_confidence, r.opportunity_score, r.listing_grade,
        r.last_scraped, True,
    )


# ── Elasticsearch bulk index ──────────────────────────────────────

def _to_es_action(r: ListingRecord) -> dict[str, Any]:
    return {
        "_index": LISTINGS_INDEX,
        "_id": r.etsy_listing_id,
        "_source": r.to_es_doc(),
    }


async def bulk_index_es(records: list[ListingRecord]) -> None:
    if not records:
        return
    es = get_es_client()
    actions = [_to_es_action(r) for r in records]
    successes, errors = await es_helpers.async_bulk(
        es, actions, raise_on_error=False, chunk_size=100
    )
    if errors:
        logger.warning("es_bulk_errors", count=len(errors))
    logger.info("es_bulk_indexed", count=successes)


# ── Combined pipeline ─────────────────────────────────────────────

async def ingest_listings(records: list[ListingRecord]) -> None:
    """Write a batch of records to both PostgreSQL and Elasticsearch."""
    pool = await get_pg_pool()

    pg_tasks = [upsert_listing_pg(pool, r) for r in records]
    await asyncio.gather(*pg_tasks, return_exceptions=True)
    logger.info("pg_upserted", count=len(records))

    await bulk_index_es(records)
