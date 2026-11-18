import { describe, expect, it } from "vitest"

import { buildRenderedEdges } from "./graph"
import { getSelectionBounds } from "./selectionBounds"
import { makeLink, makeNode } from "./test/fixtures"

describe("multi-selection bounds", () => {
  it("returns null when fewer than two items are selected", () => {
    expect(getSelectionBounds([makeNode()], [], [], ["n1"], [], [])).toBeNull()
    expect(getSelectionBounds([makeNode()], [], [], [], [], [])).toBeNull()
  })

  it("surrounds two nodes with an 8px padded box", () => {
    const nodes = [
      makeNode({ id: "n1", x: 100, y: 100, width: 140 }),
      makeNode({ id: "n2", x: 300, y: 200, width: 140 }),
    ]

    expect(getSelectionBounds(nodes, [], [], ["n1", "n2"], [], [])).toEqual({
      x: 22,
      y: 70,
      width: 356,
      height: 160,
    })
  })

  it("ignores nodes that are not selected", () => {
    const nodes = [
      makeNode({ id: "n1", x: 100, y: 100 }),
      makeNode({ id: "n2", x: 300, y: 200 }),
      makeNode({ id: "far-away", x: 2_000, y: 2_000 }),
    ]

    const bounds = getSelectionBounds(nodes, [], [], ["n1", "n2"], [], [])

    expect(bounds?.width).toBe(356)
    expect(bounds?.height).toBe(160)
  })

  it("expands the box to include selected edge curves", () => {
    const nodes = [
      makeNode({ id: "a", x: 100, y: 100 }),
      makeNode({ id: "b", x: 400, y: 200 }),
    ]
    const byId = new Map(nodes.map((node) => [node.id, node]))
    const edges = buildRenderedEdges(
      [makeLink({ id: "l1", from: "a", to: "b", fromSide: "right", toSide: "left" })],
      byId,
    )

    const bounds = getSelectionBounds(nodes, edges, [], ["a"], ["l1"], [])

    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeLessThanOrEqual(edges[0].fromPoint.x)
    expect(bounds!.y).toBeLessThanOrEqual(Math.min(edges[0].fromPoint.y, edges[0].toPoint.y))
    expect(bounds!.x + bounds!.width).toBeGreaterThanOrEqual(edges[0].toPoint.x)
  })

  it("can include edge-only selections and ignores unknown IDs", () => {
    const nodes = [
      makeNode({ id: "a", x: 100, y: 100 }),
      makeNode({ id: "b", x: 400, y: 100 }),
    ]
    const byId = new Map(nodes.map((node) => [node.id, node]))
    const edge = buildRenderedEdges([makeLink({ id: "l1", from: "a", to: "b" })], byId)[0]
    const second = { ...edge, id: "l2" }

    const bounds = getSelectionBounds(nodes, [edge, second], [], [], ["l1", "l2"], [])

    expect(bounds).not.toBeNull()
    expect(getSelectionBounds(nodes, [edge], [], [], ["missing", "other"], [])).toBeNull()
  })
})
