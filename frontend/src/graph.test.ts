import { describe, expect, it } from "vitest"

import {
  buildRenderedEdges,
  curveGeometry,
  curvePath,
  localHandleHitPath,
  localHandlePoint,
  nearestSide,
  nextNodeNumber,
  sideFromVector,
  sidePoint,
  sideTowardPoint,
  uid,
} from "./graph"
import { makeLink, makeNode } from "./test/fixtures"

describe("node helpers", () => {
  it("creates non-empty random ids", () => {
    expect(uid()).not.toBe("")
    expect(uid()).not.toBe(uid())
  })

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

  it("computes local handles and half-disc hit areas", () => {
    expect(localHandlePoint(140, "top")).toEqual({ x: 70, y: -10 })
    expect(localHandlePoint(140, "right")).toEqual({ x: 150, y: 22 })
    expect(localHandlePoint(140, "bottom")).toEqual({ x: 70, y: 54 })
    expect(localHandlePoint(140, "left")).toEqual({ x: -10, y: 22 })

    for (const side of ["top", "right", "bottom", "left"] as const) {
      const path = localHandleHitPath(140, side)
      expect(path.startsWith("M ")).toBe(true)
      expect(path.endsWith(" Z")).toBe(true)
    }
  })

  it("picks a side from a direction vector", () => {
    expect(sideFromVector(10, 1)).toBe("right")
    expect(sideFromVector(-10, 1)).toBe("left")
    expect(sideFromVector(1, 10)).toBe("bottom")
    expect(sideFromVector(1, -10)).toBe("top")
  })

  it("picks the nearest side toward a point", () => {
    const node = makeNode()

    expect(sideTowardPoint(node, { x: 200, y: 100 })).toBe("right")
    expect(sideTowardPoint(node, { x: 0, y: 100 })).toBe("left")
    expect(sideTowardPoint(node, { x: 100, y: 200 })).toBe("bottom")
    expect(sideTowardPoint(node, { x: 100, y: 0 })).toBe("top")
  })

  it("picks the side facing another node", () => {
    const from = makeNode({ id: "from", x: 100, y: 100 })

    expect(nearestSide(from, makeNode({ x: 500, y: 100 }))).toBe("right")
    expect(nearestSide(from, makeNode({ x: -500, y: 100 }))).toBe("left")
    expect(nearestSide(from, makeNode({ x: 100, y: 500 }))).toBe("bottom")
    expect(nearestSide(from, makeNode({ x: 100, y: -500 }))).toBe("top")
  })
})

describe("edge geometry", () => {
  it("builds control points perpendicular to each side", () => {
    const geometry = curveGeometry(
      { x: 0, y: 0 },
      "right",
      { x: 100, y: 50 },
      "left",
    )

    expect(geometry.start).toEqual({ x: 0, y: 0 })
    expect(geometry.end).toEqual({ x: 100, y: 50 })
    expect(geometry.c1.x).toBeGreaterThan(0)
    expect(geometry.c2.x).toBeLessThan(100)
  })

  it("formats a curvaceous SVG path", () => {
    const path = curvePath({ x: 0, y: 0 }, "right", { x: 100, y: 50 }, "left")

    expect(path).toMatch(/^M 0 0 C .+/)
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
