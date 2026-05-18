"""
Generates actionable listing improvement suggestions via Claude.
Focuses only on low-scoring dimensions to minimise token usage.
"""
from __future__ import annotations

import json
from typing import Any

from src.config import settings
from src.logger import logger

_SYSTEM = (
    "You are an Etsy SEO and conversion-rate expert with 10 years of experience "
    "optimising listings. You give specific, actionable advice — never generic tips."
)

_EMPTY_SUGGESTIONS: dict[str, Any] = {
    "title_rewrite": None,
    "tag_additions": [],
    "tag_removals": [],
    "description_tips": [],
    "photo_tips": [],
    "priority_actions": [],
}


async def generate_suggestions(
    listing: dict[str, Any],
    dimension_scores: dict[str, float],
) -> dict[str, Any]:
    if not settings.anthropic_api_key:
        return _heuristic_suggestions(listing, dimension_scores)

    low_scoring = {k: v for k, v in dimension_scores.items() if v < 70}
    if not low_scoring:
        return _empty_with_note("All dimensions score above 70 — listing looks strong!")

    prompt = _build_prompt(listing, dimension_scores, low_scoring)

    try:
        import anthropic  # lazy import
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=800,
            system=_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = message.content[0].text.strip()
        if raw.startswith("```"):
            raw = "\n".join(raw.split("\n")[1:]).rsplit("```", 1)[0]
        return json.loads(raw.strip())
    except Exception as exc:
        logger.error("ai_suggestions_failed", error=str(exc))
        return _heuristic_suggestions(listing, dimension_scores)


def _build_prompt(
    listing: dict[str, Any],
    scores: dict[str, float],
    low_scoring: dict[str, float],
) -> str:
    title = listing.get("title") or "(no title)"
    tags = listing.get("tags") or []
    grade = listing.get("overall_grade", "?")
    overall = listing.get("overall_score", 0)

    return f"""Listing to optimise:
Title: {title}
Tags ({len(tags)}): {', '.join(tags[:13])}
Overall grade: {grade} ({overall:.0f}/100)
Low-scoring areas: {json.dumps(low_scoring, indent=2)}
All dimension scores: {json.dumps(scores, indent=2)}

Provide specific improvements. Return ONLY a JSON object — no markdown, no explanation outside JSON:
{{
  "title_rewrite": "improved title here (max 140 chars)" or null,
  "tag_additions": ["new high-value tag 1", "new high-value tag 2"],
  "tag_removals": ["weak or duplicate tag"],
  "description_tips": ["Specific tip 1", "Specific tip 2"],
  "photo_tips": ["Specific photo tip 1"],
  "priority_actions": ["Most impactful action to take first"]
}}"""


def _heuristic_suggestions(
    listing: dict[str, Any],
    scores: dict[str, float],
) -> dict[str, Any]:
    """Rule-based fallback used when Claude is unavailable."""
    tips: dict[str, Any] = {
        "title_rewrite": None,
        "tag_additions": [],
        "tag_removals": [],
        "description_tips": [],
        "photo_tips": [],
        "priority_actions": [],
    }

    title = listing.get("title") or ""
    tags = listing.get("tags") or []
    photos = int(listing.get("photo_count") or 0)

    if scores.get("title", 100) < 70:
        if len(title) < 80:
            tips["priority_actions"].append(
                f"Expand your title to 80-140 characters (currently {len(title)})"
            )
        if len(tags) > 0 and tags[0].lower() not in title.lower():
            tips["title_rewrite"] = f"{tags[0].title()} — {title}"[:140]
            tips["priority_actions"].append("Front-load your top keyword in the title")

    if scores.get("tags", 100) < 70:
        missing = 13 - len(tags)
        if missing > 0:
            tips["tag_additions"] = [f"[Add {missing} more relevant tags to reach 13]"]
            tips["priority_actions"].append(f"Add {missing} more tags — you're leaving {missing} tag slots empty")

    if scores.get("description", 100) < 70:
        tips["description_tips"] = [
            "Add bullet points listing key features and materials",
            "Include care/washing instructions",
            "End with a clear call to action (e.g. 'Message me to customise!')",
        ]
        if not tips["priority_actions"]:
            tips["priority_actions"].append("Expand your description — aim for 500+ words with bullet points")

    if scores.get("photos", 100) < 70:
        if photos < 5:
            tips["photo_tips"].append(f"Add {5 - photos} more photos (you have {photos}, aim for 5-10)")
        tips["photo_tips"].append("Include a lifestyle photo showing your product in use")
        tips["photo_tips"].append("Add a photo showing scale/size next to a common object")

    if scores.get("shipping", 100) < 70:
        tips["priority_actions"].append("Consider offering free shipping — it significantly boosts conversion rate")

    return tips


def _empty_with_note(note: str) -> dict[str, Any]:
    return {**_EMPTY_SUGGESTIONS, "priority_actions": [note]}
