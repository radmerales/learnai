import { describe, expect, it } from "vitest"

import { NODE_W, type Node } from "./graph"
import type { ConnectDrag, EdgeDrag } from "./interaction"
import { buildConnectPreview, buildEdgePreview, buildGhostNode } from "./previews"
import { makeNode } from "./test/fixtures"

const source = makeNode({ id: "a", x: 100, y: 100 })
const target = makeNode({ id: "b", x: 300, y: 100 })
const byId = new Map([source, target].map((node) => [node.id, node]))

const connect: ConnectDrag = {
  sourceId: "a",
  sourceSide: "right",
  x: 250,
  y: 100,
  targetId: null,
  targetSide: null,
}

describe("previews", () => {
  it("creates a ghost node only while connecting over blank canvas", () => {
    const ghost = buildGhostNode(connect, { x: 500, y: 120 }, null)

    expect(ghost).toMatchObject({
      id: "__ghost__",
      label: "New node",
      status: "todo",
      x: 500,
      y: 120,
      width: NODE_W,
    })

    expect(buildGhostNode(null, { x: 0, y: 0 }, null)).toBeNull()
    expect(buildGhostNode(connect, { x: 0, y: 0 }, target)).toBeNull()
    expect(buildGhostNode(connect, null, null)).toBeNull()
  })

  it("snaps a connect preview to a target node side", () => {
    const preview = buildConnectPreview(
      { ...connect, targetId: "b" },
      byId,
      null,
    )

    expect(preview).not.toBeNull()
    expect(preview!.end).toEqual({ x: 220, y: 100 })
    expect(preview!.path.startsWith("M ")).toBe(true)
  })

  it("connects to a ghost node on the opposite side", () => {
    const ghost: Node = makeNode({ id: "__ghost__", x: 500, y: 100 })
    const preview = buildConnectPreview(connect, byId, ghost)

    expect(preview!.end).toEqual({ x: 420, y: 100 })
  })

  it("ends at the pointer when there is no target", () => {
    const preview = buildConnectPreview(connect, byId, null)

    expect(preview!.end).toEqual({ x: 250, y: 100 })
  })

  it("returns null when the connect source is missing", () => {
    expect(
      buildConnectPreview({ ...connect, sourceId: "missing" }, byId, null),
    ).toBeNull()
  })

  it("builds edge rewire previews for targets and pointer positions", () => {
    const edgeDrag: EdgeDrag = {
      edgeId: "l1",
      moving: "to",
      fixedNodeId: "a",
      fixedSide: "right",
      x: 400,
      y: 100,
      targetNodeId: "b",
      targetSide: "left",
    }

    expect(buildEdgePreview(null, byId)).toBeNull()
    expect(buildEdgePreview({ ...edgeDrag, fixedNodeId: "missing" }, byId)).toBeNull()

    const snapped = buildEdgePreview(edgeDrag, byId)
    expect(snapped!.end).toEqual({ x: 220, y: 100 })

    const free = buildEdgePreview(
      { ...edgeDrag, targetNodeId: null, targetSide: null, x: 450, y: 120 },
      byId,
    )
    expect(free!.end).toEqual({ x: 450, y: 120 })
  })
})
