import { describe, expect, it } from "vitest"

import { makeNode } from "./test/fixtures"
import { panelShiftX } from "./panelViewport"

const viewport = { x: 0, y: 0, scale: 1 }

describe("panelShiftX", () => {
  it("leaves an already visible node alone", () => {
    const node = makeNode({ x: 300, width: 140 })

    expect(panelShiftX(viewport, node, 1200, 600)).toBeNull()
  })

  it("shifts the canvas left when the node is under the panel", () => {
    const node = makeNode({ x: 900, width: 140 })

    // Node right edge is 970; visible edge with padding is 572.
    expect(panelShiftX(viewport, node, 1200, 600)).toBe(-398)
  })

  it("accounts for zoom when checking screen bounds", () => {
    const node = makeNode({ x: 500, width: 140 })

    expect(panelShiftX({ ...viewport, scale: 1.5 }, node, 1200, 600)).toBe(-283)
  })

  it("does nothing when the panel leaves no usable canvas", () => {
    const node = makeNode({ x: 900 })

    expect(panelShiftX(viewport, node, 700, 700)).toBeNull()
  })
})
