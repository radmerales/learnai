import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { buildRenderedEdges } from "../graph"
import { makeLink, makeNode } from "../test/fixtures"
import { useCanvasAnnotations } from "./useCanvasAnnotations"

const text = { id: "t1", text: "", x: 0, y: 0, width: 220 }
const nodes = [makeNode({ id: "a" }), makeNode({ id: "b", x: 300 })]
const edges = buildRenderedEdges(
  [makeLink({ id: "l1", from: "a", to: "b" })],
  new Map(nodes.map((node) => [node.id, node])),
)

function setup() {
  const addText = vi.fn(() => text)
  const updateText = vi.fn()
  const removeText = vi.fn()
  const updateLink = vi.fn()
  const hook = renderHook(() =>
    useCanvasAnnotations({
      texts: [text],
      edges,
      addText,
      updateText,
      removeText,
      updateLink,
    }),
  )
  return { ...hook, addText, updateText, removeText, updateLink }
}

describe("useCanvasAnnotations", () => {
  it("creates, edits, and deletes a text annotation", () => {
    const { result, addText, updateText, removeText } = setup()

    act(() => result.current.createText({ x: 10, y: 20 }))
    expect(addText).toHaveBeenCalledWith({ x: 10, y: 20 })
    expect(result.current.editingTextId).toBe("t1")

    act(() => result.current.commitText("t1", "Updated"))
    expect(updateText).toHaveBeenCalledWith("t1", "Updated")
    expect(result.current.editingTextId).toBeNull()

    act(() => result.current.deleteText("t1"))
    expect(removeText).toHaveBeenCalledWith("t1")
  })

  it("edits and cancels edge labels", () => {
    const { result, updateLink } = setup()

    act(() => result.current.beginEdgeText("l1"))
    expect(result.current.editingEdge?.id).toBe("l1")

    act(() => result.current.commitEdgeText(" causes "))
    expect(updateLink).toHaveBeenCalledWith("l1", { text: "causes" })
    expect(result.current.editingEdge).toBeNull()

    act(() => result.current.beginEdgeText("l1"))
    act(() => result.current.cancelEdgeText())
    expect(result.current.editingEdge).toBeNull()
  })
})
