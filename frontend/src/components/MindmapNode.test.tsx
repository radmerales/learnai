import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { makeNode } from "../test/fixtures"
import { MindmapNode } from "./MindmapNode"

const node = makeNode({
  id: "n1",
  label: "Biology",
  status: "done",
  x: 100,
  y: 100,
  width: 160,
})

function renderNode(overrides: Partial<Parameters<typeof MindmapNode>[0]> = {}) {
  const props = {
    node,
    selected: false,
    anchorSide: null,
    showAnchors: false,
    showHandles: false,
    editing: false,
    onPointerDown: vi.fn(),
    onPointerEnter: vi.fn(),
    onPointerLeave: vi.fn(),
    onDoubleClick: vi.fn(),
    onContextMenu: vi.fn(),
    onConnectStart: vi.fn(),
    ...overrides,
  }
  const view = render(
    <svg>
      <MindmapNode {...props} />
    </svg>,
  )
  return { ...view, props }
}

describe("MindmapNode", () => {
  it("renders the label and status colors", () => {
    const { container } = renderNode()

    expect(screen.getByText("Biology")).toBeInTheDocument()
    const rect = container.querySelector("rect")!
    expect(rect).toHaveAttribute("stroke", "#15803d")
    expect(rect).toHaveAttribute("stroke-width", "1.5")
  })

  it("renders anchors, handles, and active anchor state", () => {
    const { container } = renderNode({
      showAnchors: true,
      showHandles: true,
      anchorSide: "right",
    })

    expect(container.querySelectorAll("circle")).toHaveLength(8)
    expect(container.querySelector('circle[fill="#15803d"]')).not.toBeNull()
  })

  it("hides the label while editing", () => {
    renderNode({ editing: true })

    expect(screen.queryByText("Biology")).not.toBeInTheDocument()
  })

  it("forwards node events", () => {
    const { props } = renderNode()
    const text = screen.getByText("Biology")

    fireEvent.pointerDown(text)
    fireEvent.pointerEnter(text)
    fireEvent.pointerLeave(text)
    fireEvent.doubleClick(text)
    fireEvent.contextMenu(text)

    expect(props.onPointerDown).toHaveBeenCalledWith(expect.anything(), "n1")
    expect(props.onPointerEnter).toHaveBeenCalledWith("n1")
    expect(props.onPointerLeave).toHaveBeenCalledWith("n1")
    expect(props.onDoubleClick).toHaveBeenCalledWith(node)
    expect(props.onContextMenu).toHaveBeenCalledWith(node, expect.anything())
  })

  it("starts a connection from a side hit area", () => {
    const { container, props } = renderNode()

    fireEvent.pointerDown(container.querySelector("path.cursor-crosshair")!)

    expect(props.onConnectStart).toHaveBeenCalledWith(
      expect.anything(),
      "n1",
      "top",
    )
  })
})
