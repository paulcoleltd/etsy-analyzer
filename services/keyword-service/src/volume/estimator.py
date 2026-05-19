"""
Keyword volume estimator.

Signal stack (no external API needed):
  1. Etsy listing count for the keyword (primary signal — from ES or PG)
  2. Trending score from Redis sorted set `trending:keywords:{date}`
  3. Heuristic: volume ≈ listing_count × 3  (empirically calibrated)

Falls back to PostgreSQL when Elasticsearch is unavailable.
"""
from __future__ import annotations

from datetime import date
from typing import Any

from elasticsearch import AsyncElasticsearch
from redis.asyncio import Redis


async def estimate_volume(
    keyword: str,
    es: AsyncElasticsearch,
    redis: Redis,
) -> dict[str, Any]:
    try:
        return await _es_estimate(keyword, es, redis)
    except Exception:
        pass

    try:
        from src import db_fallback
        return await db_fallback.pg_explore_keyword(keyword)
    except Exception:
        pass

    # Hard fallback — return minimal structure
    return {
        "keyword": keyword,
        "volume_est": 500,
        "competing_count": 0,
        "competition": "unknown",
        "trend_direction": "stable",
        "related": [],
    }


async def _es_estimate(
    keyword: str,
    es: AsyncElasticsearch,
    redis: Redis,
) -> dict[str, Any]:
    """ES-based volume estimation (raises on connection failure)."""
    # 1. Count competing listings
    resp = await es.count(
        index="listings",
        query={
            "bool": {
                "must": {
                    "multi_match": {
                        "query": keyword,
                        "fields": ["title^2", "tags"],
                        "fuzziness": "AUTO",
                    }
                },
                "filter": [{"term": {"is_active": True}}],
            }
        },
    )
    competing_count: int = resp["count"]

    # 2. Check trending redis set
    today = date.today().isoformat()
    trend_score = await redis.zscore(f"trending:keywords:{today}", keyword.lower())

    # 3. Heuristic volume
    volume_est = max(10, competing_count * 3)
    if trend_score:
        volume_est = int(volume_est * min(2.0, 1 + trend_score / 100))

    # 4. Competition tier
    if competing_count < 500:
        competition = "low"
    elif competing_count < 5000:
        competition = "medium"
    else:
        competition = "high"

    # 5. Related keywords from top tags of matching listings
    agg_resp = await es.search(
        index="listings",
        query={
            "bool": {
                "must": {"multi_match": {"query": keyword, "fields": ["title", "tags"]}},
                "filter": [{"term": {"is_active": True}}],
            }
        },
        size=0,
        aggs={"top_tags": {"terms": {"field": "tags", "size": 10}}},
    )
    related = [
        b["key"]
        for b in agg_resp["aggregations"]["top_tags"]["buckets"]
        if b["key"].lower() != keyword.lower()
    ]

    return {
        "keyword": keyword,
        "volume_est": volume_est,
        "competing_count": competing_count,
        "competition": competition,
        "trend_direction": "rising" if trend_score and trend_score > 50 else "stable",
        "related": related[:8],
    }
