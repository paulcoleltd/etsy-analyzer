"""
POST /v1/grade/listing   — grade a single listing
GET  /v1/grade/history   — user's grade history
"""
from __future__ import annotations

import re
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field

from src.grader import grade_listing
from src.image import score_listing_images
from src.ai import generate_suggestions
from src.db import save_grade, fetch_grade_history
from src.deps import get_redis
from redis.asyncio import Redis

router = APIRouter(prefix="/v1/grade", tags=["grader"])

# research-service URL for fetching listing data
_RESEARCH_URL = "http://localhost:8002"


class GradeRequest(BaseModel):
    etsy_listing_id: str | None = Field(default=None, pattern=r"^\d+$")
    url: str | None = None

    def resolve_listing_id(self) -> str:
        if self.etsy_listing_id:
            return self.etsy_listing_id
        if self.url:
            m = re.search(r"/listing/(\d+)", self.url)
            if m:
                return m.group(1)
        raise ValueError("Provide etsy_listing_id or a valid Etsy listing URL")


class GradeResponse(BaseModel):
    etsy_listing_id: str
    overall_grade: str
    overall_score: float
    dimension_scores: dict[str, float]
    ai_suggestions: dict[str, Any] | None
    image_analysis: list[dict[str, Any]] | None
    graded_at: str | None = None


async def _fetch_listing(listing_id: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(f"{_RESEARCH_URL}/v1/research/listing/{listing_id}")
    if resp.status_code == 404:
        raise HTTPException(status_code=404, detail=f"Listing {listing_id} not found in index")
    resp.raise_for_status()
    return resp.json()


@router.post("/listing", response_model=GradeResponse)
async def grade_single(
    body: GradeRequest,
    x_user_id: str | None = Header(default=None),
    redis: Redis = Depends(get_redis),
):
    try:
        listing_id = body.resolve_listing_id()
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Cache check (2h)
    cache_key = f"grade:{listing_id}"
    cached = await redis.get(cache_key)
    if cached:
        import json
        return json.loads(cached)

    listing = await _fetch_listing(listing_id)

    # Score images if photo URLs are available
    photo_urls: list[str] = listing.get("photo_urls") or []
    image_scores = await score_listing_images(photo_urls)

    # Grade
    result = grade_listing(listing, image_scores=image_scores)

    # AI suggestions
    suggestions = await generate_suggestions(
        {**listing, "overall_grade": result.overall_grade, "overall_score": result.overall_score},
        result.dimension_scores.to_dict(),
    )
    result.ai_suggestions = suggestions

    grade_dict = result.to_dict()

    # Persist to DB
    saved = {}
    if x_user_id:
        try:
            saved = await save_grade(x_user_id, listing_id, grade_dict)
        except Exception:
            pass  # non-fatal — grade still returned

    # Cache
    payload = {
        "etsy_listing_id": listing_id,
        **grade_dict,
        "graded_at": saved.get("graded_at"),
    }
    import json
    await redis.setex(cache_key, 7200, json.dumps(payload, default=str))

    return payload


@router.get("/history", response_model=list[dict])
async def grade_history(
    listing_id: str | None = None,
    x_user_id: str | None = Header(default=None),
):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    return await fetch_grade_history(x_user_id, listing_id)
