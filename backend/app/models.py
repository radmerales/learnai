"""SQLAlchemy table definitions.

The whole mindmap is stored in one JSON column. That matches the API: the
browser sends and receives a complete document, not individual rows. Keeping
the document intact also means Learn blocks and Quiz questions can evolve
without a database migration for every field.
"""

from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


def utcnow() -> datetime:
    """Timezone-aware UTC timestamp; the API converts it to ISO-8601 text."""
    return datetime.now(UTC)


class Mindmap(Base):
    __tablename__ = "mindmaps"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    # `document` contains {"nodes": [...], "links": [...]}. SQLite stores it as
    # text internally; SQLAlchemy converts it to/from Python dict/list values.
    document: Mapped[dict] = mapped_column(JSON, nullable=False)
    schema_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )
