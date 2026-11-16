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
    return f"mm_{secrets.token_hex(8)}"


def find_mindmap(db: Session, mindmap_id: str) -> Mindmap:
    mindmap = db.get(Mindmap, mindmap_id)
    if mindmap is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mindmap not found")
    return mindmap


@router.get("", response_model=list[MindmapSummary])
def list_mindmaps(db: DbSession) -> list[MindmapSummary]:
    mindmaps = db.scalars(select(Mindmap).order_by(Mindmap.updated_at.desc())).all()
    return [to_summary(mindmap) for mindmap in mindmaps]


@router.post("", response_model=MindmapResource, status_code=status.HTTP_201_CREATED)
def create_mindmap(
    db: DbSession,
    payload: MindmapWrite | None = None,
) -> MindmapResource:
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
    db.refresh(mindmap)
    return to_resource(mindmap)


@router.get("/{mindmap_id}", response_model=MindmapResource)
def get_mindmap(mindmap_id: str, db: DbSession) -> MindmapResource:
    return to_resource(find_mindmap(db, mindmap_id))


@router.put("/{mindmap_id}", response_model=MindmapResource)
def replace_mindmap(
    mindmap_id: str,
    payload: MindmapWrite,
    db: DbSession,
) -> MindmapResource:
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
    mindmap = find_mindmap(db, mindmap_id)
    db.delete(mindmap)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
