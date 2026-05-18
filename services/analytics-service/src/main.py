from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routers import overview, revenue, listings, sync


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Analytics Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(overview.router)
app.include_router(revenue.router)
app.include_router(listings.router)
app.include_router(sync.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "analytics-service"}
