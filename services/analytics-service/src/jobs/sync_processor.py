"""
BullMQ-compatible sync job processor.
Job: { user_id } — runs sync_user_data and pushes result back to Redis.
"""
from __future__ import annotations

import asyncio
import json
from typing import Any

from redis.asyncio import Redis

from src.etsy.sync import sync_user_data
from src.config import settings
from src.logger import logger

_SYNC_QUEUE = "sync"
_POLL_INTERVAL = 2.0


async def run_sync_worker() -> None:
    import redis.asyncio as aioredis
    redis = aioredis.from_url(settings.redis_url, decode_responses=True)

    logger.info("sync_worker_started")
    while True:
        try:
            import time
            now_ms = time.time() * 1000
            results = await redis.zrangebyscore(
                f"bull:{_SYNC_QUEUE}:wait", "-inf", now_ms, start=0, num=1
            )
            if results:
                raw = results[0]
                removed = await redis.zrem(f"bull:{_SYNC_QUEUE}:wait", raw)
                if removed:
                    job = json.loads(raw)
                    user_id = job.get("data", {}).get("user_id")
                    if user_id:
                        result = await sync_user_data(user_id)
                        logger.info("sync_job_done", user_id=user_id, result=result)
                    continue
        except Exception as exc:
            logger.error("sync_worker_error", error=str(exc))

        await asyncio.sleep(_POLL_INTERVAL)
