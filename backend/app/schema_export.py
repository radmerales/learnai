"""Generate the checked-in JSON Schema from the Pydantic models.

Run from backend/:
    ../.venv/bin/python -m app.schema_export

A JSON Schema is a machine-readable description of a JSON document. Keeping it
generated from the same models that validate requests prevents documentation
and implementation from drifting apart.
"""

import json
from pathlib import Path

from .schemas import MindmapResource

SCHEMA_PATH = Path(__file__).resolve().parents[2] / "docs" / "mindmap.schema.json"


def build_schema() -> dict:
    schema = MindmapResource.model_json_schema(by_alias=True)
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "Mindmap document (v1)",
        **schema,
    }


def render_schema() -> str:
    # sort_keys makes the generated file deterministic, so CI/tests can compare
    # it byte-for-byte.
    return json.dumps(build_schema(), indent=2, sort_keys=True) + "\n"


def main() -> None:
    SCHEMA_PATH.parent.mkdir(parents=True, exist_ok=True)
    SCHEMA_PATH.write_text(render_schema(), encoding="utf-8")
    print(f"Wrote {SCHEMA_PATH}")


if __name__ == "__main__":
    main()
