import { describe, expect, it } from "vitest"

import { getSelectionBounds } from "./selectionBounds"
import { makeNode } from "./test/fixtures"

describe("multi-selection bounds", () => {
  it("returns null when fewer than two items are selected", () => {
    expect(getSelectionBounds([makeNode()], [], ["n1"], [])).toBeNull()
    expect(getSelectionBounds([makeNode()], [], [], [])).toBeNull()
  })

  it("surrounds two nodes with an 8px padded box", () => {
    const nodes = [
      makeNode({ id: "n1", x: 100, y: 100, width: 140 }),
      makeNode({ id: "n2", x: 300, y: 200, width: 140 }),
    ]

    expect(getSelectionBounds(nodes, [], ["n1", "n2"], [])).toEqual({
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

    const bounds = getSelectionBounds(nodes, [], ["n1", "n2"], [])

    expect(bounds?.width).toBe(356)
    expect(bounds?.height).toBe(160)
  })
})
