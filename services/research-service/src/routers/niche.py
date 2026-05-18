from fastapi import APIRouter, Depends, HTTPException
from elasticsearch import AsyncElasticsearch
from redis.asyncio import Redis
from pydantic import BaseModel

from src.deps import get_es, get_redis
from src.config import settings
from src.cache.redis_cache import get_cached, set_cached
from src.ml.niche_scorer import calculate_niche_score

router = APIRouter(prefix="/v1/research", tags=["research"])


class NicheResponse(BaseModel):
    keyword: str
    niche_score: float
    rating: str
    components: dict
    top_shops: list[dict]
    price_range: dict
    total_listings: int


@router.get("/niche/{keyword}", response_model=NicheResponse)
async def get_niche_score(
    keyword: str,
    es: AsyncElasticsearch = Depends(get_es),
    redis: Redis = Depends(get_redis),
):
    cached = await get_cached(redis, "niche", keyword)
    if cached:
        return cached

    # Aggregate data for the keyword from ES
    resp = await es.search(
        index="listings",
        query={
            "bool": {
                "must": {
                    "multi_match": {
                        "query": keyword,
                        "fields": ["title^3", "tags^2"],
                        "fuzziness": "AUTO",
                    }
                },
                "filter": [{"term": {"is_active": True}}],
            }
        },
        size=0,
        aggs={
            "avg_reviews": {"avg": {"field": "num_reviews"}},
            "min_price":   {"min": {"field": "price_usd"}},
            "max_price":   {"max": {"field": "price_usd"}},
            "avg_price":   {"avg": {"field": "price_usd"}},
            "top_shops": {
                "terms": {"field": "shop_id", "size": 5},
                "aggs": {"est_revenue": {"sum": {"field": "est_monthly_revenue"}}},
            },
        },
    )

    total = resp["hits"]["total"]["value"]
    aggs = resp.get("aggregations", {})
    avg_reviews = (aggs.get("avg_reviews") or {}).get("value") or 1.0

    # Volume estimate: use total competing listing count as proxy
    volume_est = max(10, total * 3)  # rough: ~3 searches per competing listing

    score_data = calculate_niche_score({
        "volume_est": volume_est,
        "competing_count": max(1, total),
        "avg_reviews": avg_reviews,
        "trend_direction": "stable",
    })

    top_shops = [
        {
            "shop_id": b["key"],
            "listing_count": b["doc_count"],
            "est_revenue": round(b["est_revenue"]["value"] or 0, 2),
        }
        for b in (aggs.get("top_shops") or {}).get("buckets", [])
    ]

    price_range = {
        "min": round((aggs.get("min_price") or {}).get("value") or 0, 2),
        "max": round((aggs.get("max_price") or {}).get("value") or 0, 2),
        "avg": round((aggs.get("avg_price") or {}).get("value") or 0, 2),
    }

    payload = NicheResponse(
        keyword=keyword,
        niche_score=score_data["score"],
        rating=score_data["rating"],
        components=score_data["components"],
        top_shops=top_shops,
        price_range=price_range,
        total_listings=total,
    ).model_dump()

    await set_cached(redis, "niche", keyword, payload, settings.cache_ttl_niche)
    return payload
