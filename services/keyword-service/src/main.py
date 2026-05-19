from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.deps import get_es, get_redis
from src.routers import explore, tags, optimise, trends
from src.errors import register_error_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):
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


app = FastAPI(title="Keyword Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

register_error_handlers(app)

app.include_router(explore.router)
app.include_router(tags.router)
app.include_router(optimise.router)
app.include_router(trends.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "keyword-service"}
