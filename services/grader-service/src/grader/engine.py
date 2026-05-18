"""
Main grade engine — combines dimension scores into an A-F grade.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any

from src.grader.dimensions import (
    score_title, score_tags, score_description,
    score_photos, score_price, score_shipping,
)
from src.config import settings

WEIGHTS: dict[str, float] = {
    "title":       0.25,
    "tags":        0.20,
    "description": 0.15,
    "photos":      0.20,
    "price":       0.10,
    "shipping":    0.10,
}


@dataclass
class DimensionScores:
    title: float
    tags: float
    description: float
    photos: float
    price: float
    shipping: float

    def weighted_total(self) -> float:
        return sum(
            getattr(self, dim) * weight
            for dim, weight in WEIGHTS.items()
        )

    def to_dict(self) -> dict[str, float]:
        return {
            "title":       round(self.title, 1),
            "tags":        round(self.tags, 1),
            "description": round(self.description, 1),
            "photos":      round(self.photos, 1),
            "price":       round(self.price, 1),
            "shipping":    round(self.shipping, 1),
        }


@dataclass
class GradeResult:
    overall_grade: str
    overall_score: float
    dimension_scores: DimensionScores
    ai_suggestions: dict[str, Any] | None = None
    image_analysis: list[dict[str, Any]] | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "overall_grade":    self.overall_grade,
            "overall_score":    round(self.overall_score, 1),
            "dimension_scores": self.dimension_scores.to_dict(),
            "ai_suggestions":   self.ai_suggestions,
            "image_analysis":   self.image_analysis,
        }


def _letter_grade(score: float) -> str:
    if score >= settings.grade_a:
        return "A"
    if score >= settings.grade_b:
        return "B"
    if score >= settings.grade_c:
        return "C"
    if score >= settings.grade_d:
        return "D"
    return "F"


def grade_listing(
    listing: dict[str, Any],
    image_scores: list[dict[str, Any]] | None = None,
    category_median_price: float | None = None,
) -> GradeResult:
    """
    Pure function — no I/O. Call this after fetching listing data.
    image_scores and category_median_price are optional enrichments.
    """
    img_scores = image_scores or []

    dims = DimensionScores(
        title=score_title(
            listing.get("title") or "",
            listing.get("tags") or [],
        ),
        tags=score_tags(listing.get("tags") or []),
        description=score_description(listing.get("description")),
        photos=score_photos(
            int(listing.get("photo_count") or 0),
            img_scores,
        ),
        price=score_price(
            listing.get("price_usd"),
            category_median_price,
        ),
        shipping=score_shipping(bool(listing.get("shipping_free"))),
    )

    total = dims.weighted_total()
    return GradeResult(
        overall_grade=_letter_grade(total),
        overall_score=total,
        dimension_scores=dims,
        image_analysis=img_scores if img_scores else None,
    )
