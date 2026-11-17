import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useEdgeHover } from "./useEdgeHover"

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("useEdgeHover", () => {
  it("shows an edge and hides it after the grace period", () => {
    const { result } = renderHook(() => useEdgeHover())

    act(() => result.current.show("edge-1"))
    expect(result.current.hoveredEdgeId).toBe("edge-1")

    act(() => result.current.scheduleHide("edge-1"))
    act(() => vi.advanceTimersByTime(179))
    expect(result.current.hoveredEdgeId).toBe("edge-1")

    act(() => vi.advanceTimersByTime(1))
    expect(result.current.hoveredEdgeId).toBeNull()
  })

  it("cancels a scheduled hide and resets immediately", () => {
    const { result } = renderHook(() => useEdgeHover())

    act(() => result.current.show("edge-1"))
    act(() => result.current.scheduleHide("edge-1"))
    act(() => result.current.clear())
    act(() => vi.advanceTimersByTime(200))

    expect(result.current.hoveredEdgeId).toBe("edge-1")

    act(() => result.current.reset())
    expect(result.current.hoveredEdgeId).toBeNull()
  })
})
