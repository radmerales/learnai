import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { buildRenderedEdges } from "../graph"
import type { MindmapInteractions } from "../hooks/useMindmapInteractions"
import { makeLink, makeNode } from "../test/fixtures"
import { MindmapCanvas } from "./MindmapCanvas"

const nodeA = makeNode({ id: "a", label: "Alpha", x: 100, y: 100 })
const nodeB = makeNode({ id: "b", label: "Beta", x: 400, y: 100 })
const link = makeLink({ id: "l1", from: "a", to: "b" })
const edges = buildRenderedEdges([link], new Map([nodeA, nodeB].map((node) => [node.id, node])))

type CanvasInteractions = Omit<MindmapInteractions, "svgRef">

function interactions(overrides: Partial<CanvasInteractions> = {}): CanvasInteractions {
  return {
    canvasSize: { width: 800, height: 600 },
    viewport: { x: 0, y: 0, scale: 1 },
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    animateTo: vi.fn(),
    resetViewport: vi.fn(),
    manualVersion: 0,
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
    ...overrides,
  }
}

function renderCanvas(
  overrides: Partial<Parameters<typeof MindmapCanvas>[0]> = {},
) {
  const props: Parameters<typeof MindmapCanvas>[0] = {
    nodes: [nodeA, nodeB],
    edges,
    selectedNodeIds: [],
    selectedEdgeIds: [],
    editingId: null,
    selectionBox: null,
    viewport: { x: 0, y: 0, scale: 1 },
    svgRef: { current: null },
    interactions: interactions(),
    onNodeDoubleClick: vi.fn(),
    onNodeContextMenu: vi.fn(),
    onEdgeContextMenu: vi.fn(),
    onSelectEdge: vi.fn(),
    ...overrides,
  }
  const view = render(<MindmapCanvas {...props} />)
  return { ...view, props }
}

describe("MindmapCanvas", () => {
  it("renders nodes, edges, and the grid", () => {
    const { container } = renderCanvas()

    expect(screen.getByText("Alpha")).toBeInTheDocument()
    expect(screen.getByText("Beta")).toBeInTheDocument()
    expect(container.querySelectorAll("path").length).toBeGreaterThan(1)
  })

  it("shows node handles on hover and edge handles on edge hover", () => {
    const { container } = renderCanvas({
      interactions: interactions({ hoveredId: "a", hoveredEdgeId: "l1" }),
    })

    expect(container.querySelectorAll("circle").length).toBeGreaterThan(0)
  })

  it("renders selection and marquee boxes", () => {
    const { container } = renderCanvas({
      selectionBox: { x: 10, y: 20, width: 100, height: 50 },
      interactions: interactions({
        marquee: { x: 5, y: 5, width: 20, height: 20 },
      }),
    })

    expect(container.querySelectorAll("rect").length).toBeGreaterThan(2)
  })

  it("forwards node and canvas events", () => {
    const onNodeDoubleClick = vi.fn()
    const ints = interactions()
    renderCanvas({ onNodeDoubleClick, interactions: ints })

    fireEvent.doubleClick(screen.getByText("Alpha"))
    fireEvent.pointerDown(screen.getByText("Alpha"))

    expect(onNodeDoubleClick).toHaveBeenCalled()
    expect(ints.onNodePointerDown).toHaveBeenCalled()
  })
})
