"""GET /v1/dashboard/listings — paginated listing performance table."""
from __future__ import annotations
from src.auth import get_user_id

import uuid as _uuid

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel
from typing import Any

from src.db.timescale_writer import query_listing_performance, get_pool

router = APIRouter(prefix="/v1/dashboard", tags=["dashboard"])


class ListingRow(BaseModel):
    etsy_listing_id: str
    title: str | None
    listing_grade: str | None
    est_monthly_revenue: float | None
    est_monthly_units: int | None
    revenue_confidence: str | None
    views_30d: int | None
    num_reviews: int
    avg_rating: float | None
    tags: list[str]
    price_usd: float | None
    photo_count: int
    is_bestseller: bool
    opportunity_score: float | None


class ListingsResponse(BaseModel):
    data: list[dict[str, Any]]
    total: int
    page: int
    limit: int
    has_more: bool


@router.get("/listings", response_model=ListingsResponse)
async def get_listings(
    sort: str = Query(default="revenue", pattern="^(revenue|views|reviews|grade|opportunity)$"),
    dir: str  = Query(default="desc",    pattern="^(asc|desc)$"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=25, ge=1, le=100),
    x_user_id: str = Depends(get_user_id),
):

    # Return empty response for non-UUID IDs (dev/test)
    try:
        _uuid.UUID(x_user_id)
    except (ValueError, AttributeError):
        return ListingsResponse(data=[], total=0, page=page, limit=limit, has_more=False)

    pool = await get_pool()
    conn_row = await pool.fetchrow(
        "SELECT etsy_shop_id FROM etsy_connections WHERE user_id=$1", x_user_id
    )
    if not conn_row:
        return ListingsResponse(data=[], total=0, page=page, limit=limit, has_more=False)

    shop_id: str = conn_row["etsy_shop_id"]
    offset = (page - 1) * limit
    rows, total = await query_listing_performance(shop_id, sort, dir, limit, offset)

    return ListingsResponse(
        data=rows,
        total=total,
        page=page,
        limit=limit,
        has_more=offset + limit < total,
    )
