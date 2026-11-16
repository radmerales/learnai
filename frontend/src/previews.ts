import {
  NODE_W,
  curvePath,
  nearestSide,
  oppositeSide,
  sideFromVector,
  sidePoint,
  type Node,
  type Point,
} from "./graph"
import type { ConnectDrag, EdgeDrag, Preview } from "./interaction"

export function buildGhostNode(connect: ConnectDrag | null, point: Point | null, hoverNode: Node | null): Node | null {
  if (!connect || !point || hoverNode) return null
  return {
    id: "__ghost__",
    label: "New node",
    content: "",
    x: point.x,
    y: point.y,
    width: NODE_W,
  }
}

export function buildConnectPreview(
  connect: ConnectDrag | null,
  byId: Map<string, Node>,
  ghostNode: Node | null,
): Preview | null {
  if (!connect) return null
  const source = byId.get(connect.sourceId)
  if (!source) return null

  const start = sidePoint(source, connect.sourceSide)
  const target = connect.targetId ? byId.get(connect.targetId) ?? null : ghostNode
  // A ghost node always receives the edge on the side opposite the dragged
  // handle, so its preview stays stable instead of flipping sides as the
  // pointer moves around the source node.
  const targetSide = target ? (connect.targetId ? connect.targetSide ?? nearestSide(target, source) : oppositeSide(connect.sourceSide)) : null
  const end = target && targetSide ? sidePoint(target, targetSide) : { x: connect.x, y: connect.y }
  const endSide = targetSide ?? sideFromVector(end.x - start.x, end.y - start.y)

  return { path: curvePath(start, connect.sourceSide, end, endSide), start, end }
}

export function buildEdgePreview(edgeDrag: EdgeDrag | null, byId: Map<string, Node>): Preview | null {
  if (!edgeDrag) return null
  const fixed = byId.get(edgeDrag.fixedNodeId)
  if (!fixed) return null

  const start = sidePoint(fixed, edgeDrag.fixedSide)
  const target = edgeDrag.targetNodeId ? byId.get(edgeDrag.targetNodeId) ?? null : null
  const targetSide = target ? edgeDrag.targetSide : null
  const end = target && targetSide ? sidePoint(target, targetSide) : { x: edgeDrag.x, y: edgeDrag.y }
  const endSide = targetSide ?? sideFromVector(end.x - start.x, end.y - start.y)

  return { path: curvePath(start, edgeDrag.fixedSide, end, endSide), start, end }
}
