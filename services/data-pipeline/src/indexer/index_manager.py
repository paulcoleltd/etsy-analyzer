"""Creates / updates Elasticsearch index mappings."""
from src.indexer.es_client import get_es_client
from src.indexer.mappings import (
    LISTINGS_INDEX, LISTINGS_MAPPING,
    KEYWORDS_INDEX, KEYWORDS_MAPPING,
)
from src.logger import logger


async def ensure_indices() -> None:
    es = get_es_client()

    for index, mapping in [
        (LISTINGS_INDEX, LISTINGS_MAPPING),
        (KEYWORDS_INDEX, KEYWORDS_MAPPING),
    ]:
        exists = await es.indices.exists(index=index)
        if not exists:
            await es.indices.create(index=index, body=mapping)
            logger.info("es_index_created", index=index)
        else:
            # Update mappings in case new fields were added
            await es.indices.put_mapping(index=index, body=mapping["mappings"])
            logger.info("es_index_updated", index=index)
