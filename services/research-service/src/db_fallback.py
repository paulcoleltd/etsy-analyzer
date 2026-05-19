"""
PostgreSQL fallback for search & trending when Elasticsearch is unavailable.

Uses the listings table directly with ILIKE full-text search and
the opportunity_score column for sorting.
"""
from __future__ import annotations

import asyncpg
from typing import Any

from src.config import settings

_pool: asyncpg.Pool | None = None


async def get_pg_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            settings.database_url,
            min_size=2,
            max_size=8,
            command_timeout=10,
        )
    return _pool


SORT_COLS = {
    "opportunity_score":    "opportunity_score",
    "est_monthly_revenue":  "est_monthly_revenue",
    "num_reviews":          "num_reviews",
    "price_usd":            "price_usd",
    "_score":               "opportunity_score",
}


async def pg_search(
    q: str,
    limit: int = 20,
    sort: str = "opportunity_score",
    category: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    min_reviews: int | None = None,
    min_score: float | None = None,
) -> dict[str, Any]:
    pool = await get_pg_pool()
    sort_col = SORT_COLS.get(sort, "opportunity_score")

    # Match title via ILIKE or any tag via ILIKE (unnest + ILIKE)
    conditions = [
        "is_active = TRUE",
        "(title ILIKE $1 OR EXISTS ("
        "  SELECT 1 FROM UNNEST(tags) _t WHERE _t ILIKE $1"
        "))",
    ]
    params: list[Any] = [f"%{q}%"]

    idx = 2
    if category:
        conditions.append(f"category_l1 ILIKE ${idx}")
        params.append(f"%{category}%")
        idx += 1
    if min_price is not None:
        conditions.append(f"price_usd >= ${idx}")
        params.append(min_price)
        idx += 1
    if max_price is not None:
        conditions.append(f"price_usd <= ${idx}")
        params.append(max_price)
        idx += 1
    if min_reviews is not None:
        conditions.append(f"num_reviews >= ${idx}")
        params.append(min_reviews)
        idx += 1
    if min_score is not None:
        conditions.append(f"opportunity_score >= ${idx}")
        params.append(min_score)
        idx += 1

    where = " AND ".join(conditions)

    rows = await pool.fetch(
        f"""SELECT etsy_listing_id, shop_id, title, price_usd, num_reviews,
                   avg_rating, est_monthly_revenue, est_monthly_units,
                   revenue_confidence, opportunity_score, listing_grade,
                   is_bestseller, category_l1, tags
            FROM listings
            WHERE {where}
            ORDER BY {sort_col} DESC NULLS LAST
            LIMIT {limit}""",
        *params,
    )

    count_row = await pool.fetchrow(
        f"SELECT COUNT(*) AS n FROM listings WHERE {where}", *params
    )
    total = int(count_row["n"]) if count_row else len(rows)

    results = []
    for r in rows:
        results.append({
            "etsy_listing_id": r["etsy_listing_id"],
            "shop_id": r["shop_id"] or "",
            "title": r["title"],
            "price_usd": float(r["price_usd"]) if r["price_usd"] else None,
            "num_reviews": r["num_reviews"] or 0,
            "avg_rating": float(r["avg_rating"]) if r["avg_rating"] else None,
            "est_monthly_revenue": float(r["est_monthly_revenue"]) if r["est_monthly_revenue"] else None,
            "est_monthly_units": r["est_monthly_units"],
            "revenue_confidence": r["revenue_confidence"],
            "opportunity_score": float(r["opportunity_score"]) if r["opportunity_score"] else None,
            "listing_grade": r["listing_grade"],
            "is_bestseller": bool(r["is_bestseller"]),
            "category_l1": r["category_l1"],
            "tags": list(r["tags"]) if r["tags"] else [],
        })

    return {"keyword": q, "total": total, "results": results}


async def pg_trending(limit: int = 20) -> list[dict[str, Any]]:
    pool = await get_pg_pool()

    rows = await pool.fetch(
        """SELECT UNNEST(tags) AS kw,
                  COUNT(*) AS listing_count,
                  AVG(est_monthly_revenue) AS avg_revenue,
                  AVG(opportunity_score) AS avg_opportunity_score
           FROM listings
           WHERE is_active = TRUE AND array_length(tags, 1) > 0
           GROUP BY kw
           ORDER BY avg_opportunity_score DESC NULLS LAST, listing_count DESC
           LIMIT $1""",
        limit * 3,
    )

    seen: set[str] = set()
    result = []
    for r in rows:
        kw = r["kw"]
        if not kw or kw in seen:
            continue
        seen.add(kw)
        result.append({
            "keyword": kw,
            "listing_count": r["listing_count"],
            "avg_revenue": float(r["avg_revenue"]) if r["avg_revenue"] else 0.0,
            "avg_opportunity_score": float(r["avg_opportunity_score"]) if r["avg_opportunity_score"] else 0.0,
        })
        if len(result) >= limit:
            break

    # Fallback when no listings are indexed yet
    if not result:
        result = [
            {"keyword": kw, "listing_count": 0, "avg_revenue": 0.0, "avg_opportunity_score": 0.0}
            for kw in [
                "personalised gifts", "handmade jewellery", "wall art prints",
                "birthday card", "wedding gifts", "custom portrait",
                "digital download", "home decor", "baby shower gift", "vintage poster",
            ][:limit]
        ]

    return result
