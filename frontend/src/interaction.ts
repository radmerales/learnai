import { NODE_H, NODE_W, sideTowardPoint, type Link, type Node, type Point, type Side } from "./graph"

export type ConnectDrag = {
  sourceId: string
  sourceSide: Side
  x: number
  y: number
  targetId: string | null
  targetSide: Side | null
}

export type EdgeDrag = {
  edgeId: string
  moving: "from" | "to"
  fixedNodeId: string
  fixedSide: Side
  x: number
  y: number
  targetNodeId: string | null
  targetSide: Side | null
}

export type Preview = { path: string; start: Point; end: Point }

export function hitTestNode(nodes: Node[], p: Point): Node | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i]
    if (Math.abs(p.x - n.x) <= NODE_W / 2 && Math.abs(p.y - n.y) <= NODE_H / 2) {
      return n
    }
  }
  return null
}

export function edgeExistsBetween(links: Link[], a: string, b: string, ignoreLinkId?: string): boolean {
  return links.some(
    (l) => l.id !== ignoreLinkId && ((l.from === a && l.to === b) || (l.from === b && l.to === a)),
  )
}

export function resolveEdgeTarget(
  links: Link[],
  byId: Map<string, Node>,
  hit: Node | null,
  point: Point,
  dragState: EdgeDrag,
): { node: Node; side: Side } | null {
  if (!hit) return null
  if (hit.id === dragState.fixedNodeId) return null
  if (!byId.has(dragState.fixedNodeId)) return null

  const link = links.find((l) => l.id === dragState.edgeId)
  if (!link) return null

  const otherEnd = dragState.moving === "from" ? link.to : link.from
  if (hit.id === otherEnd) return null
  if (edgeExistsBetween(links, otherEnd, hit.id, link.id)) return null

  return { node: hit, side: sideTowardPoint(hit, point) }
}

export function clampNewNodePoint(p: Point, width: number, height: number): Point {
  if (!width || !height) return p
  const pad = 10
  const minX = NODE_W / 2 + pad
  const minY = NODE_H / 2 + pad
  return {
    x: Math.min(Math.max(p.x, minX), Math.max(minX, width - NODE_W / 2 - pad)),
    y: Math.min(Math.max(p.y, minY), Math.max(minY, height - NODE_H / 2 - pad)),
  }
}
