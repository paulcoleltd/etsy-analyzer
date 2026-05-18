"""
AI-powered listing title optimisation using Claude.
Returns a rewritten title, explanation, and keywords used.
"""
import json
from typing import Any

from src.config import settings


async def optimise_title(
    original_title: str,
    tags: list[str],
    category: str,
    market_keywords: list[str],
) -> dict[str, Any]:
    if not settings.anthropic_api_key:
        return _fallback(original_title, market_keywords)

    import anthropic  # lazy import — only needed when API key is present
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    prompt = f"""You are an Etsy SEO expert. Rewrite this listing title to maximise search visibility.

Original title: {original_title}
Category: {category}
Current tags: {', '.join(tags[:10])}
High-volume keywords for this niche: {', '.join(market_keywords[:10])}

Rules:
- Maximum 140 characters
- Front-load the most important keywords
- Keep it readable and natural — not keyword soup
- Include the product type, key attribute, and top keyword

Return ONLY a JSON object with no markdown:
{{"title": "...", "explanation": "...", "keywords_used": [...]}}"""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


def _fallback(original_title: str, market_keywords: list[str]) -> dict[str, Any]:
    """Used when ANTHROPIC_API_KEY is not set (dev / test)."""
    kws = market_keywords[:3]
    prefix = " ".join(kws) + " - " if kws else ""
    new_title = (prefix + original_title)[:140]
    return {
        "title": new_title,
        "explanation": "Prepended top market keywords (AI key not configured).",
        "keywords_used": kws,
    }
