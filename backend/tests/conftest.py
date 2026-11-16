"""Shared pytest setup.

The database URL must be set *before* importing app modules, because
`database.py` creates the SQLAlchemy engine at import time. pytest imports
conftest.py first, so this is the right place to redirect the tests to a
temporary SQLite file.

Fixtures are pytest's dependency-injection mechanism: a test that asks for
`client` gets a fresh FastAPI test client.
"""

import os
import tempfile
from pathlib import Path

import pytest

TEST_DB = Path(tempfile.mkdtemp()) / "test.db"
os.environ["LEARN_AI_DATABASE_URL"] = f"sqlite:///{TEST_DB}"

from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app


@pytest.fixture(autouse=True)
def reset_database():
    """Give every test an empty schema, even if an earlier test failed."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    """TestClient runs FastAPI in-process, so no network server is needed."""
    with TestClient(app) as test_client:
        yield test_client
