from elasticsearch import AsyncElasticsearch
from src.config import settings

_client: AsyncElasticsearch | None = None


def get_es_client() -> AsyncElasticsearch:
    global _client
    if _client is None:
        _client = AsyncElasticsearch(
            [settings.elasticsearch_url],
            retry_on_timeout=True,
            max_retries=3,
        )
    return _client


async def close_es_client() -> None:
    global _client
    if _client:
        await _client.close()
        _client = None
