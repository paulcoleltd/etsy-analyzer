from fastapi import APIRouter, Depends, HTTPException
from elasticsearch import AsyncElasticsearch
from redis.asyncio import Redis
from pydantic import BaseModel

from src.deps import get_es, get_redis
from src.config import settings
from src.cache.redis_cache import get_cached, set_cached
from src.ml.niche_scorer import calculate_niche_score
from src import db_fallback

router = APIRouter(prefix="/v1/research", tags=["research"])


class NicheResponse(BaseModel):
    keyword: str
    niche_score: float
    rating: str
    components: dict
    top_shops: list[dict]
    price_range: dict
    total_listings: int


async def _pg_niche(keyword: str) -> dict:
    """Calculate niche score directly from PostgreSQL."""
    pool = await db_fallback.get_pg_pool()
    # Normalise: path params arrive with + as literal; also replace - with space
    kw_clean = keyword.replace('+', ' ').replace('-', ' ').strip()
    kw_pct = f"%{kw_clean.lower()}%"

    # Aggregate from matching listings
    row = await pool.fetchrow(
        """SELECT COUNT(*) AS total,
                  AVG(num_reviews) AS avg_reviews,
                  MIN(price_usd) AS min_price,
                  MAX(price_usd) AS max_price,
                  AVG(price_usd) AS avg_price
           FROM listings
           WHERE is_active = TRUE
             AND (LOWER(title) LIKE $1 OR EXISTS (
                 SELECT 1 FROM UNNEST(tags) t WHERE LOWER(t) LIKE $1
             ))""",
        kw_pct,
    )
    total = int(row["total"]) if row else 0
    avg_reviews = float(row["avg_reviews"]) if row and row["avg_reviews"] else 1.0

    # Top shops by estimated revenue
    shop_rows = await pool.fetch(
        """SELECT shop_id, COUNT(*) AS listing_count,
                  COALESCE(SUM(est_monthly_revenue), 0) AS est_revenue
           FROM listings
           WHERE is_active = TRUE
             AND (LOWER(title) LIKE $1 OR EXISTS (
                 SELECT 1 FROM UNNEST(tags) t WHERE LOWER(t) LIKE $1
             ))
           GROUP BY shop_id
           ORDER BY est_revenue DESC
           LIMIT 5""",
        kw_pct,
    )
    top_shops = [
        {
            "shop_id": r["shop_id"],
            "listing_count": r["listing_count"],
            "est_revenue": float(r["est_revenue"]),
        }
        for r in shop_rows
    ]

    price_range = {
        "min": float(row["min_price"]) if row and row["min_price"] else 0.0,
        "max": float(row["max_price"]) if row and row["max_price"] else 0.0,
        "avg": float(row["avg_price"]) if row and row["avg_price"] else 0.0,
    }

    volume_est = max(10, total * 3)
    score_data = calculate_niche_score({
        "volume_est": volume_est,
        "competing_count": max(1, total),
        "avg_reviews": avg_reviews,
        "trend_direction": "stable",
    })

    return {
        "keyword": keyword,
        "niche_score": score_data["score"],
        "rating": score_data["rating"],
        "components": score_data["components"],
        "top_shops": top_shops,
        "price_range": price_range,
        "total_listings": total,
    }


@router.get("/niche/{keyword}", response_model=NicheResponse)
async def get_niche_score(
    keyword: str,
    es: AsyncElasticsearch = Depends(get_es),
    redis: Redis = Depends(get_redis),
):
    # Normalise path param (+ → space, - → space)
    keyword = keyword.replace('+', ' ').replace('-', ' ').strip()

    # Redis cache
    try:
        cached = await get_cached(redis, "niche", keyword)
        if cached:
            return cached
    except Exception:
        pass

    # Try Elasticsearch
    try:
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
        volume_est = max(10, total * 3)
        score_data = calculate_niche_score({
            "volume_est": volume_est,
            "competing_count": max(1, total),
            "avg_reviews": avg_reviews,
            "trend_direction": "stable",
        })
        top_shops = [
            {"shop_id": b["key"], "listing_count": b["doc_count"],
             "est_revenue": round(b["est_revenue"]["value"] or 0, 2)}
            for b in (aggs.get("top_shops") or {}).get("buckets", [])
        ]
        price_range = {
            "min": round((aggs.get("min_price") or {}).get("value") or 0, 2),
            "max": round((aggs.get("max_price") or {}).get("value") or 0, 2),
            "avg": round((aggs.get("avg_price") or {}).get("value") or 0, 2),
        }
        payload = NicheResponse(
            keyword=keyword, niche_score=score_data["score"], rating=score_data["rating"],
            components=score_data["components"], top_shops=top_shops,
            price_range=price_range, total_listings=total,
        ).model_dump()
        try:
            await set_cached(redis, "niche", keyword, payload, settings.cache_ttl_niche)
        except Exception:
            pass
        return payload
    except Exception:
        pass

    # PostgreSQL fallback
    try:
        pg_payload = await _pg_niche(keyword)
        try:
            await set_cached(redis, "niche", keyword, pg_payload, settings.cache_ttl_niche)
        except Exception:
            pass
        return pg_payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not calculate niche score: {e}")
