import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useMindmapSelection } from "./useMindmapSelection"

describe("useMindmapSelection", () => {
  it("selects nodes and supports additive selection", () => {
    const { result } = renderHook(() => useMindmapSelection())

    act(() => result.current.selectNode("a"))
    expect(result.current.selectedNodeIds).toEqual(["a"])
    expect(result.current.panelOpen).toBe(false)

    act(() => result.current.selectNode("b", true))
    expect(result.current.selectedNodeIds).toEqual(["a", "b"])
  })

  it("focuses a node and opens the panel", () => {
    const { result } = renderHook(() => useMindmapSelection())

    act(() => result.current.focusNode("a"))

    expect(result.current.selectedNodeIds).toEqual(["a"])
    expect(result.current.panelOpen).toBe(true)
  })

  it("selects edges and clears the other selection type", () => {
    const { result } = renderHook(() => useMindmapSelection())

    act(() => result.current.focusNode("node"))
    act(() => result.current.selectEdge("edge"))

    expect(result.current.selectedNodeIds).toEqual([])
    expect(result.current.selectedEdgeIds).toEqual(["edge"])
    expect(result.current.panelOpen).toBe(false)
  })

  it("applies marquee results and clears selections", () => {
    const { result } = renderHook(() => useMindmapSelection())

    act(() => result.current.selectMarquee({ nodeIds: ["a"], edgeIds: ["e"], textIds: ["t"] }, false))
    expect(result.current.selectedNodeIds).toEqual(["a"])
    expect(result.current.selectedEdgeIds).toEqual(["e"])
    expect(result.current.selectedTextIds).toEqual(["t"])

    act(() => result.current.selectMarquee({ nodeIds: ["b"], edgeIds: [], textIds: ["t2"] }, true))
    expect(result.current.selectedNodeIds).toEqual(["a", "b"])
    expect(result.current.selectedTextIds).toEqual(["t", "t2"])

    act(() => result.current.clearEdgeSelection())
    expect(result.current.selectedEdgeIds).toEqual([])

    act(() => result.current.clearSelection())
    expect(result.current.selectedNodeIds).toEqual([])
    expect(result.current.selectedTextIds).toEqual([])
  })

  it("selects a text box and clears nodes and edges", () => {
    const { result } = renderHook(() => useMindmapSelection())

    act(() => result.current.selectNode("a"))
    act(() => result.current.selectText("t1"))

    expect(result.current.selectedTextIds).toEqual(["t1"])
    expect(result.current.selectedNodeIds).toEqual([])
    expect(result.current.selectedEdgeIds).toEqual([])
  })

  it("closes the panel without clearing selection", () => {
    const { result } = renderHook(() => useMindmapSelection())

    act(() => result.current.focusNode("a"))
    act(() => result.current.closePanel())

    expect(result.current.panelOpen).toBe(false)
    expect(result.current.selectedNodeIds).toEqual(["a"])
  })
})
