"""
POST /v1/grade/bulk                — enqueue bulk audit job
GET  /v1/grade/bulk/{job_id}/status  — job progress (also streamed via SSE)
GET  /v1/grade/bulk/{job_id}/results — paginated results
"""
from __future__ import annotations

import asyncio
import json
import uuid
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from redis.asyncio import Redis

from src.deps import get_redis
from src.jobs.bulk_processor import run_bulk_grade

router = APIRouter(prefix="/v1/grade", tags=["grader"])


class BulkRequest(BaseModel):
    shop_id: str


class BulkStatusResponse(BaseModel):
    job_id: str
    status: str          # queued | running | done | error
    total: int
    completed: int
    failed: int
    shop_id: str | None = None
    error: str | None = None


@router.post("/bulk", response_model=dict)
async def start_bulk(
    body: BulkRequest,
    x_user_id: str | None = Header(default=None),
    redis: Redis = Depends(get_redis),
):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    job_id = str(uuid.uuid4())
    progress_key = f"grade:bulk:{job_id}"

    # Record queued state immediately
    await redis.hset(progress_key, mapping={
        "status": "queued", "total": "0",
        "completed": "0", "failed": "0",
        "shop_id": body.shop_id,
    })
    await redis.expire(progress_key, 3600 * 24)

    # Run in background — FastAPI background tasks handle this
    import asyncio
    asyncio.create_task(
        run_bulk_grade({"job_id": job_id, "shop_id": body.shop_id, "user_id": x_user_id}, redis)
    )

    return {"job_id": job_id, "status": "queued"}


@router.get("/bulk/{job_id}/status", response_model=BulkStatusResponse)
async def bulk_status(
    job_id: str,
    redis: Redis = Depends(get_redis),
):
    data = await redis.hgetall(f"grade:bulk:{job_id}")
    if not data:
        raise HTTPException(status_code=404, detail="Job not found")

    return BulkStatusResponse(
        job_id=job_id,
        status=data.get("status", "unknown"),
        total=int(data.get("total") or 0),
        completed=int(data.get("completed") or 0),
        failed=int(data.get("failed") or 0),
        shop_id=data.get("shop_id"),
        error=data.get("error"),
    )


@router.get("/bulk/{job_id}/stream")
async def bulk_stream(
    job_id: str,
    redis: Redis = Depends(get_redis),
):
    """SSE endpoint — streams progress events until job completes."""

    async def _event_gen() -> AsyncGenerator[str, None]:
        progress_key = f"grade:bulk:{job_id}"
        while True:
            data = await redis.hgetall(progress_key)
            if not data:
                yield _sse({"error": "job_not_found"})
                return

            payload = {
                "status":    data.get("status", "unknown"),
                "total":     int(data.get("total") or 0),
                "completed": int(data.get("completed") or 0),
                "failed":    int(data.get("failed") or 0),
            }
            yield _sse(payload)

            if data.get("status") in ("done", "error"):
                return

            await asyncio.sleep(1.5)

    return StreamingResponse(_event_gen(), media_type="text/event-stream")


@router.get("/bulk/{job_id}/results")
async def bulk_results(
    job_id: str,
    page: int = 1,
    limit: int = 25,
    redis: Redis = Depends(get_redis),
):
    raw = await redis.get(f"grade:bulk:{job_id}:results")
    if not raw:
        raise HTTPException(status_code=404, detail="Results not available yet")

    all_results: list = json.loads(raw)
    start = (page - 1) * limit
    paginated = all_results[start: start + limit]

    return {
        "job_id": job_id,
        "total": len(all_results),
        "page": page,
        "limit": limit,
        "results": paginated,
    }


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"
