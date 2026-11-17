# learn.ai

learn.ai is a small visual study workspace. You build a mindmap of topics, write
markdown notes for each topic in the **Learn** tab, and author multiple-choice
questions in the **Quiz** tab. Maps are saved to a Python backend, so refreshing
the page does not lose your work.

The project is intentionally small, but it is a complete full-stack app: a
React/TypeScript frontend, a FastAPI/Python backend, a SQLite database, unit and
component tests, and a documented JSON format.

## Start here: web terms for Python developers

If you know Python but not web development, these are the ideas the code uses:

| Web term | Python comparison |
| --- | --- |
| **Frontend** | Code that runs in the browser. Here: React + TypeScript. |
| **Backend** | Code that runs on a server. Here: FastAPI + Python. |
| **HTTP API** | Functions exposed over URLs. `GET /api/mindmaps` is like calling `list_mindmaps()`, but over the network. |
| **JSON** | A text format for nested dict/list data. Roughly `json.loads` / `json.dumps`, but every language understands it. |
| **Endpoint** | One URL + HTTP method (`GET`, `POST`, `PUT`, `DELETE`). |
| **React component** | A function that returns UI. Props are arguments; state is data that can trigger a re-render. |
| **Hook** | A reusable function starting with `use` that lets components share stateful behavior. |
| **TypeScript type** | Like a Python `TypedDict` for the editor. It is erased at runtime, so the backend validates too. |
| **`fetch` / Promise** | The browser's HTTP client. A Promise is similar to an `asyncio` task; `await` waits for it. |
| **SQLite** | A database stored in one file. No separate database server. |
| **ORM** | Maps Python classes to tables/rows. Here: SQLAlchemy. |
| **CORS** | Browser security rules for calling a backend on another origin. The Vite dev proxy avoids this in development. |

## Features

- **Mindmap canvas** — create nodes, drag them, and connect them with curved
  edges. Drag from a side handle onto empty canvas to create a connected node.
- **Multi-select** — marquee-select, move groups, and delete selections with
  `Delete`/`Backspace`.
- **Study status** — each node is **To Do** (grey), **Doing** (blue), or
  **Done** (green). The node border and its anchor circles use the same color.
- **Learn tab** — block-by-block markdown editing with live preview. Supports
  headings, lists, task lists, quotes, code fences, links, inline formatting,
  and Obsidian-style LaTeX (`$...$`, `$$...$$`).
- **Quiz tab** — add multiple-choice questions, edit the question and answer
  options, mark the correct option, delete questions/options, and check answers.
- **Saved maps** — multiple maps, an editable title, a map picker, and
  debounced autosave with a visible save status.
- **Safe markdown** — the renderer builds React elements instead of injecting
  raw HTML, and links with unsafe protocols are rendered as plain text.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, KaTeX |
| Backend | Python 3.12, FastAPI, Pydantic, SQLAlchemy |
| Database | SQLite (one file, `learnai.db`) |
| Frontend tests | Vitest, jsdom, Testing Library |
| Backend tests | pytest, FastAPI TestClient |

## Quick start

### Option A: dev container

Open the repository in its dev container. The `postCreateCommand` installs both
Python and Node dependencies. Then run:

```bash
./scripts/dev.sh
```

### Option B: local environment

```bash
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements-dev.txt
npm --prefix frontend install
./scripts/dev.sh
```

Open <http://localhost:5173>. The API runs on <http://localhost:8080>, and
FastAPI's interactive API explorer is at <http://localhost:8080/docs>.

You can also run the two servers separately:

```bash
# terminal 1
cd backend
../.venv/bin/uvicorn app.main:app --reload --port 8080

# terminal 2
npm --prefix frontend run dev
```

The Vite development server proxies `/api` to port 8080 (see
`frontend/vite.config.ts`), so the browser can call the backend without CORS
configuration.

## Configuration

Settings are environment variables read by `backend/app/config.py`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `LEARN_AI_DATABASE_URL` | `<repo>/learnai.db` | SQLAlchemy database URL. |
| `LEARN_AI_CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated browser origins allowed to call the API directly. |

Copy `.env.example` to `.env` to override them locally. The dev container sets
`LEARN_AI_DATABASE_URL` in `docker-compose.yml`. The database file is ignored by
git.

## How data flows

```
React graph state
      │  toMindmapDocument()
      ▼
