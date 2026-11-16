export type Node = {
  id: string
  label: string
  x: number
  y: number
  width: number
}

export type Side = "top" | "right" | "bottom" | "left"

export type Link = {
  id: string
  from: string
  to: string
  fromSide: Side
  toSide: Side
}

export type Point = { x: number; y: number }

export type RenderedEdge = {
  id: string
  from: Node
  to: Node
  fromSide: Side
  toSide: Side
  fromPoint: Point
  toPoint: Point
  path: string
}

export const NODE_W = 140
export const NODE_H = 44
export const HANDLE_R = 5
export const SIDES: Side[] = ["top", "right", "bottom", "left"]

const NODE_TEXT_FONT = '14px "IBM Plex Sans", sans-serif'
const NODE_TEXT_PADDING = 32

let measureContext: CanvasRenderingContext2D | null | undefined

function getMeasureContext() {
  if (measureContext !== undefined) return measureContext
  if (typeof document === "undefined") {
    measureContext = null
    return measureContext
  }
  measureContext = document.createElement("canvas").getContext("2d")
  return measureContext
}

/** Grow the node from its 140px minimum until the single-line label fits. */
export function measureNodeWidth(label: string): number {
  const context = getMeasureContext()
  if (!context) return Math.max(NODE_W, label.length * 8 + NODE_TEXT_PADDING)
  context.font = NODE_TEXT_FONT
  return Math.max(NODE_W, Math.ceil(context.measureText(label).width + NODE_TEXT_PADDING))
}

export function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export function sidePoint(node: Node, side: Side): Point {
  switch (side) {
    case "top":
      return { x: node.x, y: node.y - NODE_H / 2 }
    case "right":
      return { x: node.x + node.width / 2, y: node.y }
    case "bottom":
      return { x: node.x, y: node.y + NODE_H / 2 }
    case "left":
      return { x: node.x - node.width / 2, y: node.y }
  }
}

export function sideNormal(side: Side): Point {
  switch (side) {
    case "top":
      return { x: 0, y: -1 }
    case "right":
      return { x: 1, y: 0 }
    case "bottom":
      return { x: 0, y: 1 }
    case "left":
      return { x: -1, y: 0 }
  }
}

export function localHandlePoint(width: number, side: Side): Point {
  switch (side) {
    case "top":
      return { x: width / 2, y: 0 }
    case "right":
      return { x: width, y: NODE_H / 2 }
    case "bottom":
      return { x: width / 2, y: NODE_H }
    case "left":
      return { x: 0, y: NODE_H / 2 }
  }
}

export function nearestSide(from: Node, to: Node): Side {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "right" : "left"
  return dy >= 0 ? "bottom" : "top"
}

/**
 * Pick the side whose midpoint the pointer is closest to in normalized node
 * space. Normalizing by half-width/height prevents the wider axis from winning
 * just because the node is rectangular.
 */
export function sideTowardPoint(node: Node, point: Point): Side {
  const dx = (point.x - node.x) / (node.width / 2)
  const dy = (point.y - node.y) / (NODE_H / 2)
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "right" : "left"
  return dy >= 0 ? "bottom" : "top"
}

export function sideFromVector(dx: number, dy: number): Side {
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "right" : "left"
  return dy >= 0 ? "bottom" : "top"
}

export function oppositeSide(side: Side): Side {
  switch (side) {
    case "top":
      return "bottom"
    case "right":
      return "left"
    case "bottom":
      return "top"
    case "left":
      return "right"
  }
}

function round(n: number) {
  return Math.round(n * 100) / 100
}

/**
 * Cubic Bézier whose tangent at each endpoint is perpendicular to the anchor
 * side. This keeps the line exiting and entering a node straight-on before it
 * curves through the middle, similar to a canvas connector.
 */
export function curvePath(fromPoint: Point, fromSide: Side, toPoint: Point, toSide: Side): string {
  const distance = Math.hypot(toPoint.x - fromPoint.x, toPoint.y - fromPoint.y)
  const bend = Math.max(36, Math.min(170, distance * 0.45))
  const n1 = sideNormal(fromSide)
  const n2 = sideNormal(toSide)

  const c1 = {
    x: fromPoint.x + n1.x * bend,
    y: fromPoint.y + n1.y * bend,
  }
  const c2 = {
    x: toPoint.x + n2.x * bend,
    y: toPoint.y + n2.y * bend,
  }

  return `M ${round(fromPoint.x)} ${round(fromPoint.y)} C ${round(c1.x)} ${round(c1.y)}, ${round(c2.x)} ${round(c2.y)}, ${round(toPoint.x)} ${round(toPoint.y)}`
}

export function buildRenderedEdges(links: Link[], byId: Map<string, Node>): RenderedEdge[] {
  const next: RenderedEdge[] = []

  links.forEach((link) => {
    const from = byId.get(link.from)
    const to = byId.get(link.to)
    if (!from || !to) return
    const fromPoint = sidePoint(from, link.fromSide)
    const toPoint = sidePoint(to, link.toSide)
    next.push({
      id: link.id,
      from,
      to,
      fromSide: link.fromSide,
      toSide: link.toSide,
      fromPoint,
      toPoint,
      path: curvePath(fromPoint, link.fromSide, toPoint, link.toSide),
    })
  })

  return next
}
