# Project Instructions

## Engineering rules

- **Keep every source file under 300 lines.** If a file approaches the limit, split it by responsibility — presentational components, controller hooks, pure helpers, or state reducers.
- Follow React and TypeScript best practices: small focused components, typed props, pure state transitions, reusable hooks, and no unused code.
- Keep state ownership clear:
  - graph data and mutations live in the reducer / graph hook
  - pointer interaction state lives in the interaction hook
  - rendering components stay presentational
- Reuse the existing theme tokens and visual language (paper/surface/accent/ink, sharp corners, IBM Plex).
- Verify changes with `npm --prefix frontend run build` before finishing.

## Architecture map

- `frontend/src/graph.ts` — domain types, geometry, and edge view-model builder
- `frontend/src/interaction.ts` — pure hit-testing, target validation, and canvas clamping
- `frontend/src/previews.ts` — pure preview geometry builders
- `frontend/src/state/` — pure reducer and state transitions
- `frontend/src/hooks/` — graph, label-editing, and pointer-interaction controllers
- `frontend/src/components/` — presentational React components

## Commits

- Always commit after every change. Make sure you include the following
  - Summary of change(use conventional feat: chore: etc.)
  - Reason for Change
  - Affected Components
  - Change Severity
