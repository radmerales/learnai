import { useState, type PointerEvent } from "react"

import type { Link, Node, Point, RenderedEdge } from "../graph"
import { hitTestNode, resolveEdgeTarget, type EdgeDrag } from "../interaction"
import { buildEdgePreview } from "../previews"

type Options = {
  nodes: Node[]
  links: Link[]
  byId: Map<string, Node>
  updateLink: (
    id: string,
    patch: Partial<Pick<Link, "from" | "to" | "fromSide" | "toSide">>,
  ) => void
  removeLink: (id: string) => void
  toSvgPoint: (clientX: number, clientY: number) => Point
  onStart?: () => void
}

/**
 * Rewiring an existing edge by dragging one of its endpoint handles.
 *
 * Releasing over a valid node moves that endpoint. Releasing over empty
 * canvas removes the edge, matching the direct-manipulation behavior.
 */
export function useEdgeDrag({
  nodes,
  links,
  byId,
  updateLink,
  removeLink,
  toSvgPoint,
  onStart,
}: Options) {
  const [edgeDrag, setEdgeDrag] = useState<EdgeDrag | null>(null)

  function start(
    event: PointerEvent<SVGCircleElement>,
    edge: RenderedEdge,
    moving: "from" | "to",
  ) {
    event.stopPropagation()
    if (event.button !== 0) return

    onStart?.()
    const fixed = moving === "from" ? edge.to : edge.from
    const fixedSide = moving === "from" ? edge.toSide : edge.fromSide
    const point = toSvgPoint(event.clientX, event.clientY)

    setEdgeDrag({
      edgeId: edge.id,
      moving,
      fixedNodeId: fixed.id,
      fixedSide,
      x: point.x,
      y: point.y,
      targetNodeId: null,
      targetSide: null,
    })
  }

  function move(event: PointerEvent<SVGSVGElement>) {
    if (!edgeDrag) return

    const point = toSvgPoint(event.clientX, event.clientY)
    const hit = hitTestNode(nodes, point)
    const target = resolveEdgeTarget(links, byId, hit, point, edgeDrag)

    setEdgeDrag((previous) =>
      previous
        ? {
            ...previous,
            x: point.x,
            y: point.y,
            targetNodeId: target?.node.id ?? null,
            targetSide: target?.side ?? null,
          }
        : previous,
    )
  }

  function finish(event: PointerEvent<SVGSVGElement>) {
    if (!edgeDrag) return

    const point = toSvgPoint(event.clientX, event.clientY)
    const hit = hitTestNode(nodes, point)
    const target = resolveEdgeTarget(links, byId, hit, point, edgeDrag)

    if (target) {
      updateLink(
        edgeDrag.edgeId,
        edgeDrag.moving === "from"
          ? { from: target.node.id, fromSide: target.side }
          : { to: target.node.id, toSide: target.side },
      )
    } else if (!hit) {
      removeLink(edgeDrag.edgeId)
    }

    setEdgeDrag(null)
  }

  function cancel() {
    setEdgeDrag(null)
  }

  return {
    edgeDrag,
    edgePreview: buildEdgePreview(edgeDrag, byId),
    start,
    move,
    finish,
    cancel,
  }
}
