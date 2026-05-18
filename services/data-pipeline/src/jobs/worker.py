"""
Polling worker — dequeues jobs from Redis and dispatches to processors.
A thin loop used in environments where bullmq-py is not available.
"""
from __future__ import annotations

import asyncio
import json
import signal
from typing import Any

from src.jobs.redis_client import get_redis
from src.jobs.queue_names import SCRAPE_QUEUE
from src.jobs.scrape_processor import process_scrape_job
from src.logger import logger

QUEUES = [SCRAPE_QUEUE]
POLL_INTERVAL = 1.0  # seconds
_running = True


def _shutdown(sig: int, _frame: Any) -> None:
    global _running
    logger.info("worker_shutdown_signal", sig=sig)
    _running = False


async def _process_one(queue: str) -> bool:
    redis = get_redis()
    now_ms = asyncio.get_event_loop().time() * 1000

    # Atomically pop the earliest due job
    results = await redis.zrangebyscore(
        f"bull:{queue}:wait", "-inf", now_ms, start=0, num=1, withscores=False
    )
    if not results:
        return False

    raw = results[0]
    removed = await redis.zrem(f"bull:{queue}:wait", raw)
    if not removed:
        return False  # Another worker took it

    try:
        job = json.loads(raw)
        job_name: str = job["name"]
        data: dict[str, Any] = job.get("data", {})

        logger.info("job_dequeued", queue=queue, job=job_name, id=job.get("id"))
        result = await process_scrape_job(job_name, data)
        logger.info("job_completed", queue=queue, job=job_name, result=result)
    except Exception as exc:
        logger.error("job_failed", queue=queue, raw=raw[:200], error=str(exc))
        # Re-queue for retry (simplistic — full retry logic lives in BullMQ Node workers)
        await redis.zadd(f"bull:{queue}:wait", {raw: now_ms + 30_000})

    return True


async def run_worker() -> None:
    signal.signal(signal.SIGINT,  _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)

    logger.info("worker_started", queues=QUEUES)
    while _running:
        did_work = False
        for queue in QUEUES:
            try:
                did_work |= await _process_one(queue)
            except Exception as exc:
                logger.error("worker_loop_error", queue=queue, error=str(exc))

        if not did_work:
            await asyncio.sleep(POLL_INTERVAL)
