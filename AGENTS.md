# Project Instructions

## Engineering rules

- **Keep every source file under 300 lines.** Split by responsibility: domain models, pure geometry/validation, server repository/functions, UI state, or presentational components.
- Follow Rust/Dioxus best practices: typed props, pure state transitions, signals for UI state, `Result`-based errors, and no unused code.
- Keep state ownership clear:
  - graph data and mutations live in `state/graph.rs`
  - selection lives in `state/selection.rs`
  - server function calls and autosave orchestration live in `app.rs`
  - geometry and validation stay in `domain/`
  - database access stays in `server/repository.rs`
- Reuse the existing theme tokens and visual language (paper/surface/accent/ink, sharp corners, IBM Plex).
- Write comments for a working Python developer who is new to Rust, TypeScript, and web engineering. Explain server functions, signals, WASM, SQLx, and browser APIs where the code is not self-explanatory.
- Add or update basic tests when behavior changes. Run `cargo test --no-default-features` and `cargo clippy --no-default-features --features server` before finishing.
- Verify UI/build changes with `./scripts/build.sh` (or `cargo check` for both `web` and `server` targets) before finishing.

## Architecture map

- `src/main.rs` — Dioxus client/server entrypoint and health routes
- `src/app.rs` — workspace composition, loading, autosave, map actions
- `src/platform.rs` — browser storage/timers/confirm with server fallbacks
- `src/domain/document.rs` — serde/schemars document model
- `src/domain/geometry.rs` — anchors, curves, hit testing
- `src/domain/quiz.rs` — MCQ helpers and node creation
- `src/domain/validation.rs` — title and graph integrity rules
- `src/domain/schema.rs` — generated JSON Schema
- `src/server/db.rs` — SQLx pool + migrations
- `src/server/repository.rs` — CRUD/data mapping
- `src/server/functions.rs` — typed Dioxus server functions
- `src/server/error.rs` — API error/status mapping
- `src/state/graph.rs` — node/link mutations
- `src/state/selection.rs` — node/edge/panel selection
- `src/components/` — Header, WorkspaceCanvas, Canvas, NodePanel, Learn, Quiz, context menu, markdown
- `assets/` — HTML shell, Tailwind source, favicon
- `migrations/` — SQLite schema and timestamp normalization
- `scripts/` — build, dev, and check commands
- `docs/system-map.md` — complete file/function/call map
- `docs/mindmap.schema.json` — generated schema
- `examples/mindmap.json` — hand-written document example

## Commits

- Always commit after every change. Make sure you include the following
  - Summary of change(use conventional feat: chore: etc.)
  - Reason for Change
  - Affected Components
  - Change Severity
