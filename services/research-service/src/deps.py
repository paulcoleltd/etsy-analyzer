"""Shared FastAPI dependencies.

When Elasticsearch is unavailable (as in local dev without Docker),
get_es() returns a mock that immediately raises on any call so
the router fallback logic kicks in without long timeouts.
"""
from __future__ import annotations

import asyncio
import socket
from functools import lru_cache
from urllib.parse import urlparse

from elasticsearch import AsyncElasticsearch
from redis.asyncio import Redis
from src.config import settings


def _es_is_reachable() -> bool:
    """Quick TCP probe — no import overhead, completes in <100 ms."""
    try:
        parsed = urlparse(settings.elasticsearch_url)
        host = parsed.hostname or "localhost"
        port = parsed.port or 9200
        with socket.create_connection((host, port), timeout=0.5):
            return True
    except (OSError, socket.timeout):
        return False


class _DeadES:
    """Drop-in AsyncElasticsearch stand-in that immediately raises."""

    async def search(self, **kw):           raise ConnectionError("Elasticsearch not available")
    async def count(self, **kw):            raise ConnectionError("Elasticsearch not available")
    async def index(self, **kw):            raise ConnectionError("Elasticsearch not available")
    async def bulk(self, **kw):             raise ConnectionError("Elasticsearch not available")
    async def indices(self, **kw):          raise ConnectionError("Elasticsearch not available")
    async def close(self):                  pass


@lru_cache
def get_es() -> AsyncElasticsearch | _DeadES:
    if _es_is_reachable():
        return AsyncElasticsearch(
            [settings.elasticsearch_url],
            request_timeout=5.0,
            retry_on_timeout=False,
            max_retries=1,
        )
    return _DeadES()


@lru_cache
def get_redis() -> Redis:
    return Redis.from_url(settings.redis_url, decode_responses=True)
