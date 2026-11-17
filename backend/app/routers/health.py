"""Tiny endpoint used by health checks and quick manual testing.

A plain dict return value is automatically converted to JSON by FastAPI.

Both paths are registered because infrastructure health checks commonly probe
`/health`, while the application API conventionally lives under `/api`.
"""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
@router.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
