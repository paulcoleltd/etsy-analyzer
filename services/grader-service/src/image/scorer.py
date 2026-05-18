"""
Scores listing photos using Claude Vision API.
Gracefully degrades when ANTHROPIC_API_KEY is absent or photos are unavailable.
"""
from __future__ import annotations

import base64
import json
from typing import Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from src.config import settings
from src.logger import logger

_SCORE_PROMPT = """\
Rate this Etsy product photo on these dimensions. Return ONLY valid JSON, no markdown:
{
  "resolution_score": 0-100,
  "product_prominence": 0-100,
  "background_quality": 0-100,
  "has_text_overlay": true/false,
  "is_lifestyle": true/false,
  "overall_score": 0-100,
  "flags": []
}

Scoring guide:
- resolution_score: sharpness and clarity (100 = crystal clear)
- product_prominence: how well the product fills the frame (100 = product is hero)
- background_quality: clean/white bg = high, cluttered bg = low
- has_text_overlay: true if there is text/watermark on the image
- is_lifestyle: true if showing product in use/context rather than plain product
- overall_score: holistic quality score
- flags: list of issues e.g. ["blurry", "poor_lighting", "watermark"]"""


@retry(stop=stop_after_attempt(2), wait=wait_exponential(min=2, max=10))
async def _score_single_image(client: httpx.AsyncClient, image_url: str) -> dict[str, Any]:
    """Download image and send to Claude Vision."""
    try:
        img_resp = await client.get(image_url, timeout=15.0, follow_redirects=True)
        img_resp.raise_for_status()
    except Exception as exc:
        logger.warning("image_download_failed", url=image_url[:80], error=str(exc))
        return _fallback_score()

    content_type = img_resp.headers.get("content-type", "image/jpeg")
    if "jpeg" in content_type or "jpg" in content_type:
        media_type = "image/jpeg"
    elif "png" in content_type:
        media_type = "image/png"
    elif "webp" in content_type:
        media_type = "image/webp"
    else:
        media_type = "image/jpeg"

    img_b64 = base64.standard_b64encode(img_resp.content).decode()

    import anthropic  # lazy import
    claude = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    response = claude.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=256,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": img_b64,
                    },
                },
                {"type": "text", "text": _SCORE_PROMPT},
            ],
        }],
    )

    raw = response.content[0].text.strip()
    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = "\n".join(raw.split("\n")[1:])
        raw = raw.rsplit("```", 1)[0]
    return json.loads(raw.strip())


async def score_listing_images(photo_urls: list[str]) -> list[dict[str, Any]]:
    """Score up to 5 photos. Returns fallback scores when Vision is unavailable."""
    if not settings.anthropic_api_key or not photo_urls:
        return [_fallback_score() for _ in photo_urls[:5]]

    results: list[dict[str, Any]] = []
    async with httpx.AsyncClient() as client:
        for url in photo_urls[:5]:
            try:
                score = await _score_single_image(client, url)
                results.append(score)
            except Exception as exc:
                logger.error("image_score_failed", url=url[:80], error=str(exc))
                results.append(_fallback_score())

    return results


def _fallback_score() -> dict[str, Any]:
    """Neutral placeholder used when Vision API is unavailable."""
    return {
        "resolution_score": 60,
        "product_prominence": 60,
        "background_quality": 60,
        "has_text_overlay": False,
        "is_lifestyle": False,
        "overall_score": 60,
        "flags": [],
    }
