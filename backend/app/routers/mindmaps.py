"""HTTP routes for saved mindmaps.

Web crash course:
- `@router.get` / `post` / `put` / `delete` map a URL + HTTP method to a
  Python function.
- The browser sends JSON; FastAPI parses it into the Pydantic models below.
- Status codes matter: 200 = OK, 201 = created, 204 = success/no body,
  404 = not found, 422 = validation error.
- `Depends(get_db)` is dependency injection: FastAPI creates one database
  session per request and passes it in.
"""

import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..documents import store_document, to_resource, to_summary
from ..models import Mindmap, utcnow
from ..schemas import MindmapResource, MindmapSummary, MindmapWrite

router = APIRouter(prefix="/api/mindmaps", tags=["mindmaps"])
DbSession = Annotated[Session, Depends(get_db)]


def new_mindmap_id() -> str:
    """Random opaque ID; safe to expose in URLs and unguessable."""
    return f"mm_{secrets.token_hex(8)}"


def find_mindmap(db: Session, mindmap_id: str) -> Mindmap:
    """Fetch by primary key or stop the request with HTTP 404."""
    mindmap = db.get(Mindmap, mindmap_id)
    if mindmap is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mindmap not found")
    return mindmap


@router.get("", response_model=list[MindmapSummary])
def list_mindmaps(db: DbSession) -> list[MindmapSummary]:
    """Newest-updated maps first, for the header picker."""
    mindmaps = db.scalars(select(Mindmap).order_by(Mindmap.updated_at.desc())).all()
    return [to_summary(mindmap) for mindmap in mindmaps]


@router.post("", response_model=MindmapResource, status_code=status.HTTP_201_CREATED)
def create_mindmap(
    db: DbSession,
    payload: MindmapWrite | None = None,
) -> MindmapResource:
    """Create a map. An empty request body produces an empty "Untitled" map."""
    document = payload or MindmapWrite()
    now = utcnow()
    mindmap = Mindmap(
        id=new_mindmap_id(),
        title=document.title,
        document=store_document(document),
        schema_version=document.schema_version,
        created_at=now,
        updated_at=now,
    )
    db.add(mindmap)
    db.commit()
    db.refresh(mindmap)  # read back database defaults/generated values
    return to_resource(mindmap)


@router.get("/{mindmap_id}", response_model=MindmapResource)
def get_mindmap(mindmap_id: str, db: DbSession) -> MindmapResource:
    """Load one complete map, including Learn blocks and Quiz questions."""
    return to_resource(find_mindmap(db, mindmap_id))


@router.put("/{mindmap_id}", response_model=MindmapResource)
def replace_mindmap(
    mindmap_id: str,
    payload: MindmapWrite,
    db: DbSession,
) -> MindmapResource:
    """Replace the whole document. This is the endpoint used by autosave."""
    mindmap = find_mindmap(db, mindmap_id)
    mindmap.title = payload.title
    mindmap.document = store_document(payload)
    mindmap.schema_version = payload.schema_version
    mindmap.updated_at = utcnow()
    db.commit()
    db.refresh(mindmap)
    return to_resource(mindmap)


@router.delete("/{mindmap_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mindmap(mindmap_id: str, db: DbSession) -> Response:
    """Delete a map permanently. 204 means success with no response body."""
    mindmap = find_mindmap(db, mindmap_id)
    db.delete(mindmap)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
