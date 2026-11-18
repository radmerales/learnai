import {
  NODE_H,
  curveGeometry,
  measureTextBoxHeight,
  type Node,
  type RenderedEdge,
  type TextBox,
} from "./graph"

export type SelectionBox = { x: number; y: number; width: number; height: number }

type Bounds = { minX: number; minY: number; maxX: number; maxY: number }

function cubicAt(p0: number, p1: number, p2: number, p3: number, t: number) {
  const mt = 1 - t
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3
}

function derivativeRoots(p0: number, p1: number, p2: number, p3: number): number[] {
  const a = -p0 + 3 * p1 - 3 * p2 + p3
  const b = 2 * (p0 - 2 * p1 + p2)
  const c = p1 - p0

  if (Math.abs(a) < 1e-6) {
    if (Math.abs(b) < 1e-6) return []
    const t = -c / b
    return t > 0 && t < 1 ? [t] : []
  }

  const discriminant = b * b - 4 * a * c
  if (discriminant < 0) return []

  const root = Math.sqrt(discriminant)
  return [(-b + root) / (2 * a), (-b - root) / (2 * a)].filter((t) => t > 0 && t < 1)
}

function extents(p0: number, p1: number, p2: number, p3: number) {
  const values = [p0, p3, ...derivativeRoots(p0, p1, p2, p3).map((t) => cubicAt(p0, p1, p2, p3, t))]
  return { min: Math.min(...values), max: Math.max(...values) }
}

function edgeBounds(edge: RenderedEdge): Bounds {
  const { start, c1, c2, end } = curveGeometry(edge.fromPoint, edge.fromSide, edge.toPoint, edge.toSide)
  const x = extents(start.x, c1.x, c2.x, end.x)
  const y = extents(start.y, c1.y, c2.y, end.y)
  return { minX: x.min, minY: y.min, maxX: x.max, maxY: y.max }
}

function include(bounds: Bounds | null, minX: number, minY: number, maxX: number, maxY: number): Bounds {
  if (!bounds) return { minX, minY, maxX, maxY }
  return {
    minX: Math.min(bounds.minX, minX),
    minY: Math.min(bounds.minY, minY),
    maxX: Math.max(bounds.maxX, maxX),
    maxY: Math.max(bounds.maxY, maxY),
  }
}

export function getSelectionBounds(
  nodes: Node[],
  edges: RenderedEdge[],
  texts: TextBox[],
  selectedNodeIds: string[],
  selectedEdgeIds: string[],
  selectedTextIds: string[],
): SelectionBox | null {
  if (selectedNodeIds.length + selectedEdgeIds.length + selectedTextIds.length < 2) {
    return null
  }

  const nodeIds = new Set(selectedNodeIds)
  const edgeIds = new Set(selectedEdgeIds)
  const textIds = new Set(selectedTextIds)
  let bounds: Bounds | null = null

  for (const node of nodes) {
    if (!nodeIds.has(node.id)) continue
    bounds = include(bounds, node.x - node.width / 2, node.y - NODE_H / 2, node.x + node.width / 2, node.y + NODE_H / 2)
  }

  for (const edge of edges) {
    if (!edgeIds.has(edge.id)) continue
    const edgeBox = edgeBounds(edge)
    bounds = include(bounds, edgeBox.minX, edgeBox.minY, edgeBox.maxX, edgeBox.maxY)
  }

  for (const text of texts) {
    if (!textIds.has(text.id)) continue
    bounds = include(
      bounds,
      text.x,
      text.y,
      text.x + text.width,
      text.y + measureTextBoxHeight(text.text),
    )
  }

  if (!bounds) return null

  const pad = 8
  return {
    x: bounds.minX - pad,
    y: bounds.minY - pad,
    width: bounds.maxX - bounds.minX + pad * 2,
    height: bounds.maxY - bounds.minY + pad * 2,
  }
}
