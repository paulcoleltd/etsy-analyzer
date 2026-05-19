import hashlib, json
from fastapi import APIRouter, Depends, Query
from elasticsearch import AsyncElasticsearch
from redis.asyncio import Redis
from pydantic import BaseModel

from src.deps import get_es, get_redis
from src.config import settings
from src.volume.estimator import estimate_volume

router = APIRouter(prefix="/v1/keywords", tags=["keywords"])


class ExploreResponse(BaseModel):
    keyword: str
    volume_est: int
    competing_count: int
    competition: str
    trend_direction: str
    related: list[str]


@router.get("/explore", response_model=ExploreResponse)
async def explore_keyword(
    q: str = Query(min_length=1, max_length=200),
    es: AsyncElasticsearch = Depends(get_es),
    redis: Redis = Depends(get_redis),
):
    # Try Redis cache first
    try:
        cache_key = f"kw:vol:{hashlib.sha256(q.lower().encode()).hexdigest()[:16]}"
        raw = await redis.get(cache_key)
        if raw:
            return json.loads(raw)
    except Exception:
        cache_key = None

    # estimate_volume handles ES → PG → hard fallback internally
    data = await estimate_volume(q, es, redis)

    try:
        if cache_key:
            await redis.setex(cache_key, settings.cache_ttl_keyword, json.dumps(data))
    except Exception:
        pass

    return data


@router.get("/suggestions", response_model=list[str])
async def keyword_suggestions(
    q: str = Query(min_length=1, max_length=100),
    es: AsyncElasticsearch = Depends(get_es),
    redis: Redis = Depends(get_redis),
):
    """Autocomplete-style keyword suggestions. Falls back to PG tag search."""
    try:
        cache_key = f"suggest:{hashlib.sha256(q.lower().encode()).hexdigest()[:12]}"
        raw = await redis.get(cache_key)
        if raw:
            return json.loads(raw)
    except Exception:
        cache_key = None

    try:
        resp = await es.search(
            index="keywords",
            query={
                "bool": {
                    "should": [
                        {"prefix": {"keyword": {"value": q.lower(), "boost": 2}}},
                        {"match": {"keyword_text": {"query": q, "fuzziness": "AUTO"}}},
                    ]
                }
            },
            size=10,
            source=["keyword"],
        )
        suggestions = [h["_source"]["keyword"] for h in resp["hits"]["hits"]]

        if not suggestions:
            agg = await es.search(
                index="listings",
                query={"prefix": {"tags": q.lower()}},
                size=0,
                aggs={"tags": {"terms": {"field": "tags", "size": 10}}},
            )
            suggestions = [b["key"] for b in agg["aggregations"]["tags"]["buckets"]]
    except Exception:
        # PG fallback: query tags column
        try:
            from src import db_fallback
            pool = await db_fallback.get_pg_pool()
            rows = await pool.fetch(
                """SELECT LOWER(t) AS tag, COUNT(*) AS freq
                   FROM listings, UNNEST(tags) t
                   WHERE LOWER(t) LIKE $1 AND is_active = TRUE
                   GROUP BY tag ORDER BY freq DESC LIMIT 10""",
                f"{q.lower()}%",
            )
            suggestions = [r["tag"] for r in rows]
        except Exception:
            suggestions = []

    try:
        if cache_key and suggestions:
            await redis.setex(cache_key, settings.cache_ttl_suggest, json.dumps(suggestions))
    except Exception:
        pass

    return suggestions
