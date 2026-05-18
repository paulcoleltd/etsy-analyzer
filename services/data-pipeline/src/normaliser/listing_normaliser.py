"""
Converts raw scraped dicts into clean ListingRecord objects
ready for PostgreSQL + Elasticsearch insertion.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from src.normaliser.currency import to_usd


# Category normalisation map (partial — covers top-level Etsy categories)
_CATEGORY_MAP: dict[str, str] = {
    "jewelry": "Jewelry",
    "jewellery": "Jewelry",
    "clothing": "Clothing",
    "accessories": "Accessories",
    "home": "Home & Living",
    "home & living": "Home & Living",
    "home decor": "Home & Living",
    "art": "Art & Collectibles",
    "art & collectibles": "Art & Collectibles",
    "craft supplies": "Craft Supplies & Tools",
    "toys": "Toys & Games",
    "toys & games": "Toys & Games",
    "wedding": "Weddings",
    "paper": "Paper & Party Supplies",
    "books": "Books, Movies & Music",
    "pet": "Pet Supplies",
    "bags": "Bags & Purses",
    "shoes": "Shoes",
    "bath": "Bath & Beauty",
    "beauty": "Bath & Beauty",
    "food": "Food & Drink",
    "electronics": "Electronics & Accessories",
}


def _normalise_category(path: list[str]) -> tuple[list[str], str | None]:
    if not path:
        return [], None
    normalised = [p.strip() for p in path if p.strip()]
    l1 = None
    if normalised:
        raw_l1 = normalised[0].lower()
        l1 = next((v for k, v in _CATEGORY_MAP.items() if k in raw_l1), normalised[0])
    return normalised, l1


def _clean_tags(tags: list[str]) -> list[str]:
    seen: set[str] = set()
    clean: list[str] = []
    for t in tags:
        t = re.sub(r"[^\w\s\-]", "", t.lower()).strip()
        if t and t not in seen and len(t) <= 20:
            seen.add(t)
            clean.append(t)
    return clean[:13]


def _parse_price(price_raw: str | None) -> float | None:
    if not price_raw:
        return None
    try:
        return float(re.sub(r"[^\d.]", "", price_raw))
    except ValueError:
        return None


@dataclass
class ListingRecord:
    etsy_listing_id: str
    shop_id: str
    title: str | None
    description: str | None
    tags: list[str]
    price: float | None
    currency: str
    price_usd: float | None
    category_path: list[str]
    category_l1: str | None
    photo_count: int
    photo_urls: list[str]
    has_video: bool
    shipping_free: bool
    is_bestseller: bool
    num_reviews: int
    avg_rating: float | None
    listing_age_days: int | None
    # Computed downstream
    est_monthly_revenue: float | None = None
    est_monthly_units: int | None = None
    revenue_confidence: str | None = None
    opportunity_score: float | None = None
    listing_grade: str | None = None
    last_scraped: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_db_dict(self) -> dict[str, Any]:
        return {
            "etsy_listing_id": self.etsy_listing_id,
            "shop_id": self.shop_id,
            "title": self.title,
            "description": self.description,
            "tags": self.tags,
            "price": self.price,
            "currency": self.currency,
            "price_usd": self.price_usd,
            "category_path": self.category_path,
            "category_l1": self.category_l1,
            "photo_count": self.photo_count,
            "has_video": self.has_video,
            "shipping_free": self.shipping_free,
            "is_bestseller": self.is_bestseller,
            "num_reviews": self.num_reviews,
            "avg_rating": self.avg_rating,
            "listing_age_days": self.listing_age_days,
            "est_monthly_revenue": self.est_monthly_revenue,
            "est_monthly_units": self.est_monthly_units,
            "revenue_confidence": self.revenue_confidence,
            "opportunity_score": self.opportunity_score,
            "listing_grade": self.listing_grade,
            "last_scraped": self.last_scraped.isoformat(),
            "is_active": True,
        }

    def to_es_doc(self) -> dict[str, Any]:
        doc = self.to_db_dict()
        doc.pop("description", None)  # exclude from search index
        return doc


def normalise_listing(
    raw: dict[str, Any],
    shop_id: str,
    listing_age_days: int | None = None,
) -> ListingRecord:
    price = _parse_price(raw.get("price_raw"))
    currency = (raw.get("currency") or "USD").upper()
    price_usd = to_usd(price, currency) if price else None

    raw_path = raw.get("category_path") or []
    category_path, category_l1 = _normalise_category(raw_path)

    tags = _clean_tags(raw.get("tags") or [])

    return ListingRecord(
        etsy_listing_id=str(raw["etsy_listing_id"]),
        shop_id=shop_id,
        title=(raw.get("title") or "").strip()[:200] or None,
        description=(raw.get("description") or "")[:5000] or None,
        tags=tags,
        price=price,
        currency=currency,
        price_usd=price_usd,
        category_path=category_path,
        category_l1=category_l1,
        photo_count=int(raw.get("photo_count") or 0),
        photo_urls=raw.get("photo_urls") or [],
        has_video=bool(raw.get("has_video")),
        shipping_free=bool(raw.get("shipping_free")),
        is_bestseller=bool(raw.get("is_bestseller")),
        num_reviews=int(raw.get("num_reviews") or 0),
        avg_rating=float(raw["avg_rating"]) if raw.get("avg_rating") else None,
        listing_age_days=listing_age_days,
    )
