import { useState, type PointerEvent } from "react"

import { oppositeSide, type Link, type Node, type Point, type Side } from "../graph"
import {
  findConnectCandidate,
  resolveConnectTarget,
  type ConnectDrag,
} from "../interaction"
import { buildConnectPreview, buildGhostNode } from "../previews"

type Options = {
  nodes: Node[]
  links: Link[]
  byId: Map<string, Node>
  addNode: (point: Point) => Node
  addLink: (
    link: Omit<Link, "id" | "text" | "arrow"> &
      Partial<Pick<Link, "text" | "arrow">>,
  ) => void
  focusNode: (id: string) => void
  toSvgPoint: (clientX: number, clientY: number) => Point
  onStart?: () => void
}

/**
 * Creating an edge by dragging from a node's side handle.
 *
 * Releasing over another node creates a link. Releasing on empty canvas
 * creates a new node at the pointer and links the source to it.
 */
export function useConnectDrag({
  nodes,
  links,
  byId,
  addNode,
  addLink,
  focusNode,
  toSvgPoint,
  onStart,
}: Options) {
  const [connect, setConnect] = useState<ConnectDrag | null>(null)

  function start(event: PointerEvent<SVGPathElement>, id: string, side: Side) {
    event.stopPropagation()
    if (event.button !== 0) return

    onStart?.()
    const point = toSvgPoint(event.clientX, event.clientY)
    setConnect({
      sourceId: id,
      sourceSide: side,
      x: point.x,
      y: point.y,
      targetId: null,
      targetSide: null,
    })
  }

  function move(event: PointerEvent<SVGSVGElement>) {
    if (!connect) return

    const point = toSvgPoint(event.clientX, event.clientY)
    const target = resolveConnectTarget(nodes, links, point, connect.sourceId)
    setConnect((previous) =>
      previous
        ? {
            ...previous,
            x: point.x,
            y: point.y,
            targetId: target?.node.id ?? null,
            targetSide: target?.side ?? null,
          }
        : previous,
    )
  }

  function finish(event: PointerEvent<SVGSVGElement>) {
    if (!connect) return

    const point = toSvgPoint(event.clientX, event.clientY)
    const source = byId.get(connect.sourceId)
    const candidate = findConnectCandidate(nodes, point)
    const target = resolveConnectTarget(nodes, links, point, connect.sourceId)

    if (source && target) {
      addLink({
        from: source.id,
        to: target.node.id,
        fromSide: connect.sourceSide,
        toSide: target.side,
      })
    } else if (source && !candidate) {
      const node = addNode(point)
      addLink({
        from: source.id,
        to: node.id,
        fromSide: connect.sourceSide,
        toSide: oppositeSide(connect.sourceSide),
      })
      focusNode(node.id)
    }

    setConnect(null)
  }

  function cancel() {
    setConnect(null)
  }

  // Preview geometry is derived state; it does not need its own state hook.
  const connectPoint = connect ? { x: connect.x, y: connect.y } : null
  const connectCandidate = connect
    ? findConnectCandidate(nodes, { x: connect.x, y: connect.y })
    : null
  const ghostNode = buildGhostNode(connect, connectPoint, connectCandidate?.node ?? null)
  const connectPreview = buildConnectPreview(connect, byId, ghostNode)

  return {
    connect,
    ghostNode,
    connectPreview,
    start,
    move,
    finish,
    cancel,
  }
}
