from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.deps import get_es, get_redis
from src.routers import search, niche, listing, shop, trending
from src.errors import register_error_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):
    # warm connections on startup — ES may not be running locally; that's OK
    try:
        get_es()
    except Exception:
        pass
    try:
        get_redis()
    except Exception:
        pass
    yield
    try:
        await get_es().close()
    except Exception:
        pass
    try:
        await get_redis().aclose()
    except Exception:
        pass


app = FastAPI(
    title="Research Service",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

register_error_handlers(app)

app.include_router(search.router)
app.include_router(niche.router)
app.include_router(listing.router)
app.include_router(shop.router)
app.include_router(trending.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "research-service"}
