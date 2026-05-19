"""
Lightweight JWT-based auth helper for the analytics service.

Extracts the user ID either from:
  1. The x-user-id header (set by the web client after decoding the JWT)
  2. The Authorization: Bearer <token> header (fallback — decodes without verification)

In production, full JWT signature verification would use the shared JWT_SECRET.
For local dev the decode-only path is sufficient since services run on localhost.
"""
from __future__ import annotations

import base64
import json
import os
from typing import Optional

from fastapi import Header, HTTPException


def _decode_jwt_payload(token: str) -> dict:
    """Decode a JWT payload without signature verification."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return {}
        # Add padding if needed
        payload_b64 = parts[1] + "=" * (-len(parts[1]) % 4)
        decoded = base64.urlsafe_b64decode(payload_b64)
        return json.loads(decoded)
    except Exception:
        return {}


def get_user_id(
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
) -> str:
    """
    FastAPI dependency — returns the authenticated user's UUID.
    Raises 401 if user cannot be identified.
    """
    # Primary: explicit header set by the web client
    if x_user_id:
        return x_user_id

    # Fallback: decode the Bearer token
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        payload = _decode_jwt_payload(token)
        sub = payload.get("sub") or payload.get("userId")
        if sub:
            return str(sub)

    raise HTTPException(status_code=401, detail="Authentication required")
