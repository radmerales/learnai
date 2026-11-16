from datetime import UTC, datetime

from .models import Mindmap
from .schemas import MindmapResource, MindmapSummary, MindmapWrite


def utc_iso(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.astimezone(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def to_document(mindmap: Mindmap) -> MindmapWrite:
    return MindmapWrite.model_validate(
        {
            "schemaVersion": mindmap.schema_version,
            "title": mindmap.title,
            **mindmap.document,
        }
    )


def to_resource(mindmap: Mindmap) -> MindmapResource:
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
    return MindmapSummary(
        id=mindmap.id,
        title=mindmap.title,
        createdAt=utc_iso(mindmap.created_at),
        updatedAt=utc_iso(mindmap.updated_at),
    )


def store_document(document: MindmapWrite) -> dict:
    return document.model_dump(by_alias=True, mode="json", include={"nodes", "links"})
