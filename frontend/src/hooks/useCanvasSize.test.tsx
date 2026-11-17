import { renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useCanvasSize } from "./useCanvasSize"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("useCanvasSize", () => {
  it("measures the SVG after mount", () => {
    const observe = vi.fn()
    const disconnect = vi.fn()
    class ResizeObserverMock {
      constructor(_callback: ResizeObserverCallback) {}
      observe = observe
      disconnect = disconnect
    }
    vi.stubGlobal("ResizeObserver", ResizeObserverMock)
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
    vi.stubGlobal("cancelAnimationFrame", vi.fn())

    const element = { clientWidth: 800, clientHeight: 600 } as SVGSVGElement
    const ref = { current: element }
    const { result } = renderHook(() => useCanvasSize(ref))

    expect(result.current).toEqual({ width: 800, height: 600 })
    expect(observe).toHaveBeenCalledWith(element)
  })
})
