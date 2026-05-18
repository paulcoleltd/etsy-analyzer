"""
Etsy API v3 client with automatic token refresh.
Reads the encrypted connection from PostgreSQL, decrypts,
and issues requests against the Etsy API.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from src.config import settings
from src.logger import logger

ETSY_TOKEN_URL = "https://api.etsy.com/v3/public/oauth/token"


class EtsyAPIError(Exception):
    def __init__(self, status: int, body: str):
        self.status = status
        self.body = body
        super().__init__(f"Etsy API {status}: {body[:200]}")


class EtsyClient:
    def __init__(self, access_token: str, shop_id: str):
        self._token = access_token
        self.shop_id = shop_id

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(min=1, max=5))
    async def _get(self, path: str, params: dict | None = None) -> Any:
        url = f"{settings.etsy_api_base}{path}"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                url,
                params=params,
                headers={
                    "x-api-key": settings.etsy_api_key,
                    "Authorization": f"Bearer {self._token}",
                },
            )
        if resp.status_code == 429:
            raise EtsyAPIError(429, "Rate limited")
        if not resp.is_success:
            raise EtsyAPIError(resp.status_code, resp.text)
        return resp.json()

    # ── Shop endpoints ────────────────────────────────────────────

    async def get_shop(self) -> dict[str, Any]:
        return await self._get(f"/application/shops/{self.shop_id}")

    async def get_transactions(
        self,
        limit: int = 100,
        offset: int = 0,
    ) -> dict[str, Any]:
        return await self._get(
            f"/application/shops/{self.shop_id}/transactions",
            params={"limit": limit, "offset": offset},
        )

    async def get_listings(
        self,
        state: str = "active",
        limit: int = 100,
        offset: int = 0,
    ) -> dict[str, Any]:
        return await self._get(
            f"/application/shops/{self.shop_id}/listings/{state}",
            params={"limit": limit, "offset": offset, "includes": ["Images", "Videos"]},
        )

    async def get_listing_stats(self, listing_id: str) -> dict[str, Any]:
        return await self._get(
            f"/application/shops/{self.shop_id}/listings/{listing_id}/stats"
        )

    async def get_shop_stats(self) -> dict[str, Any]:
        return await self._get(f"/application/shops/{self.shop_id}/stats")


async def build_client_for_user(user_id: str) -> EtsyClient | None:
    """Load and decrypt the stored Etsy connection for a user."""
    import asyncpg
    pool = await asyncpg.create_pool(settings.database_url, min_size=1, max_size=3)
    try:
        row = await pool.fetchrow(
            """SELECT access_token, token_iv, token_tag, etsy_shop_id, expires_at
               FROM etsy_connections WHERE user_id = $1""",
            user_id,
        )
    finally:
        await pool.close()

    if not row:
        return None

    expires_at: datetime = row["expires_at"]
    if expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        logger.warning("etsy_token_expired", user_id=user_id)
        return None  # Token refresh is handled by auth-service

    try:
        from src.etsy.token_crypto import decrypt_token
        access_token = decrypt_token(
            row["access_token"],
            row["token_iv"],
            row["token_tag"],
        )
    except Exception as exc:
        logger.error("token_decrypt_failed", user_id=user_id, error=str(exc))
        return None

    return EtsyClient(access_token=access_token, shop_id=row["etsy_shop_id"])
