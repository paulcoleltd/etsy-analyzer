from fastapi import APIRouter, Depends, Query, HTTPException
from elasticsearch import AsyncElasticsearch
from redis.asyncio import Redis
from pydantic import BaseModel

from src.deps import get_es, get_redis
from src.volume.estimator import estimate_volume

router = APIRouter(prefix="/v1/keywords", tags=["keywords"])


class TagScore(BaseModel):
    tag: str
    volume_est: int
    competition: str
    in_title: bool


class TagAnalysis(BaseModel):
    etsy_listing_id: str
    title: str | None
    tags: list[str]
    tag_scores: list[TagScore]
    missing_high_value_tags: list[str]
    tag_count: int
    max_tags: int = 13


@router.get("/tags", response_model=TagAnalysis)
async def analyse_tags(
    listing_id: str = Query(alias="listing_id"),
    es: AsyncElasticsearch = Depends(get_es),
    redis: Redis = Depends(get_redis),
):
    resp = await es.search(
        index="listings",
        query={"term": {"etsy_listing_id": listing_id}},
        size=1,
    )
    hits = resp["hits"]["hits"]
    if not hits:
        raise HTTPException(status_code=404, detail="Listing not found")

    src = hits[0]["_source"]
    tags: list[str] = src.get("tags") or []
    title: str = src.get("title") or ""

    tag_scores: list[TagScore] = []
    for tag in tags[:13]:
        vol_data = await estimate_volume(tag, es, redis)
        tag_scores.append(TagScore(
            tag=tag,
            volume_est=vol_data["volume_est"],
            competition=vol_data["competition"],
            in_title=tag.lower() in title.lower(),
        ))

    # Sort by volume descending
    tag_scores.sort(key=lambda t: t.volume_est, reverse=True)

    # Find high-value related tags not currently used
    used = {t.tag.lower() for t in tag_scores}
    if tag_scores:
        top_tag = tag_scores[0].tag
        vol_data = await estimate_volume(top_tag, es, redis)
        missing = [r for r in vol_data["related"] if r.lower() not in used][:5]
    else:
        missing = []

    return TagAnalysis(
        etsy_listing_id=listing_id,
        title=title,
        tags=tags,
        tag_scores=tag_scores,
        missing_high_value_tags=missing,
        tag_count=len(tags),
    )
