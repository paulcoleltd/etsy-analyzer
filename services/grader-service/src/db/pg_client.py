import asyncpg
from src.config import settings

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(settings.database_url, min_size=2, max_size=10)
    return _pool


_SAVE_GRADE_SQL = """
INSERT INTO listing_grades (
    user_id, etsy_listing_id, overall_grade,
    title_score, tag_score, description_score,
    photo_score, price_score, shipping_score,
    ai_suggestions, image_analysis
)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
RETURNING id, graded_at
"""


async def save_grade(
    user_id: str | None,
    etsy_listing_id: str,
    grade_result: dict,
) -> dict:
    pool = await get_pool()
    import json
    dims = grade_result["dimension_scores"]
    row = await pool.fetchrow(
        _SAVE_GRADE_SQL,
        user_id,
        etsy_listing_id,
        grade_result["overall_grade"],
        dims["title"],
        dims["tags"],
        dims["description"],
        dims["photos"],
        dims["price"],
        dims["shipping"],
        json.dumps(grade_result.get("ai_suggestions")),
        json.dumps(grade_result.get("image_analysis")),
    )
    return {"id": str(row["id"]), "graded_at": row["graded_at"].isoformat()}


async def fetch_grade_history(user_id: str, listing_id: str | None = None) -> list[dict]:
    pool = await get_pool()
    if listing_id:
        rows = await pool.fetch(
            "SELECT * FROM listing_grades WHERE user_id=$1 AND etsy_listing_id=$2 ORDER BY graded_at DESC LIMIT 10",
            user_id, listing_id,
        )
    else:
        rows = await pool.fetch(
            "SELECT * FROM listing_grades WHERE user_id=$1 ORDER BY graded_at DESC LIMIT 50",
            user_id,
        )
    return [dict(r) for r in rows]
