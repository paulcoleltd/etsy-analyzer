from fastapi import APIRouter, Depends, HTTPException
from elasticsearch import AsyncElasticsearch
from redis.asyncio import Redis
from pydantic import BaseModel

from src.deps import get_es, get_redis
from src.config import settings
from src.cache.redis_cache import get_cached, set_cached
from src import db_fallback

router = APIRouter(prefix="/v1/research", tags=["research"])


class ListingIntelligence(BaseModel):
    etsy_listing_id: str
    shop_id: str
    title: str | None
    description: str | None = None
    tags: list[str]
    price_usd: float | None
    num_reviews: int
    avg_rating: float | None
    est_monthly_revenue: float | None
    est_monthly_units: int | None
    revenue_confidence: str | None
    opportunity_score: float | None
    listing_grade: str | None
    photo_count: int
    has_video: bool
    shipping_free: bool
    is_bestseller: bool
    category_l1: str | None
    listing_age_days: int | None
    last_scraped: str | None


async def _pg_listing(listing_id: str) -> dict | None:
    """Fetch a listing directly from PostgreSQL."""
    pool = await db_fallback.get_pg_pool()
    row = await pool.fetchrow(
        """SELECT etsy_listing_id, shop_id, title, description, tags, price_usd,
                  num_reviews, avg_rating, est_monthly_revenue, est_monthly_units,
                  revenue_confidence, opportunity_score, listing_grade,
                  photo_count, has_video, shipping_free, is_bestseller,
                  category_l1, listing_age_days, last_scraped
           FROM listings WHERE etsy_listing_id = $1""",
        listing_id,
    )
    if not row:
        return None
    return {
        "etsy_listing_id": row["etsy_listing_id"],
        "shop_id": row["shop_id"] or "",
        "title": row["title"],
        "description": row["description"],
        "tags": list(row["tags"]) if row["tags"] else [],
        "price_usd": float(row["price_usd"]) if row["price_usd"] else None,
        "num_reviews": row["num_reviews"] or 0,
        "avg_rating": float(row["avg_rating"]) if row["avg_rating"] else None,
        "est_monthly_revenue": float(row["est_monthly_revenue"]) if row["est_monthly_revenue"] else None,
        "est_monthly_units": row["est_monthly_units"],
        "revenue_confidence": row["revenue_confidence"],
        "opportunity_score": float(row["opportunity_score"]) if row["opportunity_score"] else None,
        "listing_grade": row["listing_grade"],
        "photo_count": row["photo_count"] or 0,
        "has_video": bool(row["has_video"]),
        "shipping_free": bool(row["shipping_free"]),
        "is_bestseller": bool(row["is_bestseller"]),
        "category_l1": row["category_l1"],
        "listing_age_days": row["listing_age_days"],
        "last_scraped": row["last_scraped"].isoformat() if row["last_scraped"] else None,
    }


@router.get("/listing/{etsy_listing_id}", response_model=ListingIntelligence)
async def get_listing_intelligence(
    etsy_listing_id: str,
    es: AsyncElasticsearch = Depends(get_es),
    redis: Redis = Depends(get_redis),
):
    # Redis cache
    try:
        cached = await get_cached(redis, "listing", etsy_listing_id)
        if cached:
            return cached
    except Exception:
        pass

    # Try Elasticsearch
    try:
        resp = await es.search(
            index="listings",
            query={"term": {"etsy_listing_id": etsy_listing_id}},
            size=1,
        )
        hits = resp["hits"]["hits"]
        if hits:
            src = hits[0]["_source"]
            payload = ListingIntelligence(
                etsy_listing_id=src.get("etsy_listing_id", etsy_listing_id),
                shop_id=src.get("shop_id", ""),
                title=src.get("title"),
                tags=src.get("tags") or [],
                price_usd=src.get("price_usd"),
                num_reviews=src.get("num_reviews") or 0,
                avg_rating=src.get("avg_rating"),
                est_monthly_revenue=src.get("est_monthly_revenue"),
                est_monthly_units=src.get("est_monthly_units"),
                revenue_confidence=src.get("revenue_confidence"),
                opportunity_score=src.get("opportunity_score"),
                listing_grade=src.get("listing_grade"),
                photo_count=src.get("photo_count") or 0,
                has_video=bool(src.get("has_video")),
                shipping_free=bool(src.get("shipping_free")),
                is_bestseller=bool(src.get("is_bestseller")),
                category_l1=src.get("category_l1"),
                listing_age_days=src.get("listing_age_days"),
                last_scraped=src.get("last_scraped"),
            ).model_dump()
            try:
                await set_cached(redis, "listing", etsy_listing_id, payload, settings.cache_ttl_listing)
            except Exception:
                pass
            return payload
    except Exception:
        pass

    # PostgreSQL fallback
    pg_row = await _pg_listing(etsy_listing_id)
    if pg_row:
        try:
            await set_cached(redis, "listing", etsy_listing_id, pg_row, settings.cache_ttl_listing)
        except Exception:
            pass
        return pg_row

    raise HTTPException(status_code=404, detail="Listing not found")
