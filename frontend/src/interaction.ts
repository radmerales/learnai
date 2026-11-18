import {
  HANDLE_HIT_R,
  NODE_H,
  SIDES,
  sidePoint,
  sideTowardPoint,
  type Link,
  type Node,
  type Point,
  type Side,
} from "./graph"

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

export type SelectionResult = {
  nodeIds: string[]
  edgeIds: string[]
  textIds: string[]
}

export function hitTestNode(nodes: Node[], p: Point): Node | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i]
    if (Math.abs(p.x - n.x) <= n.width / 2 && Math.abs(p.y - n.y) <= NODE_H / 2) {
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

/**
 * A node can be targeted when the pointer is inside its bounds or within the
 * same 36px radius used by the endpoint edit handles. Anchors already sit 5px
 * outside the node, so this creates a forgiving halo around each side midpoint.
 */
export function findConnectCandidate(nodes: Node[], p: Point): { node: Node; side: Side } | null {
  const hit = hitTestNode(nodes, p)
  if (hit) return { node: hit, side: sideTowardPoint(hit, p) }

  let best: { node: Node; side: Side; distance: number } | null = null

  for (const node of nodes) {
    for (const side of SIDES) {
      const anchor = sidePoint(node, side)
      const distance = Math.hypot(anchor.x - p.x, anchor.y - p.y)
      if (distance <= HANDLE_HIT_R && (!best || distance < best.distance)) {
        best = { node, side, distance }
      }
    }
  }

  return best ? { node: best.node, side: best.side } : null
}

export function resolveConnectTarget(
  nodes: Node[],
  links: Link[],
  p: Point,
  sourceId: string,
): { node: Node; side: Side } | null {
  const candidate = findConnectCandidate(nodes, p)
  if (!candidate || candidate.node.id === sourceId) return null
  if (edgeExistsBetween(links, sourceId, candidate.node.id)) return null
  return candidate
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
