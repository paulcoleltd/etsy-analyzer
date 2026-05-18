"""POST /v1/dashboard/sync — trigger manual Etsy sync."""
from fastapi import APIRouter, Header, HTTPException, BackgroundTasks
from src.etsy.sync import sync_user_data

router = APIRouter(prefix="/v1/dashboard", tags=["dashboard"])


@router.post("/sync")
async def trigger_sync(
    background_tasks: BackgroundTasks,
    x_user_id: str | None = Header(default=None),
):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    background_tasks.add_task(sync_user_data, x_user_id)
    return {"status": "sync_queued", "user_id": x_user_id}
