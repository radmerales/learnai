import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useLabelEditing } from "../hooks/useLabelEditing"
import { useMindmapContextMenu } from "../hooks/useMindmapContextMenu"
import { useMindmapGraph, type MindmapGraph } from "../hooks/useMindmapGraph"
import {
  useMindmapInteractions,
  type MindmapInteractions,
} from "../hooks/useMindmapInteractions"
import { useMindmapSelection } from "../hooks/useMindmapSelection"
import { useMindmapSync } from "../hooks/useMindmapSync"
import { makeNode } from "../test/fixtures"
import { MindmapPage } from "./MindmapPage"

vi.mock("../hooks/useMindmapGraph", () => ({ useMindmapGraph: vi.fn() }))
vi.mock("../hooks/useMindmapSelection", () => ({ useMindmapSelection: vi.fn() }))
vi.mock("../hooks/useLabelEditing", () => ({ useLabelEditing: vi.fn() }))
vi.mock("../hooks/useMindmapSync", () => ({ useMindmapSync: vi.fn() }))
vi.mock("../hooks/useMindmapInteractions", () => ({ useMindmapInteractions: vi.fn() }))
vi.mock("../hooks/useMindmapContextMenu", () => ({ useMindmapContextMenu: vi.fn() }))
vi.mock("./MindmapCanvas", () => ({
  MindmapCanvas: ({
    nodes,
    onNodeDoubleClick,
    onNodeContextMenu,
  }: {
    nodes: Array<{ id: string; label: string }>
    onNodeDoubleClick: (node: unknown) => void
    onNodeContextMenu: (node: unknown, event: unknown) => void
  }) => (
    <div>
      {nodes.map((node) => (
        <div key={node.id}>
          <button onClick={() => onNodeDoubleClick(node)}>open {node.label}</button>
          <button onClick={() => onNodeContextMenu(node, { clientX: 5, clientY: 6 })}>
            menu {node.label}
          </button>
        </div>
      ))}
    </div>
  ),
}))

type Mocks = ReturnType<typeof makeMocks>

function makeMocks() {
  const node = makeNode({ id: "n1", label: "Biology" })
  const graph = {
    nodes: [] as ReturnType<typeof makeNode>[],
    links: [],
    byId: new Map(),
    addNode: vi.fn(() => makeNode({ id: "new" })),
    removeNode: vi.fn(),
    removeLink: vi.fn(),
    moveNodes: vi.fn(),
    addLink: vi.fn(),
    updateLink: vi.fn(),
    renameNode: vi.fn(),
    setNodeBlocks: vi.fn(),
    setNodeQuestions: vi.fn(),
    setNodeStatus: vi.fn(),
    replaceState: vi.fn(),
  }
  const selection = {
    selectedNodeIds: [] as string[],
    selectedEdgeIds: [] as string[],
    panelOpen: false,
    selectNode: vi.fn(),
    focusNode: vi.fn(),
    selectEdge: vi.fn(),
    selectMarquee: vi.fn(),
    clearSelection: vi.fn(),
    clearEdgeSelection: vi.fn(),
    closePanel: vi.fn(),
  }
  const label = {
    editingId: null as string | null,
    editingNode: null,
    draftLabel: "",
    setDraftLabel: vi.fn(),
    startEditing: vi.fn(),
    commitEditing: vi.fn(),
    cancelEditing: vi.fn(),
  }
  const sync = {
    title: "Biology",
    setTitle: vi.fn(),
    summaries: [],
    currentId: "m1",
    loading: false,
    loadError: null as string | null,
    saveStatus: "saved" as const,
    saveError: null,
    openMap: vi.fn(),
    newMap: vi.fn(),
    deleteMap: vi.fn(),
    retrySave: vi.fn(),
    reload: vi.fn(),
  }
  const interactions = {
    svgRef: { current: null },
    canvasSize: { width: 800, height: 600 },
    viewport: { x: 0, y: 0, scale: 1 },
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    resetViewport: vi.fn(),
    canZoomIn: true,
    canZoomOut: true,
    panning: false,
    panReady: false,
    marquee: null,
    drag: null,
    connect: null,
    edgeDrag: null,
    hoveredId: null,
    hoveredEdgeId: null,
    ghostNode: null,
    connectPreview: null,
    edgePreview: null,
    onBackgroundPointerDown: vi.fn(),
    onCanvasDoubleClick: vi.fn(),
    onNodePointerDown: vi.fn(),
    onNodePointerEnter: vi.fn(),
    onNodePointerLeave: vi.fn(),
    startConnect: vi.fn(),
    startEdgeDrag: vi.fn(),
    showEdge: vi.fn(),
    scheduleEdgeHide: vi.fn(),
    clearEdgeHoverTimer: vi.fn(),
    onPointerMove: vi.fn(),
    onPointerUp: vi.fn(),
    onPointerLeave: vi.fn(),
  }
  const context = {
    contextMenu: null,
    openNode: vi.fn(),
    openEdge: vi.fn(),
    close: vi.fn(),
    confirmDelete: vi.fn(),
  }
  return { node, graph, selection, label, sync, interactions, context }
}

