import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useMindmapGraph } from "./useMindmapGraph"

beforeEach(() => {
  // jsdom has no canvas implementation; the app falls back to a width estimate.
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => null)
})

describe("useMindmapGraph", () => {
  it("adds nodes with defaults and independent IDs", () => {
    const { result } = renderHook(() => useMindmapGraph())

    let first
    act(() => {
      first = result.current.addNode({ x: 10, y: 20 })
      result.current.addNode({ x: 30, y: 40 })
    })

    expect(result.current.nodes).toHaveLength(2)
    expect(first).toMatchObject({
      label: "Node 1",
      blocks: [""],
      questions: [],
      status: "todo",
      x: 10,
      y: 20,
    })
    expect(result.current.nodes[1].label).toBe("Node 2")
  })

  it("renames, updates content/status, and removes nodes", () => {
    const { result } = renderHook(() => useMindmapGraph())
    let id = ""

    act(() => {
      id = result.current.addNode({ x: 0, y: 0 }).id
    })
    act(() => result.current.renameNode(id, "Biology"))
    act(() => result.current.setNodeBlocks(id, ["# Notes"]))
    act(() =>
      result.current.setNodeQuestions(id, [
        { id: "q1", prompt: "Q?", options: ["A", "B"], answerIndex: 1 },
      ]),
    )
    act(() => result.current.setNodeStatus(id, "done"))

    expect(result.current.nodes[0]).toMatchObject({
      label: "Biology",
      blocks: ["# Notes"],
      status: "done",
    })
    expect(result.current.nodes[0].questions[0].answerIndex).toBe(1)

    act(() => result.current.removeNode(id))
    expect(result.current.nodes).toEqual([])
  })

  it("creates, updates, and removes links", () => {
    const { result } = renderHook(() => useMindmapGraph())
    let first = ""
    let second = ""

    act(() => {
      first = result.current.addNode({ x: 0, y: 0 }).id
      second = result.current.addNode({ x: 200, y: 0 }).id
    })
    act(() =>
      result.current.addLink({
        from: first,
        to: second,
        fromSide: "right",
        toSide: "left",
      }),
    )

    expect(result.current.links).toHaveLength(1)
    expect(result.current.links[0]).toMatchObject({ text: "", arrow: "none" })
    const linkId = result.current.links[0].id

    act(() =>
      result.current.updateLink(linkId, {
        toSide: "top",
        text: "causes",
        arrow: "forward",
      }),
    )
    expect(result.current.links[0]).toMatchObject({
      toSide: "top",
      text: "causes",
      arrow: "forward",
    })

    act(() => result.current.removeLink(linkId))
    expect(result.current.links).toEqual([])
  })

  it("creates, updates, moves, and removes text annotations", () => {
    const { result } = renderHook(() => useMindmapGraph())
    let id = ""

    act(() => {
      id = result.current.addText({ x: 200, y: 100 }, "Note").id
    })
    expect(result.current.texts[0]).toMatchObject({ text: "Note", x: 90, y: 78, width: 220 })

    act(() => result.current.updateText(id, "Updated"))
    act(() => result.current.moveText(id, 50, 60))
    expect(result.current.texts[0]).toMatchObject({ text: "Updated", x: 50, y: 60 })

    act(() => result.current.removeText(id))
    expect(result.current.texts).toEqual([])
  })

  it("replaces state and continues numbering from loaded labels", () => {
    const { result } = renderHook(() => useMindmapGraph())

    act(() => {
      result.current.replaceState(
        [{ id: "loaded", label: "Node 7", blocks: [""], questions: [], status: "todo", x: 0, y: 0, width: 140 }],
        [],
      )
    })

    expect(result.current.nodes[0].label).toBe("Node 7")

    act(() => {
      result.current.addNode({ x: 1, y: 2 })
    })
    expect(result.current.nodes[1].label).toBe("Node 8")
  })

  it("moves several nodes together", () => {
    const { result } = renderHook(() => useMindmapGraph())

    act(() => {
      result.current.replaceState(
        [
          { id: "a", label: "A", blocks: [""], questions: [], status: "todo", x: 0, y: 0, width: 140 },
          { id: "b", label: "B", blocks: [""], questions: [], status: "todo", x: 10, y: 10, width: 140 },
        ],
        [],
      )
    })
    act(() =>
      result.current.moveNodes([
        { id: "a", x: 50, y: 60 },
        { id: "b", x: 70, y: 80 },
      ]),
    )

    expect(result.current.nodes.map((node) => [node.x, node.y])).toEqual([
      [50, 60],
      [70, 80],
    ])
  })
})
