import { fireEvent, render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { RenderedEdge } from "../graph"
import { makeNode } from "../test/fixtures"
import { EdgeHandles } from "./EdgeHandles"

const edge: RenderedEdge = {
  id: "l1",
  from: makeNode({ id: "a" }),
  to: makeNode({ id: "b" }),
  fromSide: "right",
  toSide: "left",
  fromPoint: { x: 100, y: 100 },
  toPoint: { x: 200, y: 100 },
  midpoint: { x: 150, y: 100 },
  text: "",
  arrow: "none",
  path: "",
}

function renderHandles(overrides: Partial<Parameters<typeof EdgeHandles>[0]> = {}) {
  const props = {
    edges: [edge],
    hoveredEdgeId: "l1",
    disabled: false,
    onStart: vi.fn(),
    onHoverStart: vi.fn(),
    onHoverEnd: vi.fn(),
    ...overrides,
  }
  const view = render(
    <svg>
      <EdgeHandles {...props} />
    </svg>,
  )
  return { ...view, props }
}

describe("EdgeHandles", () => {
  it("renders endpoint handles for the hovered edge", () => {
    const { container } = renderHandles()

    expect(container.querySelectorAll("circle")).toHaveLength(4)
    expect(container.querySelectorAll("title")).toHaveLength(2)
  })

  it("starts a rewire from either endpoint", () => {
    const { container, props } = renderHandles()
    const hits = container.querySelectorAll('circle[fill="transparent"]')

    fireEvent.pointerDown(hits[0])
    fireEvent.pointerDown(hits[1])

    expect(props.onStart).toHaveBeenNthCalledWith(1, expect.anything(), edge, "from")
    expect(props.onStart).toHaveBeenNthCalledWith(2, expect.anything(), edge, "to")
  })

  it("reports hover and hides when disabled or not hovered", () => {
    const { container, props } = renderHandles()
    const group = container.querySelector("g")!

    fireEvent.pointerEnter(group)
    fireEvent.pointerLeave(group)

    expect(props.onHoverStart).toHaveBeenCalledOnce()
    expect(props.onHoverEnd).toHaveBeenCalledWith("l1")

    const disabled = renderHandles({ disabled: true, edges: [] })
    expect(disabled.container.querySelector("circle")).toBeNull()
  })
})
