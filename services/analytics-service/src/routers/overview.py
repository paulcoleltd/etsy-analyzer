"""GET /v1/dashboard/overview — KPI summary for the connected shop."""
from __future__ import annotations
from src.auth import get_user_id

import json
import uuid as _uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from redis.asyncio import Redis

from src.db.timescale_writer import get_pool
from src.logger import logger


def _is_valid_uuid(val: str) -> bool:
    try:
        _uuid.UUID(val)
        return True
    except (ValueError, AttributeError):
        return False

router = APIRouter(prefix="/v1/dashboard", tags=["dashboard"])


class KPICard(BaseModel):
    value: float
    prev_value: float | None = None
    pct_change: float | None = None
    unit: str = "usd"


class OverviewResponse(BaseModel):
    period: str
    revenue_today: KPICard
    revenue_7d: KPICard
    revenue_30d: KPICard
    orders_30d: KPICard
    avg_order_value: KPICard
    total_views_30d: KPICard
    top_listings: list[dict]
    etsy_connected: bool
    shop_name: str | None
    last_synced: str | None


def _pct_change(current: float, previous: float | None) -> float | None:
    if previous is None or previous == 0:
        return None
    return round((current - previous) / previous * 100, 1)


async def _get_revenue(pool, shop_id: str, from_dt: datetime, to_dt: datetime) -> float:
    row = await pool.fetchrow(
        """SELECT COALESCE(SUM(est_revenue),0) AS rev
           FROM listing_metrics
           WHERE listing_id IN (
               SELECT etsy_listing_id FROM listings WHERE shop_id=$1
           ) AND recorded_at BETWEEN $2 AND $3""",
        shop_id, from_dt, to_dt,
    )
    return float(row["rev"]) if row else 0.0


async def _get_order_count(pool, shop_id: str, from_dt: datetime, to_dt: datetime) -> int:
    row = await pool.fetchrow(
        """SELECT COALESCE(SUM(est_monthly_units),0) AS orders
           FROM listings WHERE shop_id=$1 AND is_active=true""",
        shop_id,
    )
    return int(row["orders"]) if row else 0


@router.get("/overview", response_model=OverviewResponse)
async def get_overview(
    period: str = "30d",
    x_user_id: str = Depends(get_user_id),
):

    # Return empty dashboard for non-UUID user IDs (dev/test tokens)
    if not _is_valid_uuid(x_user_id):
        return OverviewResponse(
            period=period,
            revenue_today=KPICard(value=0),
            revenue_7d=KPICard(value=0),
            revenue_30d=KPICard(value=0),
            orders_30d=KPICard(value=0),
            avg_order_value=KPICard(value=0),
            total_views_30d=KPICard(value=0),
            top_listings=[],
            etsy_connected=False,
            shop_name=None,
            last_synced=None,
        )

    pool = await get_pool()

    # Get etsy connection
    conn_row = await pool.fetchrow(
        "SELECT etsy_shop_id, etsy_shop_name FROM etsy_connections WHERE user_id=$1",
        x_user_id,
    )
    etsy_connected = conn_row is not None
    shop_id = conn_row["etsy_shop_id"] if conn_row else None
    shop_name = conn_row["etsy_shop_name"] if conn_row else None

    if not shop_id:
        return OverviewResponse(
            period=period,
            revenue_today=KPICard(value=0),
            revenue_7d=KPICard(value=0),
            revenue_30d=KPICard(value=0),
            orders_30d=KPICard(value=0),
            avg_order_value=KPICard(value=0),
            total_views_30d=KPICard(value=0),
            top_listings=[],
            etsy_connected=False,
            shop_name=None,
            last_synced=None,
        )

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Revenue figures
    rev_today = await _get_revenue(pool, shop_id, today_start, now)
    rev_7d    = await _get_revenue(pool, shop_id, now - timedelta(days=7), now)
    rev_30d   = await _get_revenue(pool, shop_id, now - timedelta(days=30), now)
    rev_30d_prev = await _get_revenue(pool, shop_id, now - timedelta(days=60), now - timedelta(days=30))

    orders_30d = await _get_order_count(pool, shop_id, now - timedelta(days=30), now)
    avg_order = round(rev_30d / max(1, orders_30d), 2) if orders_30d else 0.0

    # Views (sum from listing_metrics)
    views_row = await pool.fetchrow(
        """SELECT COALESCE(SUM(views),0) AS total_views
           FROM listing_metrics
           WHERE listing_id IN (SELECT etsy_listing_id FROM listings WHERE shop_id=$1)
           AND recorded_at > $2""",
        shop_id, now - timedelta(days=30),
    )
    total_views = int(views_row["total_views"]) if views_row else 0

    # Top listings (by est_monthly_revenue)
    top_rows = await pool.fetch(
        """SELECT etsy_listing_id, title, listing_grade, est_monthly_revenue,
                  views_30d, num_reviews, opportunity_score
           FROM listings WHERE shop_id=$1 AND is_active=true
           ORDER BY est_monthly_revenue DESC NULLS LAST LIMIT 5""",
        shop_id,
    )
    top_listings = [dict(r) for r in top_rows]

    # Last sync
    shop_row = await pool.fetchrow(
        "SELECT last_synced FROM shops WHERE etsy_shop_id=$1", shop_id
    )
    last_synced = shop_row["last_synced"].isoformat() if (shop_row and shop_row["last_synced"]) else None

    return OverviewResponse(
        period=period,
        revenue_today=KPICard(value=rev_today),
        revenue_7d=KPICard(value=rev_7d),
        revenue_30d=KPICard(
            value=rev_30d,
            prev_value=rev_30d_prev,
            pct_change=_pct_change(rev_30d, rev_30d_prev),
        ),
        orders_30d=KPICard(value=orders_30d, unit="count"),
        avg_order_value=KPICard(value=avg_order),
        total_views_30d=KPICard(value=total_views, unit="count"),
        top_listings=top_listings,
        etsy_connected=etsy_connected,
        shop_name=shop_name,
        last_synced=last_synced,
    )
