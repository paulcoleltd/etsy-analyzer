from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.deps import get_redis
from src.routers import grade, bulk


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_redis()
    yield
    await get_redis().aclose()


app = FastAPI(title="Grader Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(grade.router)
app.include_router(bulk.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "grader-service"}
