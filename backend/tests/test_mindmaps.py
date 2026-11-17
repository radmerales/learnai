"""HTTP-level tests for the mindmap API.

Each test uses the `client` fixture from conftest.py. `pytest.mark.parametrize`
runs the same test once per invalid mutation, which keeps validation coverage
compact.
"""

import copy
import json
from pathlib import Path

import pytest

from app.schema_export import SCHEMA_PATH, render_schema
from app.schemas import MindmapResource

EXAMPLE_PATH = Path(__file__).resolve().parents[1] / "examples" / "mindmap.json"


def sample_document() -> dict:
    return {
        "schemaVersion": 1,
        "title": "Biology review",
        "nodes": [
            {
                "id": "n_1",
                "label": "Cell respiration",
                "status": "doing",
                "x": 420,
                "y": 220,
                "width": 168,
                "learn": {"blocks": ["## Overview\n\nGlycolysis.", "- ATP"]},
                "quiz": {
                    "questions": [
                        {
                            "id": "q_1",
                            "prompt": "Where does glycolysis take place?",
                            "options": ["Cytosol", "Mitochondria", "Nucleus", "Golgi"],
                            "answerIndex": 0,
                        }
                    ]
                },
            },
            {
                "id": "n_2",
                "label": "Krebs cycle",
                "status": "todo",
                "x": 700,
                "y": 220,
                "width": 140,
                "learn": {"blocks": [""]},
                "quiz": {"questions": []},
            },
        ],
        "links": [
            {
                "id": "l_1",
                "from": "n_1",
                "to": "n_2",
                "fromSide": "right",
                "toSide": "left",
            }
        ],
    }


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

    # Some infrastructure probes use the unprefixed path.
    alias = client.get("/health")
    assert alias.status_code == 200
    assert alias.json() == {"status": "ok"}


def test_create_list_get_update_delete(client):
    created = client.post("/api/mindmaps", json=sample_document())
    assert created.status_code == 201
    resource = created.json()

    assert resource["schemaVersion"] == 1
    assert resource["title"] == "Biology review"
    assert resource["id"].startswith("mm_")
    assert resource["createdAt"].endswith("Z")
    assert resource["nodes"][0]["learn"]["blocks"][0].startswith("## Overview")
    assert resource["nodes"][0]["quiz"]["questions"][0]["answerIndex"] == 0

    fetched = client.get(f"/api/mindmaps/{resource['id']}")
    assert fetched.status_code == 200
    assert fetched.json() == resource

    listed = client.get("/api/mindmaps")
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()] == [resource["id"]]

    updated_payload = copy.deepcopy(sample_document())
    updated_payload["title"] = "Updated review"
    updated_payload["nodes"][0]["x"] = 500
    updated_payload["nodes"][0]["quiz"]["questions"][0]["prompt"] = "Updated prompt?"
    updated_payload["nodes"][0]["quiz"]["questions"][0]["answerIndex"] = 1

    updated = client.put(f"/api/mindmaps/{resource['id']}", json=updated_payload)
    assert updated.status_code == 200
    updated_resource = updated.json()
    assert updated_resource["title"] == "Updated review"
    assert updated_resource["nodes"][0]["x"] == 500
    assert updated_resource["nodes"][0]["quiz"]["questions"][0]["prompt"] == "Updated prompt?"
    assert updated_resource["nodes"][0]["quiz"]["questions"][0]["answerIndex"] == 1

    deleted = client.delete(f"/api/mindmaps/{resource['id']}")
    assert deleted.status_code == 204
    assert client.get(f"/api/mindmaps/{resource['id']}").status_code == 404
    assert client.get("/api/mindmaps").json() == []


def test_create_with_empty_body(client):
    response = client.post("/api/mindmaps")
    assert response.status_code == 201
    resource = response.json()
    assert resource["title"] == "Untitled mindmap"
    assert resource["nodes"] == []
    assert resource["links"] == []


def test_lists_multiple_maps(client):
    first = client.post("/api/mindmaps", json={"title": "First"}).json()
    second = client.post("/api/mindmaps", json={"title": "Second"}).json()

    response = client.get("/api/mindmaps")

    assert response.status_code == 200
    assert {item["id"] for item in response.json()} == {first["id"], second["id"]}


def test_rejects_duplicate_question_ids(client):
    payload = sample_document()
    payload["nodes"][0]["quiz"]["questions"].append(
        {
            "id": "q_1",
            "prompt": "Duplicate id?",
            "options": ["A", "B"],
            "answerIndex": 0,
        }
    )

    assert client.post("/api/mindmaps", json=payload).status_code == 422


def test_missing_mindmap_returns_404(client):
    assert client.get("/api/mindmaps/missing").status_code == 404
    assert client.put("/api/mindmaps/missing", json=sample_document()).status_code == 404
    assert client.delete("/api/mindmaps/missing").status_code == 404


@pytest.mark.parametrize(
    "mutate",
    [
        lambda doc: doc["nodes"][0]["quiz"]["questions"][0].update({"answerIndex": 99}),
        lambda doc: doc["links"][0].update({"to": "unknown"}),
        lambda doc: doc["nodes"][1].update({"id": "n_1"}),
        lambda doc: doc.update({"schemaVersion": 2}),
        lambda doc: doc["links"][0].update({"fromSide": "middle"}),
        lambda doc: doc["links"][0].update({"to": "n_1"}),
    ],
)
def test_rejects_invalid_documents(client, mutate):
    payload = sample_document()
    mutate(payload)
    response = client.post("/api/mindmaps", json=payload)
    assert response.status_code == 422


def test_document_json_schema_matches_models():
    assert SCHEMA_PATH.exists(), "run `python -m app.schema_export` from backend/"
    assert SCHEMA_PATH.read_text(encoding="utf-8") == render_schema()


def test_example_document_is_valid():
    data = json.loads(EXAMPLE_PATH.read_text(encoding="utf-8"))
    resource = MindmapResource.model_validate(data)
    assert resource.id == "mm_7f3a9c2e"
    assert resource.nodes[0].learn.blocks
    assert resource.nodes[0].quiz.questions[0].answer_index == 0
