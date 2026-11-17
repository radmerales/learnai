# Project Instructions

## Engineering rules

- **Keep every source file under 300 lines.** If a file approaches the limit, split it by responsibility — presentational components, controller hooks, pure helpers, or state reducers.
- Follow React and TypeScript best practices: small focused components, typed props, pure state transitions, reusable hooks, and no unused code.
- Keep state ownership clear:
  - graph data and mutations live in the reducer / graph hook
  - pointer interaction state lives in the interaction hook
  - rendering components stay presentational
- Reuse the existing theme tokens and visual language (paper/surface/accent/ink, sharp corners, IBM Plex).
- Write comments for a working Python developer who is new to TypeScript and web engineering. Explain hooks, HTTP/JSON, browser APIs, and test tooling where the code is not self-explanatory.
- Add or update basic tests when behavior changes. Run `npm --prefix frontend run test` and `cd backend && ../.venv/bin/python -m pytest` before finishing.
- Verify changes with `npm --prefix frontend run build` and `npm --prefix frontend run lint` before finishing.

## Architecture map

- `frontend/src/graph.ts` — domain types, geometry, and edge view-model builder
- `frontend/src/interaction.ts` — pure hit-testing, target validation, and canvas clamping
- `frontend/src/markdown.tsx` — safe inline markdown renderer
- `frontend/src/components/Latex.tsx` — KaTeX inline/block math renderer
- `frontend/src/previews.ts` — pure preview geometry builders
- `frontend/src/quiz.ts` — quiz schema and pure question helpers
- `frontend/src/status.ts` — study status types and color palette
- `frontend/src/selectionBounds.ts` — exact multi-selection bounds
- `frontend/src/persistence.ts` — JSON document <-> graph-state serialization
- `frontend/src/mindmapLibrary.ts` — local-storage helpers and map summaries
- `frontend/src/canvasPoint.ts` — browser-to-SVG coordinate conversion
- `frontend/src/api/` — typed HTTP client and API document types
- `frontend/src/state/` — pure reducer and state transitions
- `frontend/src/hooks/` — graph, persistence, context-menu, selection, marquee, hover, label-editing, and focused pointer-interaction controllers (`useNodeDrag`, `useConnectDrag`, `useEdgeDrag`)
- `frontend/src/components/` — presentational React components
- `frontend/src/test/` — Vitest setup and shared fixtures
- `backend/app/` — FastAPI app, SQLAlchemy models, Pydantic schemas, and routes
- `backend/tests/` — pytest API, validation, and persistence tests
- `docs/mindmap.schema.json` — generated JSON Schema for the document format
- `docs/system-map.md` — complete file/function call map and data-flow guide
- `scripts/dev.sh` — run the backend and frontend together

## Commits

- Always commit after every change. Make sure you include the following
  - Summary of change(use conventional feat: chore: etc.)
  - Reason for Change
  - Affected Components
  - Change Severity
