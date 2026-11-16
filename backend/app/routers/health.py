"""Tiny endpoint used by health checks and quick manual testing.

A plain dict return value is automatically converted to JSON by FastAPI.
"""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
