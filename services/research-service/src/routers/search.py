from typing import Annotated, Literal
from fastapi import APIRouter, Depends, Query, HTTPException
from elasticsearch import AsyncElasticsearch
from redis.asyncio import Redis
from pydantic import BaseModel

from src.deps import get_es, get_redis
from src import db_fallback
from src.config import settings
from src.cache.redis_cache import get_cached, set_cached
from src.ml.niche_scorer import opportunity_score

router = APIRouter(prefix="/v1/research", tags=["research"])

SortField = Literal[
    "opportunity_score", "est_monthly_revenue",
    "num_reviews", "price_usd", "_score",
]


class ListingResult(BaseModel):
    etsy_listing_id: str
    shop_id: str
    title: str | None
    price_usd: float | None
    num_reviews: int
    avg_rating: float | None
    est_monthly_revenue: float | None
    est_monthly_units: int | None
    revenue_confidence: str | None
    opportunity_score: float | None
    listing_grade: str | None
    is_bestseller: bool
    category_l1: str | None
    tags: list[str]


class SearchResponse(BaseModel):
    keyword: str
    total: int
    results: list[ListingResult]


@router.get("/search", response_model=SearchResponse)
async def search_listings(
    q: Annotated[str, Query(min_length=1, max_length=200)],
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
    sort: SortField = "opportunity_score",
    category: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    min_reviews: int | None = None,
    min_score: float | None = None,
    es: AsyncElasticsearch = Depends(get_es),
    redis: Redis = Depends(get_redis),
):
    cache_key = f"{q}:{limit}:{sort}:{category}:{min_price}:{max_price}:{min_reviews}:{min_score}"
    cached = await get_cached(redis, "search", cache_key)
    if cached:
        return cached

    filters: list[dict] = [{"term": {"is_active": True}}]
    if category:
        filters.append({"term": {"category_l1": category}})
    if min_price is not None:
        filters.append({"range": {"price_usd": {"gte": min_price}}})
    if max_price is not None:
        filters.append({"range": {"price_usd": {"lte": max_price}}})
    if min_reviews is not None:
        filters.append({"range": {"num_reviews": {"gte": min_reviews}}})
    if min_score is not None:
        filters.append({"range": {"opportunity_score": {"gte": min_score}}})

    query = {
        "bool": {
            "must": {
                "multi_match": {
                    "query": q,
                    "fields": ["title^3", "tags^2", "category_l1"],
                    "type": "best_fields",
                    "fuzziness": "AUTO",
                }
            },
            "filter": filters,
        }
    }

    sort_clause: list = (
        [{"_score": "desc"}]
        if sort == "_score"
        else [{sort: {"order": "desc", "missing": "_last"}}, {"_score": "desc"}]
    )

    try:
        resp = await es.search(
            index="listings",
            query=query,
            sort=sort_clause,
            size=limit,
            source=True,
        )
        hits = resp["hits"]["hits"]
        total = resp["hits"]["total"]["value"]
        results = [_hit_to_result(h) for h in hits]
    except Exception:
        # Elasticsearch unavailable — fall back to PostgreSQL
        try:
            pg_result = await db_fallback.pg_search(
                q=q, limit=limit, sort=sort,
                category=category, min_price=min_price, max_price=max_price,
                min_reviews=min_reviews, min_score=min_score,
            )
            try:
                await set_cached(redis, "search", cache_key, pg_result, settings.cache_ttl_search)
            except Exception:
                pass
            return pg_result
        except Exception:
            # Complete fallback: empty response
            return {"keyword": q, "total": 0, "results": []}

    payload = SearchResponse(keyword=q, total=total, results=results).model_dump()
    await set_cached(redis, "search", cache_key, payload, settings.cache_ttl_search)
    return payload


def _hit_to_result(hit: dict) -> ListingResult:
    src = hit["_source"]
    return ListingResult(
        etsy_listing_id=src.get("etsy_listing_id", hit["_id"]),
        shop_id=src.get("shop_id", ""),
        title=src.get("title"),
        price_usd=src.get("price_usd"),
        num_reviews=src.get("num_reviews") or 0,
        avg_rating=src.get("avg_rating"),
        est_monthly_revenue=src.get("est_monthly_revenue"),
        est_monthly_units=src.get("est_monthly_units"),
        revenue_confidence=src.get("revenue_confidence"),
        opportunity_score=src.get("opportunity_score"),
        listing_grade=src.get("listing_grade"),
        is_bestseller=bool(src.get("is_bestseller")),
        category_l1=src.get("category_l1"),
        tags=src.get("tags") or [],
    )
