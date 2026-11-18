import { describe, expect, it } from "vitest"

import { makeNode } from "./test/fixtures"
import { panelFocusTarget } from "./panelViewport"

const viewport = { x: 0, y: 0, scale: 1 }

describe("panelFocusTarget", () => {
  it("leaves an already centered node alone", () => {
    const node = makeNode({ x: 300, y: 300, width: 140 })

    expect(panelFocusTarget(viewport, node, 1200, 600, 600)).toBeNull()
  })

  it("centers a right-side node in the visible left half", () => {
    const node = makeNode({ x: 900, y: 300, width: 140 })

    expect(panelFocusTarget(viewport, node, 1200, 600, 600)).toEqual({
      x: -600,
      y: 0,
    })
  })

  it("accounts for zoom and vertical position", () => {
    const node = makeNode({ x: 500, y: 100, width: 140 })

    expect(panelFocusTarget({ ...viewport, scale: 1.5 }, node, 1200, 600, 600)).toEqual({
      x: -450,
      y: 150,
    })
  })

  it("does nothing when the panel leaves no usable canvas", () => {
    const node = makeNode({ x: 900 })

    expect(panelFocusTarget(viewport, node, 700, 600, 700)).toBeNull()
  })
})
