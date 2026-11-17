import { describe, expect, it } from "vitest"

import { initialMindmapState, mindmapReducer } from "./mindmapReducer"
import { makeLink, makeNode } from "../test/fixtures"

describe("mindmap reducer", () => {
  it("adds and removes nodes along with their incident links", () => {
    const first = makeNode({ id: "a" })
    const second = makeNode({ id: "b", x: 300 })
    const link = makeLink({ id: "edge", from: "a", to: "b" })

    let state = mindmapReducer(initialMindmapState, { type: "add-node", node: first })
    state = mindmapReducer(state, { type: "add-node", node: second })
    state = mindmapReducer(state, { type: "add-link", link })
    state = mindmapReducer(state, { type: "remove-node", id: "a" })

    expect(state.nodes.map((node) => node.id)).toEqual(["b"])
    expect(state.links).toEqual([])
  })

  it("renames a node and updates its measured width", () => {
    const state = mindmapReducer(initialMindmapState, { type: "add-node", node: makeNode() })

    const renamed = mindmapReducer(state, {
      type: "rename",
      id: "n1",
      label: "A much longer label",
      width: 240,
    })

    expect(renamed.nodes[0]).toMatchObject({ label: "A much longer label", width: 240 })
  })

  it("stores Learn blocks, Quiz questions, and status changes", () => {
    let state = mindmapReducer(initialMindmapState, { type: "add-node", node: makeNode() })

    state = mindmapReducer(state, {
      type: "set-blocks",
      id: "n1",
      blocks: ["# Notes", "- item"],
    })
    state = mindmapReducer(state, {
      type: "set-questions",
      id: "n1",
      questions: [
        { id: "q1", prompt: "Question?", options: ["A", "B"], answerIndex: 1 },
      ],
    })
    state = mindmapReducer(state, { type: "set-status", id: "n1", status: "done" })

    expect(state.nodes[0].blocks).toEqual(["# Notes", "- item"])
    expect(state.nodes[0].questions[0].answerIndex).toBe(1)
    expect(state.nodes[0].status).toBe("done")
  })

  it("replaces the whole graph when a map is loaded", () => {
    const nodes = [makeNode({ id: "loaded" })]
    const links = [makeLink({ id: "loaded-edge", from: "loaded", to: "loaded" })]

    const state = mindmapReducer(initialMindmapState, { type: "replace", nodes, links })

    expect(state).toEqual({ nodes, links })
  })

  it("moves several nodes in one action", () => {
    let state = mindmapReducer(initialMindmapState, { type: "add-node", node: makeNode() })
    state = mindmapReducer(state, {
      type: "add-node",
      node: makeNode({ id: "n2", x: 300 }),
    })

    state = mindmapReducer(state, {
      type: "move-nodes",
      moves: [
        { id: "n1", x: 10, y: 20 },
        { id: "n2", x: 40, y: 50 },
      ],
    })

    expect(state.nodes.map((node) => [node.x, node.y])).toEqual([
      [10, 20],
      [40, 50],
    ])
  })

  it("updates and removes links", () => {
    let state = mindmapReducer(initialMindmapState, { type: "add-link", link: makeLink() })

    state = mindmapReducer(state, {
      type: "update-link",
      id: "l1",
      patch: { toSide: "top" },
    })
    expect(state.links[0].toSide).toBe("top")

    state = mindmapReducer(state, { type: "remove-link", id: "l1" })
    expect(state.links).toEqual([])
  })
})