function setup(overrides: Partial<Mocks> = {}) {
  const mocks = { ...makeMocks(), ...overrides }
  vi.mocked(useMindmapGraph).mockReturnValue(
    mocks.graph as unknown as MindmapGraph,
  )
  vi.mocked(useMindmapSelection).mockReturnValue(
    mocks.selection as unknown as ReturnType<typeof useMindmapSelection>,
  )
  vi.mocked(useLabelEditing).mockReturnValue(
    mocks.label as unknown as ReturnType<typeof useLabelEditing>,
  )
  vi.mocked(useMindmapSync).mockReturnValue(
    mocks.sync as unknown as ReturnType<typeof useMindmapSync>,
  )
  vi.mocked(useMindmapInteractions).mockReturnValue(
    mocks.interactions as unknown as MindmapInteractions,
  )
  vi.mocked(useMindmapContextMenu).mockReturnValue(
    mocks.context as unknown as ReturnType<typeof useMindmapContextMenu>,
  )
  render(<MindmapPage />)
  return mocks
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe("MindmapPage", () => {
  it("creates the first node in the center of the canvas", () => {
    const mocks = setup()

    fireEvent.click(screen.getByRole("button", { name: "Create first node" }))

    expect(mocks.graph.addNode).toHaveBeenCalledWith({ x: 400, y: 300 })
    expect(mocks.selection.focusNode).toHaveBeenCalledWith("new")
  })

  it("opens label editing and context menus from the canvas", () => {
    const base = makeMocks()
    const mocks = setup({ graph: { ...base.graph, nodes: [base.node] } })

    fireEvent.click(screen.getByRole("button", { name: "open Biology" }))
    fireEvent.click(screen.getByRole("button", { name: "menu Biology" }))

    expect(mocks.selection.selectNode).toHaveBeenCalledWith("n1")
    expect(mocks.label.startEditing).toHaveBeenCalledWith(mocks.node)
    expect(mocks.selection.closePanel).toHaveBeenCalled()
    expect(mocks.context.openNode).toHaveBeenCalled()
  })

  it("deletes the selected items with Delete/Backspace", () => {
    const selectedNode = makeNode({ id: "a", label: "Selected" })
    const mocks = setup({
      selection: {
        ...makeMocks().selection,
        selectedNodeIds: ["a"],
        selectedEdgeIds: ["e"],
      },
      graph: {
        ...makeMocks().graph,
        byId: new Map([["a", selectedNode]]),
      },
    })

    fireEvent.keyDown(document.body, { key: "Delete" })

    expect(mocks.graph.removeNode).toHaveBeenCalledWith("a")
    expect(mocks.graph.removeLink).toHaveBeenCalledWith("e")
    expect(mocks.selection.clearSelection).toHaveBeenCalled()
    expect(mocks.label.cancelEditing).toHaveBeenCalled()
  })

  it("creates a new map and deletes the current one after confirmation", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true)
    const mocks = setup()

    fireEvent.click(screen.getByRole("button", { name: "New map" }))
    fireEvent.click(screen.getByRole("button", { name: "Delete" }))

    expect(mocks.sync.newMap).toHaveBeenCalled()
    expect(mocks.sync.deleteMap).toHaveBeenCalledWith("m1")
  })

  it("shows the loading overlay", () => {
    const mocks = makeMocks()
    mocks.sync.loading = true
    setup({ sync: mocks.sync })

    expect(screen.getByText("Loading map")).toBeInTheDocument()
  })

  it("shows a load error with retry", () => {
    const mocks = makeMocks()
    mocks.sync.loadError = "Backend unavailable"
    setup({ sync: mocks.sync })

    expect(screen.getByText("Backend unavailable")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Retry" }))
    expect(mocks.sync.reload).toHaveBeenCalled()
  })
})
