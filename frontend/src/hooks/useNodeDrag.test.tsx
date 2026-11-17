import { act, renderHook } from "@testing-library/react"
import type { PointerEvent } from "react"
import { describe, expect, it, vi } from "vitest"

import { makeNode } from "../test/fixtures"
import { useNodeDrag } from "./useNodeDrag"

function pointerEvent(clientX: number, clientY: number) {
  return {
    button: 0,
    shiftKey: false,
    metaKey: false,
    ctrlKey: false,
    clientX,
    clientY,
    pointerId: 1,
    stopPropagation: vi.fn(),
    currentTarget: { setPointerCapture: vi.fn() },
  } as unknown as PointerEvent<SVGGElement>
}

function setup() {
  const node = makeNode({ id: "n1", x: 100, y: 100 })
  const moveNodes = vi.fn()
  const selectNode = vi.fn()
  const focusNode = vi.fn()
  const onStart = vi.fn()
  const hook = renderHook(() =>
    useNodeDrag({
      byId: new Map([[node.id, node]]),
      moveNodes,
      selectedNodeIds: [],
      selectNode,
      focusNode,
      toSvgPoint: (clientX, clientY) => ({ x: clientX, y: clientY }),
      onStart,
    }),
  )
  return { ...hook, moveNodes, selectNode, focusNode, onStart }
}

describe("useNodeDrag", () => {
  it("captures a drag and moves the node by the pointer delta", () => {
    const { result, moveNodes, selectNode, onStart } = setup()

    act(() => {
      result.current.start(pointerEvent(10, 10), "n1")
    })

    expect(onStart).toHaveBeenCalledOnce()
    expect(selectNode).toHaveBeenCalledWith("n1", false)
    expect(result.current.drag?.ids).toEqual(["n1"])

    act(() => {
      result.current.move(pointerEvent(30, 45) as unknown as PointerEvent<SVGSVGElement>)
    })

    expect(moveNodes).toHaveBeenCalledWith([{ id: "n1", x: 120, y: 135 }])
  })

  it("focuses the node only when the pointer did not move", () => {
    const { result, focusNode } = setup()

    act(() => {
      result.current.start(pointerEvent(10, 10), "n1")
    })
    act(() => {
      result.current.finish(pointerEvent(10, 10) as unknown as PointerEvent<SVGSVGElement>)
    })

    expect(focusNode).toHaveBeenCalledWith("n1")
    expect(result.current.drag).toBeNull()
  })
})
