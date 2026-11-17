import { describe, expect, it, vi } from "vitest"

import { toSvgPoint } from "./canvasPoint"

describe("toSvgPoint", () => {
  it("falls back to client coordinates before the SVG is available", () => {
    expect(toSvgPoint(null, 12, 34)).toEqual({ x: 12, y: 34 })
  })

  it("uses the SVG screen matrix when available", () => {
    const matrixTransform = vi.fn(() => ({ x: 40, y: 60 }))
    const svg = {
      createSVGPoint: () => ({ x: 0, y: 0, matrixTransform }),
      getScreenCTM: () => ({ inverse: () => ({}) }),
    } as unknown as SVGSVGElement

    expect(toSvgPoint(svg, 12, 34)).toEqual({ x: 40, y: 60 })
    expect(matrixTransform).toHaveBeenCalledOnce()
  })
})
