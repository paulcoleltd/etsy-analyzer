"""
Enqueues recurring scrape jobs into Redis/BullMQ.
Run once at startup; BullMQ repeatable jobs handle the schedule from there.

Uses raw Redis ZADD to push BullMQ-compatible job payloads since
the Python bullmq library API differs across versions. This is the
lowest-common-denominator approach that works regardless of bullmq-py version.
"""
from __future__ import annotations

import json
import time
from typing import Any

from src.jobs.redis_client import get_redis
from src.jobs.queue_names import SCRAPE_QUEUE
from src.logger import logger

# Top categories to seed on first run
SEED_KEYWORDS: list[str] = [
    "personalised jewellery", "custom portrait", "wedding invitation",
    "crochet pattern", "digital planner", "wall art print",
    "handmade candle", "vintage clothing", "pet portrait",
    "svg cut file", "macrame wall hanging", "birth poster",
    "resin coasters", "friendship bracelet", "enamel pin",
    "embroidery kit", "pressed flower art", "leather wallet",
    "custom name necklace", "sticker sheet",
]


async def enqueue_job(
    queue: str,
    job_name: str,
    data: dict[str, Any],
    delay_ms: int = 0,
) -> str:
    redis = get_redis()
    job_id = f"{job_name}:{int(time.time() * 1000)}"
    score = time.time() * 1000 + delay_ms  # BullMQ uses ms timestamps

    payload = json.dumps({
        "id": job_id,
        "name": job_name,
        "data": data,
        "opts": {"attempts": 3, "backoff": {"type": "exponential", "delay": 5000}},
        "timestamp": int(time.time() * 1000),
    })

    # BullMQ wait queue key
    await redis.zadd(f"bull:{queue}:wait", {payload: score})
    return job_id


async def seed_initial_scrapes(stagger_ms: int = 5_000) -> None:
    """Enqueue seed scrape jobs staggered by stagger_ms to avoid thundering herd."""
    logger.info("seeding_initial_scrapes", count=len(SEED_KEYWORDS))
    for i, keyword in enumerate(SEED_KEYWORDS):
        await enqueue_job(
            SCRAPE_QUEUE,
            "scrape.search",
            {"keyword": keyword},
            delay_ms=i * stagger_ms,
        )
    logger.info("seed_jobs_enqueued", count=len(SEED_KEYWORDS))


async def schedule_recurring_jobs() -> None:
    """
    Register repeatable job schedules.
    BullMQ workers on the Node.js side read these; here we just enqueue
    the first run of each with appropriate delays.
    """
    recurring: list[tuple[str, dict[str, Any], int]] = [
        # (job_name, data, delay_hours)
        ("scrape.search", {"keyword": "trending etsy"}, 0),
        ("scrape.category", {"category": "jewelry", "keywords": ["ring", "necklace", "bracelet"]}, 1),
        ("scrape.category", {"category": "home", "keywords": ["wall art", "candle", "pillow cover"]}, 2),
        ("scrape.category", {"category": "wedding", "keywords": ["wedding invitation", "wedding favour"]}, 3),
    ]
    for job_name, data, delay_h in recurring:
        await enqueue_job(SCRAPE_QUEUE, job_name, data, delay_ms=delay_h * 3_600_000)
    logger.info("recurring_jobs_scheduled", count=len(recurring))
