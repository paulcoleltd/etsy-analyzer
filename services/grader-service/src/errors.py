"""
Shared error handling for FastAPI services.
Registers exception handlers that return the standard error envelope:
  { error, message, request_id, timestamp }
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


def _envelope(error: str, message: str, status_code: int, request_id: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": error,
            "message": message,
            "request_id": request_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(req: Request, exc: RequestValidationError) -> JSONResponse:
        rid = req.headers.get("x-request-id", str(uuid.uuid4()))
        details = [
            {"field": ".".join(str(loc) for loc in e["loc"]), "msg": e["msg"]}
            for e in exc.errors()
        ]
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "validation_error",
                "message": "Request validation failed.",
                "details": details,
                "request_id": rid,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_error_handler(req: Request, exc: StarletteHTTPException) -> JSONResponse:
        rid = req.headers.get("x-request-id", str(uuid.uuid4()))
        return _envelope(
            error=str(exc.status_code),
            message=exc.detail or "An error occurred.",
            status_code=exc.status_code,
            request_id=rid,
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(req: Request, exc: Exception) -> JSONResponse:
        rid = req.headers.get("x-request-id", str(uuid.uuid4()))
        # Log but never expose internals
        import structlog
        log = structlog.get_logger()
        log.error("unhandled_exception", path=req.url.path, error=str(exc))
        return _envelope(
            error="internal_server_error",
            message="An unexpected error occurred.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            request_id=rid,
        )
