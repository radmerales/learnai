import { describe, expect, it } from "vitest"

import { buildRenderedEdges, nextNodeNumber, sideFromVector, sidePoint } from "./graph"
import { makeLink, makeNode } from "./test/fixtures"

describe("node helpers", () => {
  it("continues numbering after the highest Node N label", () => {
    const nodes = [
      makeNode({ label: "Node 3" }),
      makeNode({ label: "Node 11" }),
      makeNode({ label: "Cell biology" }),
    ]

    expect(nextNodeNumber(nodes)).toBe(12)
    expect(nextNodeNumber([])).toBe(1)
  })

  it("computes anchor points on every side", () => {
    const node = makeNode()

    expect(sidePoint(node, "top")).toEqual({ x: 100, y: 68 })
    expect(sidePoint(node, "right")).toEqual({ x: 180, y: 100 })
    expect(sidePoint(node, "bottom")).toEqual({ x: 100, y: 132 })
    expect(sidePoint(node, "left")).toEqual({ x: 20, y: 100 })
  })

  it("picks a side from a direction vector", () => {
    expect(sideFromVector(10, 1)).toBe("right")
    expect(sideFromVector(-10, 1)).toBe("left")
    expect(sideFromVector(1, 10)).toBe("bottom")
    expect(sideFromVector(1, -10)).toBe("top")
  })
})

describe("rendered edges", () => {
  it("builds a curved path between two existing nodes", () => {
    const nodes = [makeNode({ id: "a" }), makeNode({ id: "b", x: 300 })]
    const byId = new Map(nodes.map((node) => [node.id, node]))

    const edges = buildRenderedEdges([makeLink({ from: "a", to: "b" })], byId)

    expect(edges).toHaveLength(1)
    expect(edges[0].fromPoint).toEqual({ x: 180, y: 100 })
    expect(edges[0].toPoint).toEqual({ x: 220, y: 100 })
    expect(edges[0].path.startsWith("M ")).toBe(true)
  })

  it("skips links whose endpoints are missing", () => {
    const nodes = [makeNode({ id: "a" })]
    const byId = new Map(nodes.map((node) => [node.id, node]))

    expect(buildRenderedEdges([makeLink({ from: "a", to: "missing" })], byId)).toEqual([])
  })
})
