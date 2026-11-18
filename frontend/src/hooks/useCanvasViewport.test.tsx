import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { MAX_ZOOM, MIN_ZOOM, useCanvasViewport } from "./useCanvasViewport"

const size = { width: 800, height: 600 }
const svgRef = { current: null }

describe("useCanvasViewport", () => {
  it("zooms around the canvas center and back out", () => {
    const { result } = renderHook(() => useCanvasViewport(svgRef, size))

    act(() => result.current.zoomIn())
    expect(result.current.viewport).toEqual({ x: -100, y: -75, scale: 1.25 })
    expect(result.current.toWorld({ x: 400, y: 300 })).toEqual({ x: 400, y: 300 })

    act(() => result.current.zoomOut())
    expect(result.current.viewport).toEqual({ x: 0, y: 0, scale: 1 })
  })

  it("converts screen points through pan and zoom", () => {
    const { result } = renderHook(() => useCanvasViewport(svgRef, size))

    act(() => result.current.setOffset(-100, -50))
    act(() => result.current.zoomIn())
    expect(result.current.toWorld({ x: 275, y: 112.5 })).toEqual({ x: 400, y: 200 })
  })

  it("clamps the zoom range", () => {
    const { result } = renderHook(() => useCanvasViewport(svgRef, size))

    for (let index = 0; index < 10; index += 1) {
      act(() => result.current.zoomIn())
    }
    expect(result.current.viewport.scale).toBe(MAX_ZOOM)
    expect(result.current.canZoomIn).toBe(false)

    for (let index = 0; index < 20; index += 1) {
      act(() => result.current.zoomOut())
    }
    expect(result.current.viewport.scale).toBe(MIN_ZOOM)
    expect(result.current.canZoomOut).toBe(false)
  })
})
