# Mindmap MVP

A simple one-page mindmap tool for exploring topics as a node network (tree).
Inspired by graph/mindmap views: create nodes, branch into subnodes with edges,
and rearrange ideas by dragging them around.

## Features (MVP)

- **Single-page app** — everything runs in the browser, no backend or auth.
- **Create root nodes** — start a topic from an empty canvas.
- **Create subnodes** — select a node and add a child; a connecting edge is
  created automatically.
- **Tree structure** — each non-root node has exactly one parent, so there are
  no cycles.
- **Drag to move** — reposition nodes freely on the canvas; edges follow.
- **Inline labels** — select a node to edit its label.
- **Local-only state** — the map lives in memory for the current session (no
  persistence in this MVP).

## Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | React 19 + Vite + TypeScript, Tailwind CSS       |

## Quick start

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

Open <http://localhost:5173>.

## Project layout

```
frontend/   React + Vite single-page mindmap app
```

## Design decisions

### Architecture

- **Frontend-only SPA:** The MVP goal is interaction (create/connect/drag), so a
  server adds complexity without value. All state is held in React component
  state; this keeps the app easy to run and reason about. Persistence (local
  storage/export) is intentionally deferred.
- **Tree by construction:** Subnodes are created only as children of an existing
  node (`parentId` required for non-root nodes). Because a node can never gain a
  second parent and there is no "connect arbitrary nodes" action, cycles are
  impossible without extra validation logic.
- **Explicit data model:** Nodes are stored as `{ id, label, x, y, parentId }`.
  Edges are derived from `parentId` at render time rather than stored
  separately, avoiding edge/node sync bugs.
- **SVG canvas:** Nodes and edges render in an SVG layer sized to the viewport.
  Straight lines connect parent/child centers and update automatically when node
  positions change. SVG keeps hit targets, text, and lines in one coordinate
  space.
- **Pointer-event dragging:** Dragging uses pointer events with
  pointer-capture-style tracking on the canvas so movement stays smooth and
  works with mouse/touch/pen. Dragging updates only the moved node's coordinates.

### UI

- **Theme:** Applied the provided visual direction — warm paper ground
  `#e9e9e5` / alternate `#e1e0dd`, accent `#f5c518` for primary actions and
  selection, ink text (`#000000` / `#1d1d1d`), sharp corners (`0px` radius),
  hairline borders (`#cbcac7`), and a compact, utilitarian layout.
- **Typography:** IBM Plex Sans for UI/display and IBM Plex Mono for small
  labels/meta, matching the requested pairing and reinforcing a tool-like feel.
- **One-page workspace:** A simple header/toolbar plus a large canvas maximizes
  space for the map. Controls are minimal (add root, add child, delete, label
  edit) to keep the MVP focused.
- **Clear selection state:** The selected node uses the accent color so the
  target for "add subnode" or "rename" is always obvious. Edges are neutral so
  structure reads without competing with nodes.
- **Direct manipulation:** Nodes are moved by dragging rather than through
  forms, matching the mental model of arranging a mindmap on a board. Use the **+ Child** control on a selected node (or the toolbar) to branch quickly.

