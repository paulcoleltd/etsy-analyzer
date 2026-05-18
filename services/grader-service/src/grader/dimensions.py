"""
Scoring functions for each of the 6 grade dimensions.
Each returns a float 0-100.
"""
from __future__ import annotations
import re


# ── Title scoring ─────────────────────────────────────────────────

def score_title(title: str, tags: list[str]) -> float:
    if not title:
        return 0.0

    score = 0.0

    # Length (optimal 80-140 chars)
    length = len(title)
    if length >= 100:
        score += 30
    elif length >= 80:
        score += 25
    elif length >= 50:
        score += 15
    else:
        score += 5

    # Keyword density — how many top-5 tags appear in the title
    title_lower = title.lower()
    kw_hits = sum(1 for tag in tags[:5] if tag.lower() in title_lower)
    score += min(40, kw_hits * 10)

    # Front-loading — top tags in first 40 chars
    prefix = title_lower[:40]
    front_hits = sum(1 for tag in tags[:3] if tag.lower() in prefix)
    score += min(20, front_hits * 8)

    # No ALL-CAPS abuse
    cap_ratio = sum(1 for c in title if c.isupper()) / max(1, len(title))
    if cap_ratio > 0.5:
        score -= 10

    return min(100.0, max(0.0, score))


# ── Tags scoring ──────────────────────────────────────────────────

def score_tags(tags: list[str]) -> float:
    count = len(tags)
    if count == 13:
        return 100.0
    if count >= 11:
        return 85.0
    if count >= 8:
        return 65.0
    if count >= 5:
        return 45.0
    return max(0.0, count * 6.0)


# ── Description scoring ───────────────────────────────────────────

def score_description(description: str | None) -> float:
    if not description:
        return 0.0

    score = 0.0
    length = len(description)

    # Length (500+ chars is good, 1500+ is great)
    if length >= 1500:
        score += 40
    elif length >= 800:
        score += 30
    elif length >= 400:
        score += 20
    elif length >= 100:
        score += 10

    # Has bullet points / structure
    has_bullets = bool(re.search(r"^[-•*]|\n[-•*]", description))
    if has_bullets:
        score += 15

    # Has a CTA
    cta_patterns = [
        r"\bmessage\s+me\b", r"\bcontact\s+us\b", r"\border\s+now\b",
        r"\badd\s+to\s+cart\b", r"\bshop\s+now\b", r"\bvisit\s+my\s+shop\b",
    ]
    has_cta = any(re.search(p, description.lower()) for p in cta_patterns)
    if has_cta:
        score += 15

    # Keyword mentions (very rough proxy)
    word_count = len(description.split())
    if word_count >= 150:
        score += 20
    elif word_count >= 75:
        score += 10

    # Has FAQ / care instructions
    faq_patterns = [r"\bcare\s+instruction", r"\bfaq\b", r"\bfrequently\b", r"\bwashing\b"]
    if any(re.search(p, description.lower()) for p in faq_patterns):
        score += 10

    return min(100.0, score)


# ── Photo scoring ─────────────────────────────────────────────────

def score_photos(photo_count: int, image_scores: list[dict]) -> float:
    # Base score from count
    if photo_count >= 10:
        base = 70.0
    elif photo_count >= 7:
        base = 55.0
    elif photo_count >= 5:
        base = 40.0
    elif photo_count >= 3:
        base = 25.0
    else:
        base = max(0.0, photo_count * 8.0)

    # Bonus from image quality scores
    if image_scores:
        avg_quality = sum(s.get("overall_score", 50) for s in image_scores) / len(image_scores)
        quality_bonus = (avg_quality / 100) * 30
        return min(100.0, base + quality_bonus)

    return min(100.0, base)


# ── Price scoring ─────────────────────────────────────────────────

def score_price(price_usd: float | None, category_median: float | None) -> float:
    if price_usd is None:
        return 50.0  # no data, neutral

    if category_median is None or category_median == 0:
        # Without median, just check it's not suspiciously low
        if price_usd >= 5:
            return 70.0
        return 40.0

    ratio = price_usd / category_median
    if 0.7 <= ratio <= 1.5:
        return 90.0  # competitive range
    if 0.5 <= ratio < 0.7:
        return 70.0  # slightly low — may hurt perceived value
    if 1.5 < ratio <= 2.5:
        return 65.0  # premium — acceptable if justified
    if ratio < 0.5:
        return 40.0  # too low — race to bottom
    return 50.0      # very high premium


# ── Shipping scoring ──────────────────────────────────────────────

def score_shipping(shipping_free: bool) -> float:
    return 100.0 if shipping_free else 40.0
