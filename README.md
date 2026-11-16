# Mindmap MVP

A simple one-page mindmap tool for exploring topics as a node network.
Inspired by graph/mindmap views: create nodes, branch into subnodes with edges,
connect related nodes, and rearrange ideas by dragging them around.

## Features (MVP)

- **Single-page app** — everything runs in the browser, no backend or auth.
- **Create root nodes** — start a topic from an empty canvas.
- **Create subnodes** — select a node and add a child; a connecting edge is
  created automatically.
- **Tree hierarchy** — each non-root node has exactly one parent, so the
  parent/child structure itself has no cycles.
- **Connect nodes manually** — hover a node to reveal circular handles on its
  four edges, then drag a handle onto another node. The new link locks to the
  middle of the facing side.
- **Drop-to-create** — drag a new connection onto empty canvas and a new child
  node is created at the drop point, connected to the source node. A dashed
  “New node” ghost previews the result before release.
- **Edit edges** — hover an edge to reveal endpoint handles, then drag either
  endpoint onto another node to reconnect it. Releasing outside any node deletes
  the link (or detaches a parent/child edge).
- **Specific anchor targeting** — while reconnecting, the target node shows four
  anchor dots at its edge midpoints. The dot nearest the pointer is highlighted,
  so the edge lands on the chosen side rather than anywhere on the node.
- **Stable anchors** — moving a node never re-picks which side an edge attaches
  to. The edge follows its node, but its anchor side stays where it was set.
- **Clean resting state** — endpoint circles are only shown while connecting or
  rewiring, not on finished edges.
- **Curved connectors** — edges are cubic Bézier curves that leave and enter a
  node perpendicular to the middle of the anchor side.
- **Drag to move** — reposition nodes freely on the canvas; edges follow.
- **Inline labels** — double-click a node to edit its label in place; Enter
  commits, Escape cancels, and blur commits.
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
frontend/src/
  graph.ts          Domain types, geometry, edge view-model builder
  interaction.ts    Pure hit-testing and target validation
  previews.ts       Pure preview geometry builders
  state/            Reducer and graph state transitions
  hooks/            Graph, label-editing, and interaction controllers
  components/       Presentational canvas, node, edge, header, footer
```

Project-specific engineering rules are kept in `AGENTS.md`; every source file
must stay under 300 lines.

## Design decisions

### Architecture

- **Frontend-only SPA:** The MVP goal is interaction (create/connect/drag), so a
  server adds complexity without value. All state is held in React component
  state; this keeps the app easy to run and reason about. Persistence (local
  storage/export) is intentionally deferred.
- **Small, responsibility-based modules:** Graph state lives in a pure reducer,
  pointer behavior in dedicated hooks, geometry and hit-testing in pure helpers,
  and rendering in presentational components. Every source file stays under 300
  lines; the rule is documented in `AGENTS.md` as a project-specific system
  instruction.
- **Tree hierarchy by construction:** Subnodes are created only as children of
  an existing node (`parentId` required for non-root nodes), so the parent/child
  structure is always a tree.
- **Separate manual-link model:** User-created connections live in their own
  `links` array as `{ id, from, to, fromSide, toSide }`. Keeping them separate
  from the parent hierarchy means the tree stays intact while additional
  cross-links can be added. This MVP does not cycle-check manual links; the tree
  layer remains the structural backbone.
- **Editable edge semantics:** Hovering an edge reveals handles at both
  endpoints. For a manual link, dragging an endpoint updates that endpoint and
  its snapped side. For a parent/child tree edge, the drag always matches the
  preview: dragging the parent end reparents the original child under the target;
  dragging the child end inserts the target under the fixed parent and detaches
  the original child. Releasing outside any node detaches the child. The
  hierarchy stays acyclic and drop-created tree edges rewire the same way as
  button-created ones.
- **Drop-to-create nodes:** Releasing a new connection on empty canvas inserts a
  child node at the pointer position (clamped to the visible canvas) with
  `parentId` set to the source. Its edge side is seeded from the handle the drag
  started on. This keeps the new node inside the tree hierarchy rather than
  creating a detached root.
- **Explicit data model:** Nodes are stored as `{ id, label, x, y, parentId }`.
  Parent/child edges are derived from `parentId` at render time; manual links
  are stored explicitly. Both are merged into one render list.
- **Curved SVG canvas:** Nodes and edges render in one SVG layer sized to the
  viewport. Connectors are cubic Bézier paths; the first and last control points
  extend along the side normal, so outgoing and incoming tangents are
  perpendicular to the anchor side while the middle of the path curves.
- **Edge midpoint snapping:** Every endpoint snaps to the middle of one of the
  four node sides. While dragging an endpoint, the target node renders all four
  anchor dots and highlights the one nearest the pointer, chosen with
  aspect-normalized node coordinates rather than the node as a whole. Both
  manual links and tree edges persist their chosen sides (`fromSide` /
  `toSide`), so moving a node does not automatically switch an edge to another
  side. Hovering a drop target previews the snap point before release, and only
  an explicit endpoint drag changes the anchor.
- **Pointer-event dragging and connecting:** Dragging uses pointer events so
  movement stays smooth and works with mouse/touch/pen. Connection drops are
  hit-tested against node bounds, which makes targets reliable even as nodes
  overlap. Edge endpoints also use a forgiving invisible hit path plus a short
  hover grace period so moving from an edge to its handle does not dismiss it.

### UI

- **Theme:** Applied the provided visual direction — warm paper ground
  `#e9e9e5` / alternate `#e1e0dd`, accent `#f5c518` for primary actions and
  selection, ink text (`#000000` / `#1d1d1d`), sharp corners (`0px` radius),
  hairline borders (`#cbcac7`), and a compact, utilitarian layout.
- **Typography:** IBM Plex Sans for UI/display and IBM Plex Mono for small
  labels/meta, matching the requested pairing and reinforcing a tool-like feel.
- **One-page workspace:** A simple header/toolbar plus a large canvas maximizes
  space for the map. Controls are minimal (add root, add child, delete) to keep
  the MVP focused. Labels are edited directly on the canvas via node
  double-click rather than through a persistent form field.
- **Clear selection state:** The selected node uses the accent color so the
  target for "add subnode" or "rename" is always obvious. Edges are neutral so
  structure reads without competing with nodes.
- **Connection affordance:** Hovering a node reveals four circular handles at
  the midpoint of each side. Dragging from a handle shows a dashed curved
  preview and a live endpoint marker; hovering a valid target highlights it with
  the accent fill and snaps the preview to one of its four side midpoints before
  the link is dropped. Hovering blank canvas shows a dashed “New node” ghost at
  the future node position.
- **Rewire affordance:** Finished edges stay clean with no endpoint circles.
  Hovering an edge reveals endpoint handles, and the edge being dragged is
  replaced by a dashed preview so the new connection is clear. Dropping outside
  any node removes the edge.
- **Edge treatment:** Edges use a single dashed dark-grey stroke with a
  transparent outline — no halo, fill, or double stroke. The same dashed line
  style is used for finished edges and drag previews, with anchor dots only
  appearing while choosing a connection target.
- **Direct manipulation:** Nodes are moved by dragging rather than through
  forms, matching the mental model of arranging a mindmap on a board. Use the **+ Child** control on a selected node (or the toolbar) to branch quickly.

