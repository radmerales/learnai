"""FastAPI application entry point.

Start it with:
    cd backend
    ../.venv/bin/uvicorn app.main:app --reload --port 8000

Uvicorn is the web server; FastAPI is the framework that maps URLs to Python
functions. `--reload` restarts the server when source files change.
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  (registers the table on Base.metadata)
from .config import get_settings
from .database import Base, engine
from .routers import health, mindmaps


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Runs once when the server starts; creates missing tables.

    This is a lightweight alternative to a migration tool for the first
    version. If the table schema changes later, add Alembic migrations.
    """
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="learn.ai API", version="1.0.0", lifespan=lifespan)

# CORS lets a browser on a different origin (e.g. localhost:5173) call this
# API directly. During development Vite proxies /api, so this is a safety net.
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(mindmaps.router)
