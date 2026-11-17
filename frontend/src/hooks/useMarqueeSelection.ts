import { useState, type PointerEvent } from "react"

import { NODE_H, type Node, type Point, type RenderedEdge } from "../graph"
import type { SelectionResult } from "../interaction"

type Rect = { x: number; y: number; width: number; height: number }

type Options = {
  toSvgPoint: (clientX: number, clientY: number) => Point
  nodes: Node[]
  edges: RenderedEdge[]
  onSelect: (result: SelectionResult, additive: boolean) => void
}

function normalizeRect(a: Point, b: Point): Rect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  }
}

function intersects(a: Rect, b: Rect): boolean {
  return a.x <= b.x + b.width && a.x + a.width >= b.x && a.y <= b.y + b.height && a.y + a.height >= b.y
}

function nodeRect(node: Node): Rect {
  return {
    x: node.x - node.width / 2,
    y: node.y - NODE_H / 2,
    width: node.width,
    height: NODE_H,
  }
}

function edgeRect(edge: RenderedEdge): Rect {
  const pad = 8
  return {
    x: Math.min(edge.fromPoint.x, edge.toPoint.x) - pad,
    y: Math.min(edge.fromPoint.y, edge.toPoint.y) - pad,
    width: Math.abs(edge.fromPoint.x - edge.toPoint.x) + pad * 2,
    height: Math.abs(edge.fromPoint.y - edge.toPoint.y) + pad * 2,
  }
}

export function useMarqueeSelection({ toSvgPoint, nodes, edges, onSelect }: Options) {
  const [drag, setDrag] = useState<{ start: Point; current: Point; additive: boolean } | null>(null)

  function start(e: PointerEvent<SVGSVGElement>) {
    if (e.button !== 0) return
    const p = toSvgPoint(e.clientX, e.clientY)
    setDrag({
      start: p,
      current: p,
      additive: e.shiftKey || e.metaKey || e.ctrlKey,
    })
  }

  function move(e: PointerEvent<SVGSVGElement>) {
    if (!drag) return
    const p = toSvgPoint(e.clientX, e.clientY)
    setDrag((prev) => (prev ? { ...prev, current: p } : prev))
  }

  function finish(e: PointerEvent<SVGSVGElement>) {
    if (!drag) return
    const p = toSvgPoint(e.clientX, e.clientY)
    const rect = normalizeRect(drag.start, p)
    const moved = rect.width > 3 || rect.height > 3

    if (!moved) {
      if (!drag.additive) onSelect({ nodeIds: [], edgeIds: [] }, false)
      setDrag(null)
      return
    }

    const nodeIds = nodes.filter((node) => intersects(nodeRect(node), rect)).map((node) => node.id)
    const edgeIds = edges
      .filter((edge) => edge.from.id !== edge.to.id && intersects(edgeRect(edge), rect))
      .map((edge) => edge.id)

    onSelect({ nodeIds, edgeIds }, drag.additive)
    setDrag(null)
  }

  function cancel() {
    setDrag(null)
  }

  return {
    rect: drag ? normalizeRect(drag.start, drag.current) : null,
    active: Boolean(drag),
    start,
    move,
    finish,
    cancel,
  }
}
