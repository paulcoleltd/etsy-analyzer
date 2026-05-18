from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from elasticsearch import AsyncElasticsearch
from redis.asyncio import Redis

from src.deps import get_es, get_redis
from src.optimiser.title_ai import optimise_title
from src.volume.estimator import estimate_volume

router = APIRouter(prefix="/v1/keywords", tags=["keywords"])


class TitleOptimiseRequest(BaseModel):
    title: str = Field(max_length=200)
    tags: list[str] = Field(default_factory=list, max_length=13)
    category: str = Field(default="")


class TitleOptimiseResponse(BaseModel):
    original_title: str
    optimised_title: str
    explanation: str
    keywords_used: list[str]
    char_count: int


class ClusterRequest(BaseModel):
    keywords: list[str] = Field(min_length=2, max_length=200)


class ClusterResponse(BaseModel):
    clusters: list[dict]
    total_keywords: int
    total_clusters: int


@router.post("/title-optimize", response_model=TitleOptimiseResponse)
async def title_optimise(
    body: TitleOptimiseRequest,
    es: AsyncElasticsearch = Depends(get_es),
    redis: Redis = Depends(get_redis),
):
    # Pull top market keywords for this category/tag set
    market_keywords: list[str] = []
    if body.tags:
        vol = await estimate_volume(body.tags[0], es, redis)
        market_keywords = vol.get("related", [])

    result = await optimise_title(
        original_title=body.title,
        tags=body.tags,
        category=body.category,
        market_keywords=market_keywords,
    )
    return TitleOptimiseResponse(
        original_title=body.title,
        optimised_title=result["title"],
        explanation=result["explanation"],
        keywords_used=result.get("keywords_used", []),
        char_count=len(result["title"]),
    )


@router.post("/cluster", response_model=ClusterResponse)
async def cluster_keywords(body: ClusterRequest):
    from src.clustering.bert_clusterer import cluster_keywords as do_cluster
    clusters = do_cluster(body.keywords)
    return ClusterResponse(
        clusters=clusters,
        total_keywords=len(body.keywords),
        total_clusters=len(clusters),
    )