JSON document ── PUT /api/mindmaps/{id} ──► Pydantic validation
      ▲                                             │
      │                                             ▼
frontend/src/persistence.ts                  SQLite mindmaps table
      │                                             │
      └──── fromMindmapDocument() ◄── GET /api/mindmaps/{id}
```

1. On page load, `useMindmapSync` asks for the map list and loads the remembered
   map, the most recently updated map, or a new empty map.
2. The JSON document is converted into the frontend's `Node`/`Link` objects and
   copied into the graph reducer.
3. Canvas, Learn, and Quiz edits update that graph state.
4. `useMindmapAutosave` waits 800 ms after the last edit, then sends the whole
   document with `PUT`.
5. FastAPI validates it with Pydantic, stores it in SQLite, and returns the
   saved resource with server timestamps.

A full document replace keeps the API simple. Last write wins, which is fine for
the current single-user setup.

## JSON format (schema version 1)

`GET /api/mindmaps/{id}` returns this shape:

```json
{
  "schemaVersion": 1,
  "id": "mm_7f3a9c2e",
  "title": "Biology review",
  "createdAt": "2026-11-16T10:00:00.000Z",
  "updatedAt": "2026-11-16T10:42:11.000Z",
  "nodes": [
    {
      "id": "n_1a2b3c4",
      "label": "Cell respiration",
      "status": "doing",
      "x": 420,
      "y": 220,
      "width": 168,
      "learn": {
        "blocks": [
          "## Overview\n\nGlycolysis happens in the cytosol.",
          "- Inputs: glucose, NAD⁺\n- Outputs: pyruvate, ATP, NADH"
        ]
      },
      "quiz": {
        "questions": [
          {
            "id": "q_9d8e7f6",
            "prompt": "Where does glycolysis take place?",
            "options": ["Cytosol", "Mitochondrial matrix", "Nucleus", "Golgi apparatus"],
            "answerIndex": 0
          }
        ]
      }
    },
    {
      "id": "n_5f6g7h8",
      "label": "Krebs cycle",
      "status": "todo",
      "x": 700,
      "y": 220,
      "width": 140,
      "learn": { "blocks": [""] },
      "quiz": { "questions": [] }
    }
  ],
  "links": [
    {
      "id": "l_2b3c4d5",
      "from": "n_1a2b3c4",
      "to": "n_5f6g7h8",
      "fromSide": "right",
      "toSide": "left"
    }
  ]
}
```

`POST` and `PUT` bodies use the same document without `id`, `createdAt`, and
`updatedAt`; the server owns those fields.

### Field notes

- `schemaVersion` — currently `1`. The backend rejects unknown versions.
- `status` — `"todo"`, `"doing"`, or `"done"`.
- `x`, `y`, `width` — canvas position and measured node width, in pixels.
- `learn.blocks` — ordered markdown strings. Empty strings preserve blank
  editor blocks.
- `quiz.questions` — each question needs at least two options and a zero-based
  `answerIndex` pointing at a valid option.
- `fromSide` / `toSide` — `"top"`, `"right"`, `"bottom"`, or `"left"`. Storing
  the side keeps an edge anchored when its node moves.
- IDs are opaque strings, unique inside their collection.
- Links must reference existing nodes, cannot connect a node to itself, and
  cannot duplicate another connection.

The generated JSON Schema is at [`docs/mindmap.schema.json`](docs/mindmap.schema.json),
and a complete example is at
[`backend/examples/mindmap.json`](backend/examples/mindmap.json).

Regenerate the schema after changing the Pydantic models:

```bash
cd backend
../.venv/bin/python -m app.schema_export
```

## API

| Method | Path | Purpose | Success |
| --- | --- | --- | --- |
| `GET` | `/health` | Health check alias | `200` |
| `GET` | `/api/health` | Health check | `200` |
| `GET` | `/api/mindmaps` | List map summaries | `200` |
| `POST` | `/api/mindmaps` | Create a map | `201` |
| `GET` | `/api/mindmaps/{id}` | Load one full map | `200` |
| `PUT` | `/api/mindmaps/{id}` | Replace a map (autosave) | `200` |
| `DELETE` | `/api/mindmaps/{id}` | Delete a map | `204` |

Validation failures return `422` with details from FastAPI/Pydantic. Missing
maps return `404`.

## Project layout

```
backend/
  app/
    main.py            FastAPI app, CORS, startup
    config.py          Environment settings
    database.py        SQLAlchemy engine and request-scoped session
    models.py          mindmaps table
    schemas.py         Pydantic validation models
    documents.py       Row <-> API model conversion and timestamps
    routers/
      mindmaps.py      CRUD endpoints
      health.py        /health and /api/health
    schema_export.py   Generates docs/mindmap.schema.json
  tests/               pytest API and validation tests
  examples/            Example JSON document

