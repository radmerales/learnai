"""Convert between SQLAlchemy rows and API models.

These helpers keep database details out of the route functions. The stored JSON
contains only nodes and links; title/schema version/timestamps live in table
columns, and this module composes the complete API response.
"""

from datetime import UTC, datetime

from .models import Mindmap
from .schemas import MindmapResource, MindmapSummary, MindmapWrite


def utc_iso(value: datetime) -> str:
    """Return an ISO-8601 UTC string with a `Z` suffix, e.g. 2026-01-01T...Z.

    SQLite may return a naive datetime (no timezone). Treat that as UTC, which
    is how `utcnow()` wrote it.
    """
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.astimezone(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def to_document(mindmap: Mindmap) -> MindmapWrite:
    """Database row -> validated document model."""
    return MindmapWrite.model_validate(
        {
            "schemaVersion": mindmap.schema_version,
            "title": mindmap.title,
            **mindmap.document,
        }
    )


def to_resource(mindmap: Mindmap) -> MindmapResource:
    """Database row -> complete API response."""
    document = to_document(mindmap)
    return MindmapResource(
        schemaVersion=document.schema_version,
        id=mindmap.id,
        title=mindmap.title,
        createdAt=utc_iso(mindmap.created_at),
        updatedAt=utc_iso(mindmap.updated_at),
        nodes=document.nodes,
        links=document.links,
    )


def to_summary(mindmap: Mindmap) -> MindmapSummary:
    """Database row -> map-picker row."""
    return MindmapSummary(
        id=mindmap.id,
        title=mindmap.title,
        createdAt=utc_iso(mindmap.created_at),
        updatedAt=utc_iso(mindmap.updated_at),
    )


def store_document(document: MindmapWrite) -> dict:
    """Validated model -> plain JSON-compatible dict for the JSON column."""
    return document.model_dump(by_alias=True, mode="json", include={"nodes", "links"})
