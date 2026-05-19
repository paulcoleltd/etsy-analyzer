"""
Bulk grade job — fetches all listings for a shop, grades each one,
and stores progress in Redis for SSE polling.

Job data: { shop_id, user_id, job_id }
Progress key: grade:bulk:{job_id}  (Redis hash)
  fields: total, completed, failed, status (queued|running|done|error)
"""
from __future__ import annotations

import os

import asyncio
import json
from typing import Any

import httpx
from redis.asyncio import Redis

from src.grader import grade_listing
from src.image import score_listing_images
from src.ai import generate_suggestions
from src.db import save_grade
from src.config import settings
from src.logger import logger

_RESEARCH_URL = os.environ.get("RESEARCH_SERVICE_URL", "http://localhost:8012")


async def run_bulk_grade(job_data: dict[str, Any], redis: Redis) -> None:
    job_id = job_data["job_id"]
    shop_id = job_data["shop_id"]
    user_id = job_data.get("user_id")
    progress_key = f"grade:bulk:{job_id}"

    async def _set_progress(**fields: Any) -> None:
        await redis.hset(progress_key, mapping={k: str(v) for k, v in fields.items()})
        await redis.expire(progress_key, 3600 * 24)

    try:
        await _set_progress(status="running", total=0, completed=0, failed=0, shop_id=shop_id)

        # Fetch shop listings from research service
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(f"{_RESEARCH_URL}/v1/research/shop/{shop_id}")
            if resp.status_code != 200:
                await _set_progress(status="error", error=f"Shop {shop_id} not found")
                return
            shop_data = resp.json()

        top_listings: list[dict] = shop_data.get("top_listings") or []
        if not top_listings:
            await _set_progress(status="done", total=0, completed=0, failed=0)
            return

        total = min(len(top_listings), settings.bulk_max_listings)
        await _set_progress(total=total)

        results: list[dict[str, Any]] = []

        for i, listing_stub in enumerate(top_listings[:total]):
            listing_id = listing_stub.get("etsy_listing_id")
            if not listing_id:
                await _set_progress(failed=i + 1)
                continue

            try:
                # Fetch full listing from research service
                async with httpx.AsyncClient(timeout=10.0) as client:
                    detail_resp = await client.get(
                        f"{_RESEARCH_URL}/v1/research/listing/{listing_id}"
                    )
                if detail_resp.status_code != 200:
                    raise ValueError(f"Listing {listing_id} not found")

                listing = detail_resp.json()
                photo_urls: list[str] = listing.get("photo_urls") or []
                image_scores = await score_listing_images(photo_urls)

                result = grade_listing(listing, image_scores=image_scores)
                suggestions = await generate_suggestions(
                    {**listing, "overall_grade": result.overall_grade},
                    result.dimension_scores.to_dict(),
                )
                result.ai_suggestions = suggestions
                grade_dict = result.to_dict()

                if user_id:
                    await save_grade(user_id, listing_id, grade_dict)

                results.append({"etsy_listing_id": listing_id, **grade_dict})
                await _set_progress(completed=i + 1)

            except Exception as exc:
                logger.error("bulk_grade_item_failed", listing_id=listing_id, error=str(exc))
                failed_now = int(await redis.hget(progress_key, "failed") or 0) + 1
                await _set_progress(failed=failed_now)

            # Avoid hammering Claude API — small pause between items
            await asyncio.sleep(0.5)

        # Store results for retrieval
        await redis.setex(
            f"grade:bulk:{job_id}:results",
            3600 * 24,
            json.dumps(results, default=str),
        )
        await _set_progress(status="done")
        logger.info("bulk_grade_complete", job_id=job_id, total=total, results=len(results))

    except Exception as exc:
        logger.error("bulk_grade_job_failed", job_id=job_id, error=str(exc))
        await _set_progress(status="error", error=str(exc))
