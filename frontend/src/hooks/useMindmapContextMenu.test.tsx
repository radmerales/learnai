import { act, renderHook } from "@testing-library/react"
import type { MouseEvent } from "react"
import { describe, expect, it, vi } from "vitest"

import { makeNode } from "../test/fixtures"
import { useMindmapContextMenu } from "./useMindmapContextMenu"

const event = { clientX: 120, clientY: 80 } as MouseEvent<SVGGElement>

function setup() {
  const onDeleteNode = vi.fn()
  const onDeleteEdge = vi.fn()
  const hook = renderHook(() => useMindmapContextMenu({ onDeleteNode, onDeleteEdge }))
  return { ...hook, onDeleteNode, onDeleteEdge }
}

describe("useMindmapContextMenu", () => {
  it("opens a node menu and deletes the selected node", () => {
    const { result, onDeleteNode } = setup()

    act(() => {
      result.current.openNode(makeNode({ id: "n1", label: "Biology" }), event)
    })

    expect(result.current.contextMenu).toMatchObject({
      kind: "node",
      id: "n1",
      label: "Biology",
      deleteLabel: "Delete node",
    })

    act(() => {
      result.current.confirmDelete()
    })

    expect(onDeleteNode).toHaveBeenCalledWith("n1")
    expect(result.current.contextMenu).toBeNull()
  })

  it("opens an edge menu and deletes the selected edge", () => {
    const { result, onDeleteEdge } = setup()
    const edge = {
      id: "l1",
      from: makeNode({ id: "a", label: "A" }),
      to: makeNode({ id: "b", label: "B" }),
      fromSide: "right" as const,
      toSide: "left" as const,
      fromPoint: { x: 0, y: 0 },
      toPoint: { x: 100, y: 0 },
      path: "",
    }

    act(() => {
      result.current.openEdge(edge, event as unknown as MouseEvent<SVGPathElement>)
    })
    act(() => {
      result.current.confirmDelete()
    })

    expect(onDeleteEdge).toHaveBeenCalledWith("l1")
  })

  it("closes without deleting", () => {
    const { result, onDeleteNode } = setup()

    act(() => {
      result.current.openNode(makeNode(), event)
      result.current.close()
    })

    expect(result.current.contextMenu).toBeNull()
    expect(onDeleteNode).not.toHaveBeenCalled()
  })
})
