"""
Syncs Etsy API data for a connected user into PostgreSQL + TimescaleDB.
Called on first login and every 2 hours via BullMQ.
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any

import asyncpg

from src.config import settings
from src.etsy.api_client import EtsyClient, build_client_for_user
from src.db.timescale_writer import write_listing_metrics, write_shop_metrics, get_pool
from src.logger import logger

# ── Revenue estimation from transaction data ──────────────────────

def _estimate_revenue_30d(transactions: list[dict]) -> dict[str, float]:
    """Aggregate last-30-day transactions by listing_id → revenue + units."""
    from datetime import timedelta
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    by_listing: dict[str, dict[str, float]] = {}

    for tx in transactions:
        paid_at_ts = tx.get("paid_timestamp") or tx.get("create_timestamp") or 0
        paid_at = datetime.fromtimestamp(paid_at_ts, tz=timezone.utc)
        if paid_at < cutoff:
            continue
        listing_id = str(tx.get("listing_id") or "")
        if not listing_id:
            continue
        price = float(tx.get("price", {}).get("amount", 0)) / max(1, int(tx.get("price", {}).get("divisor", 100)))
        by_listing.setdefault(listing_id, {"revenue": 0.0, "units": 0})
        by_listing[listing_id]["revenue"] += price
        by_listing[listing_id]["units"] += int(tx.get("quantity") or 1)

    return by_listing


# ── Upsert listings into PostgreSQL ──────────────────────────────

_LISTING_UPSERT = """
INSERT INTO listings (
    etsy_listing_id, shop_id, title, tags, price, currency, price_usd,
    photo_count, has_video, is_active, num_reviews, avg_rating,
    views_30d, est_monthly_revenue, est_monthly_units, updated_at
)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,now())
ON CONFLICT (etsy_listing_id) DO UPDATE SET
    title               = EXCLUDED.title,
    tags                = EXCLUDED.tags,
    price               = EXCLUDED.price,
    photo_count         = EXCLUDED.photo_count,
    is_active           = EXCLUDED.is_active,
    num_reviews         = EXCLUDED.num_reviews,
    avg_rating          = EXCLUDED.avg_rating,
    views_30d           = EXCLUDED.views_30d,
    est_monthly_revenue = EXCLUDED.est_monthly_revenue,
    est_monthly_units   = EXCLUDED.est_monthly_units,
    updated_at          = now()
"""


async def sync_user_data(user_id: str) -> dict[str, Any]:
    client = await build_client_for_user(user_id)
    if not client:
        return {"status": "error", "reason": "no_etsy_connection"}

    logger.info("etsy_sync_start", user_id=user_id, shop_id=client.shop_id)
    pool = await get_pool()

    # 1. Fetch transactions (last 100)
    try:
        tx_data = await client.get_transactions(limit=100, offset=0)
        transactions: list[dict] = tx_data.get("results") or []
    except Exception as exc:
        logger.error("etsy_transactions_failed", error=str(exc))
        transactions = []

    revenue_by_listing = _estimate_revenue_30d(transactions)

    # 2. Fetch active listings
    listings_upserted = 0
    offset = 0
    while True:
        try:
            data = await client.get_listings(state="active", limit=100, offset=offset)
        except Exception as exc:
            logger.error("etsy_listings_failed", offset=offset, error=str(exc))
            break

        results = data.get("results") or []
        if not results:
            break

        listing_metrics_batch: list[dict] = []

        for listing in results:
            lid = str(listing.get("listing_id") or "")
            if not lid:
                continue

            tags = [t.get("name", "") for t in (listing.get("tags") or [])]
            images = listing.get("images") or []
            photo_count = len(images)
            has_video = bool(listing.get("videos"))

            price_val = listing.get("price", {})
            price = float(price_val.get("amount", 0)) / max(1, int(price_val.get("divisor", 100)))

            rev_data = revenue_by_listing.get(lid, {})
            est_revenue = rev_data.get("revenue", 0.0)
            est_units = int(rev_data.get("units", 0))

            await pool.execute(
                _LISTING_UPSERT,
                lid, client.shop_id,
                listing.get("title"),
                tags, price, "USD", price,
                photo_count, has_video, True,
                int(listing.get("num_favorers") or 0),
                None,  # avg_rating not in listing endpoint
                None,  # views_30d requires stats endpoint
                est_revenue if est_revenue else None,
                est_units if est_units else None,
            )
            listings_upserted += 1

            listing_metrics_batch.append({
                "listing_id": lid,
                "views": None,
                "favourites": int(listing.get("num_favorers") or 0),
                "num_reviews": 0,
                "est_revenue": est_revenue,
            })

        # Write TimescaleDB metrics for this batch
        await write_listing_metrics(listing_metrics_batch)

        offset += len(results)
        if len(results) < 100:
            break
        await asyncio.sleep(0.3)  # respect Etsy rate limits

    # 3. Update shop metrics
    total_revenue = sum(v.get("revenue", 0) for v in revenue_by_listing.values())
    await write_shop_metrics(client.shop_id, total_revenue, listings_upserted, 0.0)

    # 4. Mark last sync time
    await pool.execute(
        "UPDATE shops SET last_synced = now() WHERE etsy_shop_id = $1",
        client.shop_id,
    )

    logger.info("etsy_sync_done", user_id=user_id, listings=listings_upserted,
                revenue_30d=total_revenue)
    return {
        "status": "ok",
        "shop_id": client.shop_id,
        "listings_synced": listings_upserted,
        "est_revenue_30d": total_revenue,
    }
