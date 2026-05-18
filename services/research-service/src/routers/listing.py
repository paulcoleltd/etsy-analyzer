from fastapi import APIRouter, Depends, HTTPException
from elasticsearch import AsyncElasticsearch
from redis.asyncio import Redis
from pydantic import BaseModel

from src.deps import get_es, get_redis
from src.config import settings
from src.cache.redis_cache import get_cached, set_cached

router = APIRouter(prefix="/v1/research", tags=["research"])


class ListingIntelligence(BaseModel):
    etsy_listing_id: str
    shop_id: str
    title: str | None
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


@router.get("/listing/{etsy_listing_id}", response_model=ListingIntelligence)
async def get_listing_intelligence(
    etsy_listing_id: str,
    es: AsyncElasticsearch = Depends(get_es),
    redis: Redis = Depends(get_redis),
):
    cached = await get_cached(redis, "listing", etsy_listing_id)
    if cached:
        return cached

    resp = await es.search(
        index="listings",
        query={"term": {"etsy_listing_id": etsy_listing_id}},
        size=1,
    )
    hits = resp["hits"]["hits"]
    if not hits:
        raise HTTPException(status_code=404, detail="Listing not found")

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

    await set_cached(redis, "listing", etsy_listing_id, payload, settings.cache_ttl_listing)
    return payload
