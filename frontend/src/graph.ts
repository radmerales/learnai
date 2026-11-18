import type { QuizQuestion } from "./quiz"
import type { NoteStatus } from "./status"

export type Node = {
  id: string
  label: string
  blocks: string[]
  questions: QuizQuestion[]
  status: NoteStatus
  x: number
  y: number
  width: number
}

export type Side = "top" | "right" | "bottom" | "left"

export type ArrowMode = "none" | "forward" | "backward" | "both"

export type Link = {
  id: string
  from: string
  to: string
  fromSide: Side
  toSide: Side
  text: string
  arrow: ArrowMode
}

/** A free-standing canvas annotation, separate from a mindmap node. */
export type TextBox = {
  id: string
  text: string
  x: number
  y: number
  width: number
}

export type Point = { x: number; y: number }

export type LabelBox = { x: number; y: number; width: number; height: number }

export type RenderedEdge = {
  id: string
  from: Node
  to: Node
  fromSide: Side
  toSide: Side
  fromPoint: Point
  toPoint: Point
  midpoint: Point
  text: string
  arrow: ArrowMode
  path: string
}

export const NODE_W = 140
export const NODE_H = 44
export const TEXT_BOX_W = 220
export const TEXT_BOX_MIN_H = 44
export const HANDLE_R = 4.5
export const HANDLE_HIT_R = 36
const ANCHOR_OFFSET = 10
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

/** Continue node numbering after the highest "Node N" label in a loaded map. */
export function nextNodeNumber(nodes: Node[]): number {
  let highest = 0
  for (const node of nodes) {
    const match = /^Node (\d+)$/.exec(node.label)
    if (match) highest = Math.max(highest, Number(match[1]))
  }
  return highest + 1
}

export function sidePoint(node: Node, side: Side): Point {
  switch (side) {
    case "top":
      return { x: node.x, y: node.y - NODE_H / 2 - ANCHOR_OFFSET }
    case "right":
      return { x: node.x + node.width / 2 + ANCHOR_OFFSET, y: node.y }
    case "bottom":
      return { x: node.x, y: node.y + NODE_H / 2 + ANCHOR_OFFSET }
    case "left":
      return { x: node.x - node.width / 2 - ANCHOR_OFFSET, y: node.y }
  }
}

function sideNormal(side: Side): Point {
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
      return { x: width / 2, y: -ANCHOR_OFFSET }
    case "right":
      return { x: width + ANCHOR_OFFSET, y: NODE_H / 2 }
    case "bottom":
      return { x: width / 2, y: NODE_H + ANCHOR_OFFSET }
    case "left":
      return { x: -ANCHOR_OFFSET, y: NODE_H / 2 }
  }
}

/**
 * A half-disc hit target that extends outward from the node border only. The
 * flat edge sits on the border, so the hit area covers the 5px anchor offset
 * without overlapping the node body. Dragging inside the node always moves the
 * node instead of starting a connection.
 */
export function localHandleHitPath(width: number, side: Side, radius = HANDLE_HIT_R): string {
  const anchor = localHandlePoint(width, side)
  const x = anchor.x
  const y = anchor.y

  switch (side) {
    case "top":
      return `M ${x - radius} ${y + ANCHOR_OFFSET} A ${radius} ${radius} 0 0 1 ${x + radius} ${y + ANCHOR_OFFSET} Z`
    case "right":
      return `M ${x - ANCHOR_OFFSET} ${y - radius} A ${radius} ${radius} 0 0 1 ${x - ANCHOR_OFFSET} ${y + radius} Z`
    case "bottom":
      return `M ${x - radius} ${y - ANCHOR_OFFSET} A ${radius} ${radius} 0 0 0 ${x + radius} ${y - ANCHOR_OFFSET} Z`
    case "left":
      return `M ${x + ANCHOR_OFFSET} ${y - radius} A ${radius} ${radius} 0 0 0 ${x + ANCHOR_OFFSET} ${y + radius} Z`
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

export type CurveGeometry = {
  start: Point
  c1: Point
  c2: Point
  end: Point
}

/**
 * Cubic Bézier whose tangent at each endpoint is perpendicular to the anchor
 * side. This keeps the line exiting and entering a node straight-on before it
 * curves through the middle, similar to a canvas connector.
 */
export function curveGeometry(fromPoint: Point, fromSide: Side, toPoint: Point, toSide: Side): CurveGeometry {
  const distance = Math.hypot(toPoint.x - fromPoint.x, toPoint.y - fromPoint.y)
  const bend = Math.max(36, Math.min(170, distance * 0.45))
  const n1 = sideNormal(fromSide)
  const n2 = sideNormal(toSide)

  return {
    start: fromPoint,
    c1: {
      x: fromPoint.x + n1.x * bend,
      y: fromPoint.y + n1.y * bend,
    },
    c2: {
      x: toPoint.x + n2.x * bend,
      y: toPoint.y + n2.y * bend,
    },
    end: toPoint,
  }
}

export function curvePath(fromPoint: Point, fromSide: Side, toPoint: Point, toSide: Side): string {
  const { start, c1, c2, end } = curveGeometry(fromPoint, fromSide, toPoint, toSide)
  return `M ${round(start.x)} ${round(start.y)} C ${round(c1.x)} ${round(c1.y)}, ${round(c2.x)} ${round(c2.y)}, ${round(end.x)} ${round(end.y)}`
}

/** Bounding box used to render and mask the label under an edge. */
export function edgeLabelBox(
  edge: Pick<RenderedEdge, "text" | "midpoint">,
  padding = 0,
): LabelBox {
  const width = Math.max(24, edge.text.length * 7 + 12) + padding * 2
  return {
    x: edge.midpoint.x - width / 2,
    y: edge.midpoint.y - 10 - padding,
    width,
    height: 20 + padding * 2,
  }
}

/** Midpoint of the cubic used for edge labels. */
export function curveMidpoint(
  fromPoint: Point,
  fromSide: Side,
  toPoint: Point,
  toSide: Side,
): Point {
  const { start, c1, c2, end } = curveGeometry(fromPoint, fromSide, toPoint, toSide)
  const t = 0.5
  const mt = 1 - t
  return {
    x: mt ** 3 * start.x + 3 * mt ** 2 * t * c1.x + 3 * mt * t ** 2 * c2.x + t ** 3 * end.x,
    y: mt ** 3 * start.y + 3 * mt ** 2 * t * c1.y + 3 * mt * t ** 2 * c2.y + t ** 3 * end.y,
  }
}

/** Approximate wrapped height for a fixed-width text annotation. */
export function measureTextBoxHeight(text: string): number {
  const lines = text.split("\n").reduce((count, line) => {
    return count + Math.max(1, Math.ceil(line.length / 28))
  }, 0)
  return Math.max(TEXT_BOX_MIN_H, lines * 20 + 16)
}

/** Create an empty text annotation centered on the requested point. */
export function makeTextBox(point: Point, text = ""): TextBox {
  return {
    id: uid(),
    text,
    x: point.x - TEXT_BOX_W / 2,
    y: point.y - TEXT_BOX_MIN_H / 2,
    width: TEXT_BOX_W,
  }
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
      midpoint: curveMidpoint(fromPoint, link.fromSide, toPoint, link.toSide),
      text: link.text,
      arrow: link.arrow,
      path: curvePath(fromPoint, link.fromSide, toPoint, link.toSide),
    })
  })

  return next
}
