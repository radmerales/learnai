# learn.ai

learn.ai is a browser-only visual study workspace. You build a mindmap, write
markdown notes in the **Learn** tab, and author multiple-choice questions in the
**Quiz** tab. Every map is stored in the browser, so the static build can run on
GitHub Pages with no backend server.

## Stack

- **React 19 + TypeScript** for the UI
- **Vite** for the development server and static production build
- **Tailwind CSS** for the paper/ink visual language
- **KaTeX + markdown** for Learn content
- **localStorage** for map persistence

## Requirements

- Node.js 22 or newer
- npm

```bash
npm --prefix frontend install
```

## Run

```bash
./scripts/dev.sh
```

Open <http://localhost:5173>. The first load creates an empty map in browser
storage. Maps are saved automatically after a short pause.

Build without running:

```bash
npm --prefix frontend run build
```

The output is `frontend/dist`. Asset URLs are relative, so the same build works
at a custom-domain root or under `/<repository>/` on GitHub Pages.

Preview the production build locally:

```bash
npm --prefix frontend run preview
```

## GitHub Pages

The workflow at `.github/workflows/deploy-pages.yml` tests, typechecks, builds,
and deploys `frontend/dist` whenever `main` or `rust-rewrite` is pushed. To
deploy:

1. Push the repository to GitHub.
2. Open **Settings → Pages** and choose **GitHub Actions** as the source.
3. Run the workflow, or push to one of the configured branches.

The build uses `base: "./"` and includes `frontend/public/.nojekyll`, so it does
not depend on the repository name.

## Storage

All data lives in the browser under the `learnai.mindmaps.v1` localStorage key.
The last opened map ID is kept in `learnai.lastMindmapId`.

- Maps are scoped to the deployed origin. Different domains, branches, or
  preview URLs have separate storage.
- Clearing site data removes every map.
- localStorage is small (usually about 5 MB), so very large note sets may hit
  browser quota limits.
- There is no server copy or sync between devices.

The portable JSON shape is still the same:

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

A complete example is in [`examples/mindmap.json`](examples/mindmap.json).
[`docs/mindmap.schema.json`](docs/mindmap.schema.json) documents the shape.

## Features

- Multiple maps with a picker, new/delete actions, and an editable title
- Debounced autosave to browser storage with save state, retry, and page-hide
  flush
- Infinite SVG canvas with panning, zooming, a scaled grid, and status colors
- Wheel/space/middle-drag panning and Ctrl/Cmd+wheel zoom around the pointer
- Bottom-left zoom HUD with percentage, zoom-out, and zoom-in controls
- Node dragging, drag-to-connect with anchor snapping, and a “New node” ghost
  preview when releasing on empty canvas
- Edge endpoint rewiring, including same-pair side changes and right-click
  deletion menus
- Marquee selection, inline node renaming, and selection-bounds outline
- Node panel with live title, study status, Learn tab, and Quiz tab
- Markdown blocks with headings, lists, task lists, quotes, code, links, and
  inline/display math
- MCQ editor with per-question Done, blank-choice cleanup, Cmd/Ctrl+Enter
  shortcuts, practice feedback, and reset

## Project layout

```text
frontend/
  index.html              Vite HTML shell
  src/
    main.tsx              React entrypoint
    App.tsx               root component
    components/           canvas, zoom HUD, header, panel, Learn, Quiz, menus
    hooks/                drag, selection, sync, autosave, viewport, canvas size
    state/                pure mindmap reducer
    storage/              localStorage repository and document types
    graph.ts              node/link types, geometry, curve rendering
    interaction.ts        hit testing, anchor snapping, marquee rules
    persistence.ts        UI model <-> stored JSON document
    previews.ts           ghost node and connection previews
    quiz.ts               MCQ helpers and blank-choice cleanup
    markdown.tsx          safe markdown and KaTeX rendering
    index.css             Tailwind layers and theme tokens
  public/                 favicon and .nojekyll
docs/                     system map, JSON Schema
examples/                 hand-written document example
scripts/dev.sh            Vite development server
.github/workflows/        GitHub Pages deployment
```

See [`docs/system-map.md`](docs/system-map.md) for the file and function map.

## Checks

```bash
npm --prefix frontend test
npm --prefix frontend run typecheck
npm --prefix frontend run lint
npm --prefix frontend run build
```

Vitest covers geometry, interactions, reducer transitions, persistence,
autosave/sync hooks, markdown rendering, and components.
