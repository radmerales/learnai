# Project Instructions

## Engineering rules

- **Keep every source file under 300 lines.** Split by responsibility: pure
  geometry/validation, reducer state, browser storage, React hooks, or
  presentational components.
- Follow React/TypeScript best practices: typed props, pure state transitions,
  hooks for UI state, `Result`-like errors only where the caller must branch, and
  no unused code.
- Keep state ownership clear:
  - graph data and reducer transitions live in `state/mindmapReducer.ts`
  - map load/save coordination lives in `hooks/useMindmapSync.ts`
  - debounced persistence lives in `hooks/useMindmapAutosave.ts`
  - browser storage lives in `storage/mindmaps.ts`
  - geometry and hit testing stay in `graph.ts`, `interaction.ts`, and
    `previews.ts`
  - canvas pan/zoom state lives in `hooks/useCanvasViewport.ts`
  - components receive data and callbacks; they do not read storage directly
- Reuse the existing theme tokens and visual language (paper/surface/accent/ink,
  sharp corners, IBM Plex).
- Write comments for a working Python developer who is new to TypeScript, React,
  and web engineering. Explain hooks, effects, browser APIs, and localStorage
  where the code is not self-explanatory.
- Add or update tests when behavior changes. Run:
  `npm --prefix frontend test`,
  `npm --prefix frontend run typecheck`,
  `npm --prefix frontend run lint`, and
  `npm --prefix frontend run build` before finishing.
- Verify deployment-sensitive changes with `npm --prefix frontend run build` and
  check that `frontend/dist/index.html` uses relative asset URLs.

## Architecture map

- `frontend/src/main.tsx` — React root
- `frontend/src/App.tsx` — app shell
- `frontend/src/components/MindmapPage.tsx` — workspace composition and actions
- `frontend/src/components/` — canvas, zoom HUD, header, panel, Learn, Quiz, menus
- `frontend/src/hooks/` — drag/selection, sync, autosave, viewport, canvas size
- `frontend/src/state/mindmapReducer.ts` — node/link mutations
- `frontend/src/storage/mindmaps.ts` — localStorage repository
- `frontend/src/storage/types.ts` — stored JSON document types
- `frontend/src/graph.ts` — model types, anchors, curves, width measurement
- `frontend/src/interaction.ts` — hit testing, anchor snapping, edge targets
- `frontend/src/previews.ts` — ghost node and connection/edge previews
- `frontend/src/quiz.ts` — MCQ helpers and blank-choice cleanup
- `frontend/src/markdown.tsx` — safe markdown + KaTeX rendering
- `frontend/src/index.css` — Tailwind input and theme tokens
- `frontend/public/` — favicon and `.nojekyll`
- `frontend/dist/` — static GitHub Pages build output (generated)
- `docs/system-map.md` — complete file/function/call map
- `.github/workflows/deploy-pages.yml` — GitHub Pages build/deploy

## Deployment

This is a static, browser-only app. Do not add a backend or server functions.
Persistence belongs in `storage/mindmaps.ts`. The Vite `base` is relative so the
same `dist/` works at a GitHub Pages project path.

## Commits

- Always commit after every change. Make sure you include the following
  - Summary of change (use conventional `feat:`, `fix:`, `chore:`, etc.)
  - Reason for Change
  - Affected Components
  - Change Severity
