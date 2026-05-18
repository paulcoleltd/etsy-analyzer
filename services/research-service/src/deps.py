"""Shared FastAPI dependencies."""
from functools import lru_cache
from elasticsearch import AsyncElasticsearch
from redis.asyncio import Redis
from src.config import settings


@lru_cache
def get_es() -> AsyncElasticsearch:
    return AsyncElasticsearch(
        [settings.elasticsearch_url],
        retry_on_timeout=True,
        max_retries=3,
    )


@lru_cache
def get_redis() -> Redis:
    return Redis.from_url(settings.redis_url, decode_responses=True)
