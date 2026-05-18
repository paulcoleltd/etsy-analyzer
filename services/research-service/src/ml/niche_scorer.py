"""Copied from data-pipeline — shared scoring logic."""
from typing import Any

_TREND_MULT: dict[str, float] = {
    "rising": 1.3, "stable": 1.0, "seasonal": 0.9, "declining": 0.6,
}
_RATINGS = [(70.0, "excellent"), (55.0, "good"), (35.0, "moderate"), (0.0, "saturated")]


def calculate_niche_score(data: dict[str, Any]) -> dict[str, Any]:
    volume = max(0, int(data.get("volume_est") or 0))
    competition = max(1, int(data.get("competing_count") or 1))
    avg_reviews = max(1.0, float(data.get("avg_reviews") or 1))
    trend = data.get("trend_direction") or "stable"
    mult = _TREND_MULT.get(trend, 1.0)

    raw = (volume / competition) * (1.0 / avg_reviews) * 10_000 * mult
    score = min(100.0, max(0.0, raw))
    rating = next(label for threshold, label in _RATINGS if score >= threshold)

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


def opportunity_score(listing: dict[str, Any]) -> float:
    reviews = int(listing.get("num_reviews") or 0)
    revenue = float(listing.get("est_monthly_revenue") or 0)
    price = float(listing.get("price_usd") or 20)
    review_barrier = min(100, reviews / 10)
    revenue_signal = min(100, revenue / 100)
    price_signal = min(100, price / 2)
    return round(min(100.0, (revenue_signal * 0.5) + ((100 - review_barrier) * 0.35) + (price_signal * 0.15)), 2)
