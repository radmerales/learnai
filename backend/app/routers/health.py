"""Health and compatibility endpoints used by probes and manual testing.

FastAPI converts plain dict return values to JSON automatically.
"""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


# Infrastructure health checks commonly probe /health, while the rest of the
# application API lives under /api. Register both paths for compatibility.
@router.get("/health")
@router.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/v1/models")
def list_models() -> dict[str, object]:
    """OpenAI-compatible model listing used by generic AI health probes.

    learn.ai does not host language models. Returning the standard empty list
    keeps probes from treating the service as broken, while remaining truthful
    about the fact that no models are served here.
    """
    return {"object": "list", "data": []}
