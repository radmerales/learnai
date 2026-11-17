import type { Point } from "./graph"

/**
 * Convert browser viewport coordinates into SVG user-space coordinates.
 *
 * Pointer events report `clientX`/`clientY` relative to the browser window,
 * while node positions live in the SVG's own coordinate system. In this app
 * they currently match, but using the SVG matrix keeps the logic correct if
 * panning/zooming is added later.
 *
 * The raw client coordinates are a safe fallback before the SVG is measured.
 */
export function toSvgPoint(
  svg: SVGSVGElement | null,
  clientX: number,
  clientY: number,
): Point {
  if (!svg) return { x: clientX, y: clientY }

  const point = svg.createSVGPoint()
  point.x = clientX
  point.y = clientY

  const matrix = svg.getScreenCTM()
  if (!matrix) return { x: clientX, y: clientY }

  const transformed = point.matrixTransform(matrix.inverse())
  return { x: transformed.x, y: transformed.y }
}
