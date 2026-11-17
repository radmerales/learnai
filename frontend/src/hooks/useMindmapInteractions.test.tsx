import { act, renderHook } from "@testing-library/react"
import type { MouseEvent, PointerEvent } from "react"
import { describe, expect, it, vi } from "vitest"

import { makeNode } from "../test/fixtures"
import { useMindmapInteractions } from "./useMindmapInteractions"

const node = makeNode({ id: "a", label: "Alpha", x: 100, y: 100 })
const nodes = [node]
const byId = new Map([[node.id, node]])

function pointerEvent(clientX: number, clientY: number, overrides: Record<string, unknown> = {}) {
  return {
    button: 0,
    clientX,
    clientY,
    shiftKey: false,
    metaKey: false,
    ctrlKey: false,
    pointerId: 1,
    stopPropagation: vi.fn(),
    currentTarget: { setPointerCapture: vi.fn() },
    ...overrides,
  } as unknown as PointerEvent<SVGSVGElement>
}

function mouseEvent(clientX: number, clientY: number) {
  return { button: 0, clientX, clientY } as MouseEvent<SVGSVGElement>
}

function setup() {
  const newNode = makeNode({ id: "new", x: 400, y: 400 })
  const actions = {
    moveNodes: vi.fn(),
    addNode: vi.fn(() => newNode),
    addLink: vi.fn(),
    updateLink: vi.fn(),
    removeLink: vi.fn(),
    selectNode: vi.fn(),
    focusNode: vi.fn(),
    selectMarquee: vi.fn(),
    clearEdgeSelection: vi.fn(),
  }
  const hook = renderHook(() =>
    useMindmapInteractions({
      nodes,
      links: [],
      byId,
      edges: [],
      selectedNodeIds: [],
      ...actions,
    }),
  )
  return { ...hook, actions, newNode }
}

describe("useMindmapInteractions", () => {
  it("creates a node on canvas double-click and tracks hover", () => {
    const { result, actions, newNode } = setup()

    act(() => {
      result.current.onCanvasDoubleClick(mouseEvent(250, 180))
    })
    act(() => {
      result.current.onNodePointerEnter("a")
    })
    expect(result.current.hoveredId).toBe("a")

    act(() => {
      result.current.onNodePointerLeave("a")
    })

    expect(actions.addNode).toHaveBeenCalled()
    expect(actions.focusNode).toHaveBeenCalledWith(newNode.id)
    expect(result.current.hoveredId).toBeNull()
  })

  it("routes marquee pointer movement and selection", () => {
    const { result, actions } = setup()

    act(() => {
      result.current.onBackgroundPointerDown(pointerEvent(0, 0))
    })
    act(() => {
      result.current.onPointerMove(pointerEvent(200, 200))
    })

    expect(result.current.marquee).not.toBeNull()

    act(() => {
      result.current.onPointerUp(pointerEvent(200, 200))
    })

    expect(actions.selectMarquee).toHaveBeenCalled()
  })

  it("routes node dragging through move and finish", () => {
    const { result, actions } = setup()

    act(() => {
      result.current.onNodePointerDown(
        pointerEvent(100, 100) as unknown as PointerEvent<SVGGElement>,
        "a",
      )
    })
    act(() => {
      result.current.onPointerMove(pointerEvent(140, 130))
    })

    expect(actions.selectNode).toHaveBeenCalledWith("a", false)
    expect(actions.moveNodes).toHaveBeenCalled()

    act(() => {
      result.current.onPointerUp(pointerEvent(140, 130))
    })
    expect(result.current.drag).toBeNull()
  })

  it("creates a connected node from a dragged handle", () => {
    const { result, actions, newNode } = setup()

    act(() => {
      result.current.startConnect(
        pointerEvent(180, 100) as unknown as PointerEvent<SVGPathElement>,
        "a",
        "right",
      )
    })
    expect(result.current.connect).not.toBeNull()

    act(() => {
      result.current.onPointerMove(pointerEvent(400, 400))
    })
    act(() => {
      result.current.onPointerUp(pointerEvent(400, 400))
    })

    expect(actions.addNode).toHaveBeenCalled()
    expect(actions.addLink).toHaveBeenCalledWith({
      from: "a",
      to: newNode.id,
      fromSide: "right",
      toSide: "left",
    })
    expect(actions.focusNode).toHaveBeenCalledWith(newNode.id)
    expect(result.current.connect).toBeNull()
  })

  it("cancels all modes and edge hover on pointer leave", () => {
    const { result, actions } = setup()

    act(() => {
      result.current.onNodePointerDown(
        pointerEvent(100, 100) as unknown as PointerEvent<SVGGElement>,
        "a",
      )
    })
    act(() => {
      result.current.onPointerLeave()
    })

    expect(result.current.drag).toBeNull()
    expect(actions.moveNodes).not.toHaveBeenCalled()
  })
})
