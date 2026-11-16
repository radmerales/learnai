"""Pydantic models for the JSON document.

Pydantic is the runtime validation layer. A Python type hint alone (or a
TypeScript type) is not checked when JSON arrives over HTTP, so these models
reject malformed data before it reaches the database.

The API uses camelCase keys (`answerIndex`, `fromSide`, `schemaVersion`) to
match TypeScript. Python attributes stay snake_case; `alias` maps between them.
"""

import math
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

SCHEMA_VERSION = 1
MAX_NODES = 2_000
MAX_LINKS = 5_000
MAX_BLOCKS = 200
MAX_QUESTIONS = 200
MAX_OPTIONS = 8

# Literal = "one of these exact strings". This is similar to an Enum but is
# represented directly as a string in JSON.
Side = Literal["top", "right", "bottom", "left"]
NoteStatus = Literal["todo", "doing", "done"]

# Annotated adds validation rules to a normal Python type.
Identifier = Annotated[str, Field(min_length=1, max_length=64)]
Label = Annotated[str, Field(max_length=300)]
MarkdownBlock = Annotated[str, Field(max_length=50_000)]
QuestionPrompt = Annotated[str, Field(max_length=4_000)]
AnswerText = Annotated[str, Field(max_length=1_000)]


class ApiModel(BaseModel):
    # populate_by_name lets Python code use snake_case attributes while JSON
    # uses the camelCase aliases. extra="forbid" rejects unknown keys, which
    # catches typos early instead of silently dropping data.
    model_config = ConfigDict(populate_by_name=True, extra="forbid")


class QuizQuestion(ApiModel):
    id: Identifier
    prompt: QuestionPrompt = ""
    options: list[AnswerText] = Field(min_length=2, max_length=MAX_OPTIONS)
    answer_index: int = Field(alias="answerIndex", ge=0)

    @model_validator(mode="after")
    def answer_must_be_an_option(self) -> "QuizQuestion":
        """Cross-field rule: Pydantic runs this after individual fields parse."""
        if self.answer_index >= len(self.options):
            raise ValueError("answerIndex must point at one of the options")
        return self


class LearnContent(ApiModel):
    """The Learn tab: ordered markdown blocks."""

    blocks: list[MarkdownBlock] = Field(default_factory=list, max_length=MAX_BLOCKS)


class QuizContent(ApiModel):
    """The Quiz tab: all multiple-choice questions for one node."""

    questions: list[QuizQuestion] = Field(default_factory=list, max_length=MAX_QUESTIONS)

    @model_validator(mode="after")
    def question_ids_must_be_unique(self) -> "QuizContent":
        ids = [question.id for question in self.questions]
        if len(set(ids)) != len(ids):
            raise ValueError("question ids must be unique within a node")
        return self


class MindmapNode(ApiModel):
    id: Identifier
    label: Label = ""
    status: NoteStatus = "todo"
    x: float
    y: float
    width: float = Field(ge=40, le=5_000)
    learn: LearnContent = Field(default_factory=LearnContent)
    quiz: QuizContent = Field(default_factory=QuizContent)

    @model_validator(mode="after")
    def coordinates_must_be_finite(self) -> "MindmapNode":
        if not math.isfinite(self.x) or not math.isfinite(self.y):
            raise ValueError("node coordinates must be finite")
        return self


class MindmapLink(ApiModel):
    id: Identifier
    # `from` is a Python keyword, so the attribute is from_node and the JSON
    # alias keeps the public field name "from".
    from_node: Identifier = Field(alias="from")
    to: Identifier
    from_side: Side = Field(alias="fromSide")
    to_side: Side = Field(alias="toSide")


class MindmapWrite(ApiModel):
    """What the browser sends on POST (create) and PUT (replace)."""

    schema_version: Literal[1] = Field(default=SCHEMA_VERSION, alias="schemaVersion")
    title: str = Field(default="Untitled mindmap", min_length=1, max_length=200)
    nodes: list[MindmapNode] = Field(default_factory=list, max_length=MAX_NODES)
    links: list[MindmapLink] = Field(default_factory=list, max_length=MAX_LINKS)

    @model_validator(mode="after")
    def graph_must_be_consistent(self) -> "MindmapWrite":
        """Rules that involve more than one node/link at a time."""
        node_ids = [node.id for node in self.nodes]
        if len(set(node_ids)) != len(node_ids):
            raise ValueError("node ids must be unique")

        link_ids = [link.id for link in self.links]
        if len(set(link_ids)) != len(link_ids):
            raise ValueError("link ids must be unique")

        known_nodes = set(node_ids)
        pairs: set[frozenset[str]] = set()
        for link in self.links:
            if link.from_node not in known_nodes:
                raise ValueError(f"link {link.id} starts at an unknown node")
            if link.to not in known_nodes:
                raise ValueError(f"link {link.id} ends at an unknown node")
            if link.from_node == link.to:
                raise ValueError(f"link {link.id} cannot connect a node to itself")
            pair = frozenset((link.from_node, link.to))
            if pair in pairs:
                raise ValueError(f"link {link.id} duplicates an existing connection")
            pairs.add(pair)

        return self


class MindmapResource(MindmapWrite):
    """A stored map: the write fields plus server-generated metadata."""

    id: Identifier
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")


class MindmapSummary(ApiModel):
    """A lightweight row for the map picker (no nodes/links)."""

    id: Identifier
    title: str
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")
