import { describe, expect, it } from "vitest"

import {
  edgeExistsBetween,
  findConnectCandidate,
  hitTestNode,
  resolveConnectTarget,
} from "./interaction"
import { makeLink, makeNode } from "./test/fixtures"

describe("hit testing", () => {
  it("returns the topmost node under the pointer", () => {
    const bottom = makeNode({ id: "bottom" })
    const top = makeNode({ id: "top" })

    expect(hitTestNode([bottom, top], { x: 100, y: 100 })?.id).toBe("top")
  })

  it("returns null outside every node", () => {
    expect(hitTestNode([makeNode()], { x: 400, y: 400 })).toBeNull()
  })

  it("snaps an inside pointer to the nearest side", () => {
    const candidate = findConnectCandidate([makeNode()], { x: 160, y: 100 })

    expect(candidate?.node.id).toBe("n1")
    expect(candidate?.side).toBe("right")
  })

  it("accepts points within the forgiving halo around an anchor", () => {
    // The node's top anchor sits 32px above its centre (22px half-height + 10px).
    const candidate = findConnectCandidate([makeNode()], { x: 100, y: 69 })

    expect(candidate?.side).toBe("top")
  })
})

describe("connection rules", () => {
  it("compares edges in both directions", () => {
    const links = [makeLink({ from: "a", to: "b" })]

    expect(edgeExistsBetween(links, "a", "b")).toBe(true)
    expect(edgeExistsBetween(links, "b", "a")).toBe(true)
    expect(edgeExistsBetween(links, "a", "c")).toBe(false)
  })

  it("can ignore the edge currently being rewired", () => {
    const links = [makeLink({ id: "edge-1", from: "a", to: "b" })]

    expect(edgeExistsBetween(links, "a", "b", "edge-1")).toBe(false)
  })

  it("rejects a source node and already-connected targets", () => {
    const nodes = [makeNode({ id: "a" }), makeNode({ id: "b", x: 300 })]
    const links = [makeLink({ from: "a", to: "b" })]

    expect(resolveConnectTarget(nodes, [], { x: 100, y: 100 }, "a")).toBeNull()
    expect(resolveConnectTarget(nodes, links, { x: 300, y: 100 }, "a")).toBeNull()
  })

  it("accepts an unconnected target node", () => {
    const nodes = [makeNode({ id: "a" }), makeNode({ id: "b", x: 300 })]

    expect(resolveConnectTarget(nodes, [], { x: 300, y: 100 }, "a")?.node.id).toBe("b")
  })
})
