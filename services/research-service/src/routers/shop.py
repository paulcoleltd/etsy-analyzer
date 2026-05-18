from fastapi import APIRouter, Depends, HTTPException
from elasticsearch import AsyncElasticsearch
from redis.asyncio import Redis
from pydantic import BaseModel

from src.deps import get_es, get_redis
from src.config import settings
from src.cache.redis_cache import get_cached, set_cached

router = APIRouter(prefix="/v1/research", tags=["research"])


class ShopIntelligence(BaseModel):
    etsy_shop_id: str
    listing_count: int
    est_monthly_revenue: float
    avg_price_usd: float
    avg_reviews: float
    top_listings: list[dict]
    category_breakdown: list[dict]


@router.get("/shop/{etsy_shop_id}", response_model=ShopIntelligence)
async def get_shop_intelligence(
    etsy_shop_id: str,
    es: AsyncElasticsearch = Depends(get_es),
    redis: Redis = Depends(get_redis),
):
    cached = await get_cached(redis, "shop", etsy_shop_id)
    if cached:
        return cached

    resp = await es.search(
        index="listings",
        query={"bool": {"filter": [
            {"term": {"shop_id": etsy_shop_id}},
            {"term": {"is_active": True}},
        ]}},
        size=0,
        aggs={
            "total_revenue":   {"sum": {"field": "est_monthly_revenue"}},
            "avg_price":       {"avg": {"field": "price_usd"}},
            "avg_reviews":     {"avg": {"field": "num_reviews"}},
            "top_listings": {
                "top_hits": {
                    "size": 5,
                    "sort": [{"est_monthly_revenue": {"order": "desc"}}],
                    "_source": ["etsy_listing_id", "title", "est_monthly_revenue",
                                "num_reviews", "listing_grade"],
                }
            },
            "categories": {
                "terms": {"field": "category_l1", "size": 5},
            },
        },
    )

    total = resp["hits"]["total"]["value"]
    if total == 0:
        raise HTTPException(status_code=404, detail="Shop not found in index")

    aggs = resp["aggregations"]
    top_hits = [h["_source"] for h in aggs["top_listings"]["hits"]["hits"]]
    categories = [
        {"category": b["key"], "listing_count": b["doc_count"]}
        for b in aggs["categories"]["buckets"]
    ]

    payload = ShopIntelligence(
        etsy_shop_id=etsy_shop_id,
        listing_count=total,
        est_monthly_revenue=round((aggs["total_revenue"]["value"] or 0), 2),
        avg_price_usd=round((aggs["avg_price"]["value"] or 0), 2),
        avg_reviews=round((aggs["avg_reviews"]["value"] or 0), 1),
        top_listings=top_hits,
        category_breakdown=categories,
    ).model_dump()

    await set_cached(redis, "shop", etsy_shop_id, payload, settings.cache_ttl_niche)
    return payload
