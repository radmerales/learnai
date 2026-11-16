"""Database setup.

SQLAlchemy is an ORM (object-relational mapper): Python classes/objects map to
SQL tables/rows. The `engine` knows how to talk to SQLite. A `Session` is the
unit of work for one request — it tracks changes and commits them in a
transaction, similar to a database cursor with extra bookkeeping.
"""

from collections.abc import Generator
from typing import Any

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import get_settings


class Base(DeclarativeBase):
    """Base class that collects table definitions (see models.py)."""


settings = get_settings()

# FastAPI may handle one request on a different thread than another. SQLite by
# default forbids sharing a connection across threads, so we relax that check.
connect_args: dict[str, Any] = (
    {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
)
engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: open one session per request and close it afterwards.

    The `with` block guarantees cleanup even when a route raises an exception.
    """
    with SessionLocal() as session:
        yield session
