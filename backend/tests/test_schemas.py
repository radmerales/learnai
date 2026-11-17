import pytest
from pydantic import ValidationError

from app import schema_export
from app.schemas import MindmapNode, MindmapWrite


def node(node_id: str, x: float = 10, y: float = 10) -> dict:
    return {"id": node_id, "label": node_id, "x": x, "y": y, "width": 140}


def write_document(links: list[dict]) -> dict:
    return {
        "schemaVersion": 1,
        "title": "Validation",
        "nodes": [node("a"), node("b")],
        "links": links,
    }


def test_rejects_non_finite_coordinates():
    with pytest.raises(ValidationError, match="coordinates must be finite"):
        MindmapNode.model_validate(node("a", float("nan"), 10))


def test_rejects_duplicate_link_ids():
    link = {"id": "l1", "from": "a", "to": "b", "fromSide": "right", "toSide": "left"}

    with pytest.raises(ValidationError, match="link ids must be unique"):
        MindmapWrite.model_validate(write_document([link, link]))


def test_rejects_duplicate_connections():
    first = {"id": "l1", "from": "a", "to": "b", "fromSide": "right", "toSide": "left"}
    second = {"id": "l2", "from": "b", "to": "a", "fromSide": "left", "toSide": "right"}

    with pytest.raises(ValidationError, match="duplicates an existing connection"):
        MindmapWrite.model_validate(write_document([first, second]))


def test_schema_export_writes_a_deterministic_file(tmp_path, monkeypatch, capsys):
    target = tmp_path / "nested" / "mindmap.schema.json"
    monkeypatch.setattr(schema_export, "SCHEMA_PATH", target)

    schema_export.main()

    assert target.exists()
    assert "Mindmap document (v1)" in target.read_text(encoding="utf-8")
    assert "Wrote" in capsys.readouterr().out
