# learn.ai

learn.ai is a visual study workspace built entirely in Rust. You build a
mindmap, write markdown notes in the **Learn** tab, and author multiple-choice
questions in the **Quiz** tab. Maps are saved to a SQLite database through typed
Dioxus server functions.

The project is a full-stack Rust application:

- **Dioxus 0.7** for the web UI and server functions
- **Axum 0.8** as the HTTP server under Dioxus fullstack
- **SQLx + SQLite** for persistence
- **Hand-written CSS** for the paper/ink visual language; no Node or CSS build
  step
- **pulldown-cmark, ammonia, and katex-rs** for Learn content

## Requirements

- Rust 1.100 or newer (`rust-toolchain.toml` pins the toolchain)
- `wasm32-unknown-unknown` target
- `wasm-bindgen-cli` 0.2.130

```bash
rustup target add wasm32-unknown-unknown
cargo install wasm-bindgen-cli --version 0.2.130
```

The dev container installs these automatically. The Dioxus CLI (`dx`) is
optional; `scripts/build.sh` builds the client and server without it.

## Run

The simplest path is the build + run script:

```bash
./scripts/dev.sh
```

Open <http://localhost:8080>. The first run creates `learnai.db` in the
workspace (or uses `LEARN_AI_DATABASE_URL`).

Build without running:

```bash
./scripts/build.sh
```

The output is `target/release/learn-ai` plus `target/release/public`.
`scripts/build.sh` also works with `CARGO_TARGET_DIR` and `PROFILE`.

The database path and future settings are environment variables:

```bash
LEARN_AI_DATABASE_URL=sqlite:////workspace/learnai.db
```

Copy `.env.example` to `.env` if you prefer file-based settings.

## Current features

- Multiple maps with a picker, new/delete actions, and an editable title
- Debounced autosave with save state and retry
- SVG canvas with grid, nodes, dashed curved edges, and status colors
- Node dragging, drag-to-connect with side-anchor snapping, and a “New node”
  ghost preview when releasing on empty canvas
- Hover handles for rewiring an edge endpoint with side-anchor snapping;
  dropping on truly empty canvas deletes the edge
- Right-click menus on nodes and edges for quick deletion
- Marquee selection and Delete-selected action
- Node panel with live title, study status, Learn tab, and Quiz tab
- Markdown blocks with headings, lists, task lists, quotes, code, links, and
  inline/display math
- MCQ editor with options, correct-answer radio, add/delete options, practice
  feedback, and reset
- Existing SQLite data migration, including normalization of old timestamp rows

The previous UI's inline node-name editor and selection-bounds outline are not
ported; double-clicking a node opens the panel where its name is editable.

## Data format

The database stores one row per map. The `document` JSON column contains the
nodes and links:

```json
{
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
      "learn": { "blocks": ["Glycolysis happens in the cytosol."] },
      "quiz": {
        "questions": [
          {
            "id": "q_1",
            "prompt": "Where does glycolysis take place?",
            "options": ["Cytosol", "Mitochondria", "Nucleus", "Golgi"],
            "answerIndex": 0
          }
        ]
      }
    }
  ],
  "links": [
    {
      "id": "l_1",
      "from": "n_1",
      "to": "n_2",
      "fromSide": "right",
      "toSide": "left"
    }
  ]
}
```

The Rust domain models are the source of truth. Generate the JSON Schema with:

```bash
cargo run --no-default-features --bin export-schema > docs/mindmap.schema.json
```

A complete example is in [`examples/mindmap.json`](examples/mindmap.json).

## Server functions

The UI calls typed Dioxus server functions. Their HTTP shapes are:

| Method | Path | Named body |
| --- | --- | --- |
| `GET` | `/api/mindmaps` | — |
| `POST` | `/api/mindmaps` | `{ "document": MindmapDocument }` |
| `GET` | `/api/mindmaps/{id}` | — |
| `PUT` | `/api/mindmaps/{id}` | `{ "id": "...", "document": MindmapDocument }` |
| `DELETE` | `/api/mindmaps/{id}` | `{ "id": "..." }` |

`GET /health` and `GET /api/health` return `{"status":"ok"}`.

## Project layout

```text
src/
  main.rs                 Dioxus launch/serve entrypoint + health routes
  app.rs                  workspace state, effects, layout
  app_actions.rs          load/apply helpers, map handlers, panel host
  domain/
    document.rs           serde/schemars data model
    geometry.rs           SVG anchors, curves, hit testing
    quiz.rs               MCQ helpers and node creation
    validation.rs         graph/document rules
    schema.rs             JSON Schema generation
    tests.rs              domain tests
  server/
    db.rs                 SQLx pool + migrations
    repository.rs         CRUD/repository layer
    functions.rs          typed Dioxus server functions
    error.rs              API error/status mapping
  state/
    graph.rs              node/link mutations
    selection.rs          node/edge/panel selection
  components/
    header.rs             title, map picker, save state
    workspace_canvas.rs   canvas/state wiring and context-menu host
    canvas.rs             SVG interaction surface
    canvas_node.rs        node shape, side handles, drag/context events
    canvas_edges.rs       edge rendering, hit paths, rewire handles
    canvas_overlays.rs    connect/edge previews and marquee box
    canvas_types.rs       interaction state/outcomes
    context_menu.rs       fixed-position node/edge delete menu
    panel.rs              node detail shell
    learn.rs              markdown block editor
    quiz.rs               MCQ editor/practice
    markdown.rs           safe markdown + math rendering
    workspace_footer.rs   selection/footer controls
  platform.rs             web storage/timers/confirm with server fallbacks
  bin/export_schema.rs    schema export tool

assets/                   HTML shell, hand-written CSS, favicon
migrations/               SQLx schema + timestamp normalization
scripts/                  build, dev, check
examples/mindmap.json     hand-written contract example
docs/                     JSON Schema and system map
```

Every source file stays under 300 lines. See
[`docs/system-map.md`](docs/system-map.md) for the file/function/call map.

## Tests and checks

```bash
./scripts/check.sh
```

Or individually:

```bash
cargo test --no-default-features
cargo clippy --no-default-features --features server
cargo fmt --check
```

The Rust tests cover document validation, graph geometry, edge rewiring, quiz
option rules, and schema generation. The fullstack build was also manually
verified with a headless Chromium run: page load, hydration, first-node
creation, and database autosave all work.

## Database migration

The original SQLite rows use a SQLAlchemy timestamp format such as
`2026-11-17 00:03:03.956255`. `migrations/0002_normalize_timestamps.sql`
converts them to RFC-3339 (`...T...Z`) at startup. Back up `learnai.db` before
the first Rust run.

## Design notes

- **Server functions instead of REST handlers.** The payload structs remain
  plain serde types, so the JSON document format is still portable.
- **Document storage.** A map is one JSON document in one SQLite row; saves are
  full-document replacements.
- **Separate build path.** `scripts/build.sh` performs the steps the Dioxus CLI
  normally coordinates: WASM, wasm-bindgen, server, and public assets. CSS is
  copied as-is from `assets/styles/`.
- **No authentication.** This is a local single-user workspace. Add auth before
  exposing it publicly.
