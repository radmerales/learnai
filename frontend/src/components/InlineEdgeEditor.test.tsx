import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { RenderedEdge } from "../graph"
import { buildRenderedEdges } from "../graph"
import { makeLink, makeNode } from "../test/fixtures"
import { InlineEdgeEditor } from "./InlineEdgeEditor"

const nodes = [makeNode({ id: "a" }), makeNode({ id: "b", x: 300 })]
const edge: RenderedEdge = buildRenderedEdges(
  [makeLink({ id: "l1", from: "a", to: "b", text: "old" })],
  new Map(nodes.map((node) => [node.id, node])),
)[0]

function renderEditor(overrides: Partial<Parameters<typeof InlineEdgeEditor>[0]> = {}) {
  const props = {
    edge,
    viewport: { x: 0, y: 0, scale: 1 },
    onCommit: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  }
  const view = render(<InlineEdgeEditor {...props} />)
  return { ...view, ...props }
}

describe("InlineEdgeEditor", () => {
  it("commits on Enter", () => {
    const { onCommit } = renderEditor()
    const input = screen.getByRole("textbox", { name: "Edge text" })

    fireEvent.change(input, { target: { value: "causes" } })
    fireEvent.keyDown(input, { key: "Enter" })

    expect(onCommit).toHaveBeenCalledWith("causes")
  })

  it("cancels on Escape", () => {
    const { onCancel } = renderEditor()

    fireEvent.keyDown(screen.getByRole("textbox", { name: "Edge text" }), {
      key: "Escape",
    })

    expect(onCancel).toHaveBeenCalledOnce()
  })
})
