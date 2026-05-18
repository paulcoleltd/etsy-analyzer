"""Simple JSON cache backed by Redis."""
import hashlib
import json
from typing import Any
from redis.asyncio import Redis


def _key(prefix: str, value: str) -> str:
    h = hashlib.sha256(value.lower().encode()).hexdigest()[:16]
    return f"{prefix}:{h}"


async def get_cached(redis: Redis, prefix: str, value: str) -> Any | None:
    raw = await redis.get(_key(prefix, value))
    if raw:
        return json.loads(raw)
    return None


async def set_cached(
    redis: Redis, prefix: str, value: str, data: Any, ttl: int
) -> None:
    await redis.setex(_key(prefix, value), ttl, json.dumps(data, default=str))
