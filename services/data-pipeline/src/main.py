"""
Data pipeline entry-point.

Modes (set via DATA_PIPELINE_MODE env var):
  worker   — run the job polling worker (default)
  seed     — enqueue initial seed scrapes and exit
  index    — ensure ES indices exist and exit
"""
import asyncio
import os

from src.indexer import ensure_indices
from src.jobs import run_worker, seed_initial_scrapes, schedule_recurring_jobs
from src.logger import logger


async def main() -> None:
    mode = os.getenv("DATA_PIPELINE_MODE", "worker")
    logger.info("pipeline_starting", mode=mode)

    await ensure_indices()

    if mode == "seed":
        await seed_initial_scrapes()
        await schedule_recurring_jobs()
        logger.info("seed_complete")
    elif mode == "index":
        logger.info("index_setup_complete")
    else:
        await run_worker()


if __name__ == "__main__":
    asyncio.run(main())
