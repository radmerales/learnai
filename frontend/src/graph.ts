export type Node = {
  id: string
  label: string
  x: number
  y: number
  parentId: string | null
}

export type Side = "top" | "right" | "bottom" | "left"

export type Link = {
  id: string
  from: string
  to: string
  fromSide: Side
  toSide: Side
}

export type TreeSides = Record<string, { fromSide: Side; toSide: Side }>

export type Point = { x: number; y: number }

export type EdgeKind = "tree" | "link"

export type RenderedEdge = {
  id: string
  kind: EdgeKind
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

export function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export function sidePoint(node: Node, side: Side): Point {
  switch (side) {
    case "top":
      return { x: node.x, y: node.y - NODE_H / 2 }
    case "right":
      return { x: node.x + NODE_W / 2, y: node.y }
    case "bottom":
      return { x: node.x, y: node.y + NODE_H / 2 }
    case "left":
      return { x: node.x - NODE_W / 2, y: node.y }
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

export function localHandlePoint(side: Side): Point {
  switch (side) {
    case "top":
      return { x: NODE_W / 2, y: 0 }
    case "right":
      return { x: NODE_W, y: NODE_H / 2 }
    case "bottom":
      return { x: NODE_W / 2, y: NODE_H }
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
  const dx = (point.x - node.x) / (NODE_W / 2)
  const dy = (point.y - node.y) / (NODE_H / 2)
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "right" : "left"
  return dy >= 0 ? "bottom" : "top"
}

export function sideFromVector(dx: number, dy: number): Side {
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "right" : "left"
  return dy >= 0 ? "bottom" : "top"
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

export function isDescendant(nodes: Node[], ancestorId: string, candidateId: string): boolean {
  let cursor = nodes.find((n) => n.id === candidateId)
  const seen = new Set<string>()

  while (cursor?.parentId) {
    if (cursor.parentId === ancestorId) return true
    if (seen.has(cursor.id)) return false
    seen.add(cursor.id)
    const parentId = cursor.parentId
    cursor = nodes.find((n) => n.id === parentId)
  }

  return false
}

export function buildRenderedEdges(
  nodes: Node[],
  links: Link[],
  treeSides: TreeSides,
  byId: Map<string, Node>,
): RenderedEdge[] {
  const next: RenderedEdge[] = []

  nodes.forEach((n) => {
    if (!n.parentId) return
    const from = byId.get(n.parentId)
    if (!from) return
    const sides = treeSides[n.id] ?? { fromSide: nearestSide(from, n), toSide: nearestSide(n, from) }
    const fromPoint = sidePoint(from, sides.fromSide)
    const toPoint = sidePoint(n, sides.toSide)
    next.push({
      id: `tree-${n.id}`,
      kind: "tree",
      from,
      to: n,
      fromSide: sides.fromSide,
      toSide: sides.toSide,
      fromPoint,
      toPoint,
      path: curvePath(fromPoint, sides.fromSide, toPoint, sides.toSide),
    })
  })

  links.forEach((l) => {
    const from = byId.get(l.from)
    const to = byId.get(l.to)
    if (!from || !to) return
    const fromPoint = sidePoint(from, l.fromSide)
    const toPoint = sidePoint(to, l.toSide)
    next.push({
      id: l.id,
      kind: "link",
      from,
      to,
      fromSide: l.fromSide,
      toSide: l.toSide,
      fromPoint,
      toPoint,
      path: curvePath(fromPoint, l.fromSide, toPoint, l.toSide),
    })
  })

  return next
}
