import { act, renderHook } from "@testing-library/react"
import type { PointerEvent } from "react"
import { describe, expect, it, vi } from "vitest"

import type { RenderedEdge } from "../graph"
import { makeLink, makeNode } from "../test/fixtures"
import { useEdgeDrag } from "./useEdgeDrag"

const source = makeNode({ id: "a", x: 100, y: 100 })
const target = makeNode({ id: "b", x: 300, y: 100 })
const replacement = makeNode({ id: "c", x: 500, y: 100 })
const link = makeLink({ id: "l1", from: "a", to: "b" })
const edge: RenderedEdge = {
  ...link,
  from: source,
  to: target,
  fromPoint: { x: 180, y: 100 },
  toPoint: { x: 230, y: 100 },
  midpoint: { x: 205, y: 100 },
  path: "",
}

function eventAt(clientX: number, clientY: number) {
  return {
    button: 0,
    clientX,
    clientY,
    stopPropagation: vi.fn(),
  } as unknown as PointerEvent<SVGCircleElement>
}

function setup() {
  const updateLink = vi.fn()
  const removeLink = vi.fn()
  const hook = renderHook(() =>
    useEdgeDrag({
      nodes: [source, target, replacement],
      links: [link],
      byId: new Map([source, target, replacement].map((node) => [node.id, node])),
      updateLink,
      removeLink,
      toSvgPoint: (clientX, clientY) => ({ x: clientX, y: clientY }),
      onStart: vi.fn(),
    }),
  )
  return { ...hook, updateLink, removeLink }
}

describe("useEdgeDrag", () => {
  it("rewires an endpoint to another node", () => {
    const { result, updateLink } = setup()

    act(() => {
      result.current.start(eventAt(180, 100), edge, "from")
    })
    act(() => {
      result.current.finish(eventAt(430, 100) as unknown as PointerEvent<SVGSVGElement>)
    })

    expect(updateLink).toHaveBeenCalledWith("l1", { from: "c", fromSide: "left" })
    expect(result.current.edgeDrag).toBeNull()
  })

  it("removes the edge when released over empty canvas", () => {
    const { result, removeLink } = setup()

    act(() => {
      result.current.start(eventAt(180, 100), edge, "from")
    })
    act(() => {
      result.current.finish(eventAt(800, 100) as unknown as PointerEvent<SVGSVGElement>)
    })

    expect(removeLink).toHaveBeenCalledWith("l1")
  })
})