frontend/
  src/
    api/               Typed fetch client and API document types
    persistence.ts     JSON <-> graph-state conversion
    mindmapLibrary.ts  localStorage helpers and map summaries
    graph.ts           Domain types, node geometry, edge rendering
    interaction.ts     Hit-testing and connection rules
    markdown.tsx       Safe inline markdown renderer
    quiz.ts            Quiz schema and pure question helpers
    status.ts          Study statuses and colors
    state/             Pure reducer and graph transitions
    hooks/
      useMindmapSync.ts     Load/create/switch maps, orchestrate saves
      useMindmapAutosave.ts Debounced PUT queue and save status
      useMindmapGraph.ts    Graph state and mutations
      ...                   Selection, marquee, labels, pointer interaction
    components/        Presentational React components
    test/              Shared test fixtures and setup

docs/mindmap.schema.json   Generated JSON Schema
scripts/dev.sh             Run backend + frontend together
```

Source files stay under 300 lines. The project-specific rule and architecture
map are in `AGENTS.md`.

## Tests

Run everything:

```bash
npm --prefix frontend run test
cd backend && ../.venv/bin/python -m pytest
```

The frontend suite uses Vitest + jsdom + Testing Library. It covers:

- JSON serialization/deserialization and schema-version rejection
- quiz helper rules and reducer transitions
- hit-testing, connection rules, node geometry, and selection bounds
- markdown rendering and unsafe-link handling
- the quiz editor, header save states, and canvas overlays
- the autosave debounce/queue and initial map-loading hook

The backend suite uses a temporary SQLite database and FastAPI's TestClient. It
covers CRUD, round-trip persistence of Learn/Quiz content, validation failures,
the generated JSON Schema, and the example document.

Other useful checks:

```bash
npm --prefix frontend run build
npm --prefix frontend run lint
cd backend && ../.venv/bin/ruff check .
```

## What is saved (and what is not)

Saved: map title, nodes, positions, widths, statuses, Learn blocks, Quiz
questions, links, and anchor sides.

Not saved: current selection, open panel/tab, edits still inside the 800 ms
autosave window when the tab closes, and quiz answer selections. Quiz answers
are intentionally a temporary practice aid; only the questions themselves are
part of the document.

## Design decisions

- **One JSON document per map.** The UI saves and loads a map as one unit, so a
  single JSON column is simpler than separate node/block/question tables.
- **Server-side validation.** TypeScript types disappear at runtime; Pydantic
  enforces the real contract before anything is stored.
- **Debounced full-document saves.** Dragging fires many state updates, so the
  browser waits for quiet and sends one replacement request.
- **No authentication.** This is a local development app. Do not expose it to
  the public internet without adding authentication and authorization.
- **SQLite for the first version.** No external database service is needed.
  `Base.metadata.create_all()` creates the table; add Alembic before making
  production table-schema changes.

## Troubleshooting

- **"Could not load map"** — make sure the backend is running on port 8080 and
  that `/health` or `/api/health` returns `{"status":"ok"}`.
- **"Save failed"** — the frontend keeps your local changes and offers Retry.
  Check the backend terminal for validation or database errors.
- **Start over** — stop the servers and delete `learnai.db`. The next request
  creates a fresh database.
- **Schema test fails** — regenerate `docs/mindmap.schema.json` with the
  command above.
- **Port already in use** — stop the old process or change the backend port in
  `scripts/dev.sh` and the Vite proxy target.
