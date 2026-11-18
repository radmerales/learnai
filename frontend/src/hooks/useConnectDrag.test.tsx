import { act, renderHook } from "@testing-library/react"
import type { PointerEvent } from "react"
import { describe, expect, it, vi } from "vitest"

import { makeNode } from "../test/fixtures"
import { useConnectDrag } from "./useConnectDrag"

function eventAt(clientX: number, clientY: number) {
  return {
    button: 0,
    clientX,
    clientY,
    stopPropagation: vi.fn(),
  } as unknown as PointerEvent<SVGGElement>
}

function setup() {
  const source = makeNode({ id: "a", x: 100, y: 100 })
  const target = makeNode({ id: "b", x: 300, y: 100 })
  const byId = new Map([source, target].map((node) => [node.id, node]))
  const addNode = vi.fn((point: { x: number; y: number }) =>
    makeNode({ id: "new", x: point.x, y: point.y }),
  )
  const addLink = vi.fn()
  const focusNode = vi.fn()

  const hook = renderHook(() =>
    useConnectDrag({
      nodes: [source, target],
      links: [],
      byId,
      addNode,
      addLink,
      focusNode,
      toSvgPoint: (clientX, clientY) => ({ x: clientX, y: clientY }),
    }),
  )

  return { ...hook, addNode, addLink, focusNode }
}

describe("useConnectDrag", () => {
  it("links to an existing target and snaps to the nearest side", () => {
    const { result, addLink } = setup()

    act(() => {
      result.current.start(eventAt(180, 100) as PointerEvent<SVGPathElement>, "a", "right")
    })
    act(() => {
      result.current.finish(eventAt(230, 100) as PointerEvent<SVGSVGElement>)
    })

    expect(addLink).toHaveBeenCalledWith({
      from: "a",
      to: "b",
      fromSide: "right",
      toSide: "left",
    })
    expect(result.current.connect).toBeNull()
  })

  it("creates a connected node when released on empty canvas", () => {
    const { result, addNode, addLink, focusNode } = setup()

    act(() => {
      result.current.start(eventAt(180, 100) as PointerEvent<SVGPathElement>, "a", "right")
    })
    act(() => {
      result.current.finish(eventAt(600, 100) as PointerEvent<SVGSVGElement>)
    })

    expect(addNode).toHaveBeenCalledWith({ x: 600, y: 100 })
    expect(addLink).toHaveBeenCalledWith({
      from: "a",
      to: "new",
      fromSide: "right",
      toSide: "left",
    })
    expect(focusNode).toHaveBeenCalledWith("new")
  })
})
