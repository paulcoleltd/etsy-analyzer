"""
Writes listing_metrics, shop_metrics to TimescaleDB hypertables.
Uses asyncpg for efficient bulk insertion.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import asyncpg
from src.config import settings
from src.logger import logger

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(settings.database_url, min_size=2, max_size=10)
    return _pool


async def write_listing_metrics(records: list[dict[str, Any]]) -> None:
    """
    Each record: { listing_id, views, favourites, num_reviews, est_revenue, rank_position }
    """
    if not records:
        return
    pool = await get_pool()
    now = datetime.now(timezone.utc)
    rows = [
        (
            str(r["listing_id"]),
            now,
            int(r.get("views") or 0),
            int(r.get("favourites") or 0),
            int(r.get("num_reviews") or 0),
            float(r.get("est_revenue") or 0),
            r.get("rank_position"),
        )
        for r in records
    ]
    await pool.executemany(
        """INSERT INTO listing_metrics
           (listing_id, recorded_at, views, favourites, num_reviews, est_revenue, rank_position)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT DO NOTHING""",
        rows,
    )
    logger.info("listing_metrics_written", count=len(rows))


async def write_shop_metrics(etsy_shop_id: str, est_revenue: float, listing_count: int, avg_reviews: float) -> None:
    pool = await get_pool()
    await pool.execute(
        """INSERT INTO shop_metrics (etsy_shop_id, recorded_at, est_revenue, listing_count, avg_reviews)
           VALUES ($1,$2,$3,$4,$5)""",
        etsy_shop_id,
        datetime.now(timezone.utc),
        est_revenue,
        listing_count,
        avg_reviews,
    )


async def query_revenue_series(
    etsy_shop_id: str,
    from_dt: datetime,
    to_dt: datetime,
    granularity: str = "day",
) -> list[dict[str, Any]]:
    """Query revenue time-series from continuous aggregate or raw hypertable."""
    pool = await get_pool()

    bucket = "1 day" if granularity == "day" else "7 days" if granularity == "week" else "1 month"

    rows = await pool.fetch(
        f"""
        SELECT
            time_bucket('{bucket}', recorded_at) AS period,
            SUM(est_revenue)    AS revenue,
            AVG(num_reviews)    AS avg_reviews,
            COUNT(DISTINCT listing_id) AS listing_count
        FROM listing_metrics
        WHERE listing_id IN (
            SELECT etsy_listing_id FROM listings WHERE shop_id = $1
        )
        AND recorded_at BETWEEN $2 AND $3
        GROUP BY 1
        ORDER BY 1
        """,
        etsy_shop_id, from_dt, to_dt,
    )
    return [
        {
            "date": row["period"].isoformat(),
            "revenue": float(row["revenue"] or 0),
            "avg_reviews": float(row["avg_reviews"] or 0),
            "listing_count": int(row["listing_count"] or 0),
        }
        for row in rows
    ]


async def query_listing_performance(
    etsy_shop_id: str,
    sort_by: str = "revenue",
    direction: str = "desc",
    limit: int = 25,
    offset: int = 0,
) -> tuple[list[dict[str, Any]], int]:
    """Returns paginated listing performance from PostgreSQL listings table."""
    pool = await get_pool()
    valid_sorts = {"revenue": "est_monthly_revenue", "views": "views_30d",
                   "reviews": "num_reviews", "grade": "listing_grade",
                   "opportunity": "opportunity_score"}
    sort_col = valid_sorts.get(sort_by, "est_monthly_revenue")
    dir_clause = "DESC NULLS LAST" if direction == "desc" else "ASC NULLS LAST"

    rows = await pool.fetch(
        f"""
        SELECT etsy_listing_id, title, listing_grade, est_monthly_revenue,
               est_monthly_units, revenue_confidence, views_30d, num_reviews,
               avg_rating, tags, price_usd, photo_count, is_bestseller,
               opportunity_score, updated_at
        FROM listings
        WHERE shop_id = $1 AND is_active = true
        ORDER BY {sort_col} {dir_clause}
        LIMIT $2 OFFSET $3
        """,
        etsy_shop_id, limit, offset,
    )
    count_row = await pool.fetchrow(
        "SELECT COUNT(*) FROM listings WHERE shop_id=$1 AND is_active=true",
        etsy_shop_id,
    )
    total = int(count_row["count"]) if count_row else 0
    return [dict(r) for r in rows], total
