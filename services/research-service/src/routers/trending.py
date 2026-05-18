from fastapi import APIRouter, Depends, Query
from elasticsearch import AsyncElasticsearch
from redis.asyncio import Redis
from pydantic import BaseModel

from src.deps import get_es, get_redis
from src.config import settings
from src.cache.redis_cache import get_cached, set_cached

router = APIRouter(prefix="/v1/research", tags=["research"])


class TrendingItem(BaseModel):
    keyword: str
    listing_count: int
    avg_revenue: float
    avg_opportunity_score: float


@router.get("/trending", response_model=list[TrendingItem])
async def get_trending(
    limit: int = Query(default=20, ge=1, le=50),
    es: AsyncElasticsearch = Depends(get_es),
    redis: Redis = Depends(get_redis),
):
    cached = await get_cached(redis, "trending", f"trending:{limit}")
    if cached:
        return cached

    # Trending = tags with highest avg opportunity score, weighted by listing count
    resp = await es.search(
        index="listings",
        query={"bool": {"filter": [{"term": {"is_active": True}}]}},
        size=0,
        aggs={
            "tags": {
                "terms": {"field": "tags", "size": limit * 3},
                "aggs": {
                    "avg_revenue":     {"avg": {"field": "est_monthly_revenue"}},
                    "avg_opportunity": {"avg": {"field": "opportunity_score"}},
                },
            }
        },
    )

    buckets = resp["aggregations"]["tags"]["buckets"]
    items = [
        TrendingItem(
            keyword=b["key"],
            listing_count=b["doc_count"],
            avg_revenue=round((b["avg_revenue"]["value"] or 0), 2),
            avg_opportunity_score=round((b["avg_opportunity"]["value"] or 0), 1),
        )
        for b in buckets
        if len(b["key"]) > 3  # filter out very short tags
    ]

    # Sort by avg opportunity score descending
    items.sort(key=lambda x: x.avg_opportunity_score, reverse=True)
    result = [i.model_dump() for i in items[:limit]]

    await set_cached(redis, "trending", f"trending:{limit}", result, settings.cache_ttl_trending)
    return result
