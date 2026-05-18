"""
Opportunity / niche score calculator.
Score 0-100. Higher = better opportunity.
"""
from __future__ import annotations

from typing import Any


_TREND_MULTIPLIER: dict[str, float] = {
    "rising": 1.3,
    "stable": 1.0,
    "seasonal": 0.9,
    "declining": 0.6,
}

_RATINGS: list[tuple[float, str]] = [
    (70.0, "excellent"),
    (55.0, "good"),
    (35.0, "moderate"),
    (0.0,  "saturated"),
]


def calculate_niche_score(data: dict[str, Any]) -> dict[str, Any]:
    """
    Args:
        data: {
            volume_est: int,
            competing_count: int,
            avg_reviews: float,
            trend_direction: str,
            avg_price_usd: float (optional)
        }
    Returns:
        {score, rating, components}
    """
    volume = max(0, int(data.get("volume_est") or 0))
    competition = max(1, int(data.get("competing_count") or 1))
    avg_reviews = max(1.0, float(data.get("avg_reviews") or 1))
    trend = data.get("trend_direction") or "stable"
    trend_mult = _TREND_MULTIPLIER.get(trend, 1.0)

    raw_score = (volume / competition) * (1.0 / avg_reviews) * 10_000 * trend_mult
    score = min(100.0, max(0.0, raw_score))

    rating = "saturated"
    for threshold, label in _RATINGS:
        if score >= threshold:
            rating = label
            break

    return {
        "score": round(score, 1),
        "rating": rating,
        "components": {
            "volume": volume,
            "competition": competition,
            "avg_reviews": round(avg_reviews, 1),
            "trend": trend,
        },
    }


def calculate_opportunity_score(listing: dict[str, Any]) -> float:
    """
    Per-listing opportunity score (0-100).
    Combines revenue potential vs competition depth.
    """
    reviews = int(listing.get("num_reviews") or 0)
    age = max(1, int(listing.get("listing_age_days") or 30))
    revenue = float(listing.get("est_monthly_revenue") or 0)
    price = float(listing.get("price_usd") or 20)

    # High revenue + low review count = good opportunity
    review_barrier = min(100, reviews / 10)           # 0-100 (lower = easier)
    revenue_signal = min(100, revenue / 100)           # 0-100 (higher = better)
    price_signal   = min(100, price / 2)               # 0-100 (higher price = bigger market)

    score = (revenue_signal * 0.5) + ((100 - review_barrier) * 0.35) + (price_signal * 0.15)
    return round(min(100.0, max(0.0, score)), 2)
