import { act, renderHook } from "@testing-library/react"
import type { PointerEvent } from "react"
import { describe, expect, it, vi } from "vitest"

import type { RenderedEdge } from "../graph"
import { makeNode } from "../test/fixtures"
import { useMarqueeSelection } from "./useMarqueeSelection"

function eventAt(
  clientX: number,
  clientY: number,
  overrides: Partial<PointerEvent<SVGSVGElement>> = {},
) {
  return {
    button: 0,
    clientX,
    clientY,
    shiftKey: false,
    metaKey: false,
    ctrlKey: false,
    ...overrides,
  } as unknown as PointerEvent<SVGSVGElement>
}

const nodes = [
  makeNode({ id: "a", x: 100, y: 100, width: 140 }),
  makeNode({ id: "b", x: 300, y: 100, width: 140 }),
]
const edge: RenderedEdge = {
  id: "l1",
  from: nodes[0],
  to: nodes[1],
  fromSide: "right",
  toSide: "left",
  fromPoint: { x: 180, y: 100 },
  toPoint: { x: 220, y: 100 },
  midpoint: { x: 200, y: 100 },
  text: "",
  arrow: "none",
  path: "",
}

function setup() {
  const onSelect = vi.fn()
  const hook = renderHook(() =>
    useMarqueeSelection({
      toSvgPoint: (clientX, clientY) => ({ x: clientX, y: clientY }),
      nodes,
      edges: [edge],
      onSelect,
    }),
  )
  return { ...hook, onSelect }
}

describe("useMarqueeSelection", () => {
  it("selects intersecting nodes and edges", () => {
    const { result, onSelect } = setup()

    act(() => {
      result.current.start(eventAt(0, 0))
    })
    act(() => {
      result.current.move(eventAt(400, 200))
    })
    act(() => {
      result.current.finish(eventAt(400, 200))
    })

    expect(onSelect).toHaveBeenCalledWith(
      { nodeIds: ["a", "b"], edgeIds: ["l1"] },
      false,
    )
    expect(result.current.active).toBe(false)
  })

  it("clears selection on a click without movement", () => {
    const { result, onSelect } = setup()

    act(() => {
      result.current.start(eventAt(10, 10))
    })
    act(() => {
      result.current.finish(eventAt(10, 10))
    })

    expect(onSelect).toHaveBeenCalledWith({ nodeIds: [], edgeIds: [] }, false)
  })

  it("supports additive marquee selection and cancellation", () => {
    const { result, onSelect } = setup()

    act(() => {
      result.current.start(eventAt(0, 0, { shiftKey: true }))
    })
    act(() => {
      result.current.move(eventAt(400, 200))
    })
    act(() => {
      result.current.cancel()
    })

    expect(onSelect).not.toHaveBeenCalled()
    expect(result.current.rect).toBeNull()

    act(() => {
      result.current.start(eventAt(0, 0, { shiftKey: true }))
    })
    act(() => {
      result.current.move(eventAt(400, 200))
    })
    act(() => {
      result.current.finish(eventAt(400, 200))
    })
    expect(onSelect).toHaveBeenCalledWith(
      { nodeIds: ["a", "b"], edgeIds: ["l1"] },
      true,
    )
  })
})
