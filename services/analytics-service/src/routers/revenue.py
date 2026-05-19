"""GET /v1/dashboard/revenue — time-series revenue data."""
from __future__ import annotations
from src.auth import get_user_id

import uuid as _uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel

from src.db.timescale_writer import query_revenue_series, get_pool

router = APIRouter(prefix="/v1/dashboard", tags=["dashboard"])


class RevenuePoint(BaseModel):
    date: str
    revenue: float
    orders: int = 0


class RevenueResponse(BaseModel):
    from_date: str
    to_date: str
    granularity: str
    data: list[RevenuePoint]
    total_revenue: float
    total_orders: int


@router.get("/revenue", response_model=RevenueResponse)
async def get_revenue(
    from_date: str | None = Query(default=None),
    to_date: str | None = Query(default=None),
    granularity: str = Query(default="day", pattern="^(day|week|month)$"),
    x_user_id: str = Depends(get_user_id),
):

    # Return empty series for non-UUID IDs (dev/test)
    try:
        _uuid.UUID(x_user_id)
    except (ValueError, AttributeError):
        return RevenueResponse(
            from_date=(datetime.now(timezone.utc) - timedelta(days=30)).date().isoformat(),
            to_date=datetime.now(timezone.utc).date().isoformat(),
            granularity=granularity,
            data=[],
            total_revenue=0.0,
            total_orders=0,
        )

    pool = await get_pool()
    conn_row = await pool.fetchrow(
        "SELECT etsy_shop_id FROM etsy_connections WHERE user_id=$1", x_user_id
    )
    if not conn_row:
        return RevenueResponse(
            from_date=(datetime.now(timezone.utc) - timedelta(days=30)).date().isoformat(),
            to_date=datetime.now(timezone.utc).date().isoformat(),
            granularity=granularity,
            data=[],
            total_revenue=0.0,
            total_orders=0,
        )

    shop_id: str = conn_row["etsy_shop_id"]
    now = datetime.now(timezone.utc)

    from_dt = datetime.fromisoformat(from_date) if from_date else now - timedelta(days=30)
    to_dt   = datetime.fromisoformat(to_date)   if to_date   else now

    series = await query_revenue_series(shop_id, from_dt, to_dt, granularity)

    data = [RevenuePoint(date=p["date"], revenue=p["revenue"]) for p in series]
    total_revenue = sum(p.revenue for p in data)

    return RevenueResponse(
        from_date=from_dt.date().isoformat(),
        to_date=to_dt.date().isoformat(),
        granularity=granularity,
        data=data,
        total_revenue=round(total_revenue, 2),
        total_orders=0,
    )
