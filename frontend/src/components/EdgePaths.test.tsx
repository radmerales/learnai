import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { RenderedEdge } from "../graph"
import { makeNode } from "../test/fixtures"
import { EdgePaths } from "./EdgePaths"

const edge: RenderedEdge = {
  id: "l1",
  from: makeNode({ id: "a", label: "A" }),
  to: makeNode({ id: "b", label: "B" }),
  fromSide: "right",
  toSide: "left",
  fromPoint: { x: 100, y: 100 },
  toPoint: { x: 200, y: 100 },
  midpoint: { x: 150, y: 100 },
  text: "",
  arrow: "none",
  path: "M 100 100 C 150 100, 150 100, 200 100",
}

function renderPaths(overrides: Partial<Parameters<typeof EdgePaths>[0]> = {}) {
  const props = {
    edges: [edge],
    hiddenEdgeId: null,
    selectedEdgeIds: [],
    onHoverStart: vi.fn(),
    onHoverEnd: vi.fn(),
    onSelect: vi.fn(),
    onContextMenu: vi.fn(),
    ...overrides,
  }
  const view = render(
    <svg>
      <EdgePaths {...props} />
    </svg>,
  )
  return { ...view, props }
}

describe("EdgePaths", () => {
  it("renders selected and hit-target paths", () => {
    const { container } = renderPaths({ selectedEdgeIds: ["l1"] })

    const paths = container.querySelectorAll("path")
    expect(paths).toHaveLength(2)
    expect(paths[0]).toHaveAttribute("stroke-width", "3.25")
    expect(paths[1]).toHaveAttribute("stroke", "transparent")
  })

  it("renders edge text and arrow markers", () => {
    const { container } = renderPaths({
      edges: [{ ...edge, text: "causes", arrow: "both" }],
    })

    expect(screen.getByText("causes")).toBeInTheDocument()
    const stroke = container.querySelector("path")!
    expect(stroke).toHaveAttribute("marker-start", "url(#edge-arrow)")
    expect(stroke).toHaveAttribute("marker-end", "url(#edge-arrow)")
  })

  it("hides the edge being dragged", () => {
    const { container } = renderPaths({ hiddenEdgeId: "l1" })

    expect(container.querySelectorAll("path")).toHaveLength(0)
  })

  it("forwards hover, selection, and context-menu events", () => {
    const { container, props } = renderPaths()
    const hitPath = container.querySelector('path[stroke="transparent"]')!

    fireEvent.pointerEnter(hitPath)
    fireEvent.pointerLeave(hitPath)
    fireEvent.pointerDown(hitPath)
    fireEvent.pointerDown(hitPath, { shiftKey: true })
    fireEvent.contextMenu(hitPath)

    expect(props.onHoverStart).toHaveBeenCalledWith("l1")
    expect(props.onHoverEnd).toHaveBeenCalledWith("l1")
    expect(props.onSelect).toHaveBeenNthCalledWith(1, "l1", false)
    expect(props.onSelect).toHaveBeenNthCalledWith(2, "l1", true)
    expect(props.onContextMenu).toHaveBeenCalledWith(edge, expect.anything())
  })
})
