import { useEffect, useRef, useState, type PointerEvent } from "react"

import { sideTowardPoint, type RenderedEdge, type Side } from "../graph"
import {
  clampNewNodePoint,
  edgeExistsBetween,
  hitTestNode,
  resolveEdgeTarget,
  type ConnectDrag,
  type EdgeDrag,
} from "../interaction"
import { buildConnectPreview, buildEdgePreview, buildGhostNode } from "../previews"
import { useCanvasSize } from "./useCanvasSize"
import type { MindmapGraph } from "./useMindmapGraph"

type Options = Pick<
  MindmapGraph,
  | "nodes"
  | "links"
  | "byId"
  | "moveNode"
  | "addChildAt"
  | "addLink"
  | "updateLink"
  | "removeLink"
  | "reparentTree"
  | "detachTree"
> & {
  setSelectedId: (id: string | null) => void
}

export function useMindmapInteractions({
  nodes,
  links,
  byId,
  moveNode,
  addChildAt,
  addLink,
  updateLink,
  removeLink,
  reparentTree,
  detachTree,
  setSelectedId,
}: Options) {
  const [drag, setDrag] = useState<{ id: string; ox: number; oy: number } | null>(null)
  const [connect, setConnect] = useState<ConnectDrag | null>(null)
  const [edgeDrag, setEdgeDrag] = useState<EdgeDrag | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const canvasSize = useCanvasSize(svgRef)
  const edgeHoverTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (edgeHoverTimer.current !== null) window.clearTimeout(edgeHoverTimer.current)
    }
  }, [])

  function toSvgPoint(clientX: number, clientY: number) {
    const svg = svgRef.current
    if (!svg) return { x: clientX, y: clientY }
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: clientX, y: clientY }
    const p = pt.matrixTransform(ctm.inverse())
    return { x: p.x, y: p.y }
  }

  function nodeAtPoint(p: { x: number; y: number }) {
    return hitTestNode(nodes, p)
  }

  function connected(a: string, b: string) {
    return edgeExistsBetween(nodes, links, a, b)
  }

  function clampPoint(p: { x: number; y: number }) {
    return clampNewNodePoint(p, canvasSize.width, canvasSize.height)
  }

  function clearEdgeHoverTimer() {
    if (edgeHoverTimer.current !== null) {
      window.clearTimeout(edgeHoverTimer.current)
      edgeHoverTimer.current = null
    }
  }

  function showEdge(id: string) {
    clearEdgeHoverTimer()
    setHoveredEdgeId(id)
  }

  function scheduleEdgeHide(id: string) {
    clearEdgeHoverTimer()
    edgeHoverTimer.current = window.setTimeout(() => {
      setHoveredEdgeId((prev) => (prev === id ? null : prev))
      edgeHoverTimer.current = null
    }, 180)
  }

  function onBackgroundPointerDown() {
    setSelectedId(null)
  }

  function onNodePointerDown(e: PointerEvent<SVGGElement>, id: string) {
    e.stopPropagation()
    const node = byId.get(id)
    if (!node) return
    clearEdgeHoverTimer()
    setHoveredEdgeId(null)
    const p = toSvgPoint(e.clientX, e.clientY)
    setSelectedId(id)
    setDrag({ id, ox: p.x - node.x, oy: p.y - node.y })
    ;(e.currentTarget as SVGGElement).setPointerCapture?.(e.pointerId)
  }

  function onNodePointerEnter(id: string) {
    setHoveredId(id)
  }

  function onNodePointerLeave(id: string) {
    setHoveredId((prev) => (prev === id ? null : prev))
  }

  function startConnect(e: PointerEvent<SVGCircleElement>, id: string, side: Side) {
    e.stopPropagation()
    clearEdgeHoverTimer()
    setHoveredEdgeId(null)
    const p = toSvgPoint(e.clientX, e.clientY)
    setConnect({ sourceId: id, sourceSide: side, x: p.x, y: p.y, targetId: null, targetSide: null })
  }

  function startEdgeDrag(e: PointerEvent<SVGCircleElement>, edge: RenderedEdge, moving: "from" | "to") {
    e.stopPropagation()
    clearEdgeHoverTimer()
    setHoveredEdgeId(edge.id)
    const fixed = moving === "from" ? edge.to : edge.from
    const fixedSide = moving === "from" ? edge.toSide : edge.fromSide
    const p = toSvgPoint(e.clientX, e.clientY)
    setEdgeDrag({
      edgeId: edge.id,
      kind: edge.kind,
      moving,
      fixedNodeId: fixed.id,
      fixedSide,
      linkId: edge.kind === "link" ? edge.id : null,
      childId: edge.kind === "tree" ? edge.to.id : null,
      x: p.x,
      y: p.y,
      targetNodeId: null,
      targetSide: null,
    })
  }

  function onPointerMove(e: PointerEvent<SVGSVGElement>) {
    const p = toSvgPoint(e.clientX, e.clientY)

    if (drag) {
      moveNode(drag.id, p.x - drag.ox, p.y - drag.oy)
      return
    }

    if (connect) {
      const hit = nodeAtPoint(p)
      const targetId = hit && hit.id !== connect.sourceId && !connected(connect.sourceId, hit.id) ? hit.id : null
      const targetSide = targetId && hit ? sideTowardPoint(hit, p) : null
      setConnect((prev) => (prev ? { ...prev, x: p.x, y: p.y, targetId, targetSide } : prev))
      return
    }

    if (edgeDrag) {
      const hit = nodeAtPoint(p)
      const target = resolveEdgeTarget(nodes, links, byId, hit, p, edgeDrag)
      setEdgeDrag((prev) =>
        prev
          ? {
              ...prev,
              x: p.x,
              y: p.y,
              targetNodeId: target?.node.id ?? null,
              targetSide: target?.side ?? null,
            }
          : prev,
      )
    }
  }

  function onPointerUp(e: PointerEvent<SVGSVGElement>) {
    const p = toSvgPoint(e.clientX, e.clientY)

    if (connect) {
      const source = byId.get(connect.sourceId)
      const hit = nodeAtPoint(p)
      if (source && hit && hit.id !== source.id && !connected(source.id, hit.id)) {
        addLink({
          from: source.id,
          to: hit.id,
          fromSide: connect.sourceSide,
          toSide: sideTowardPoint(hit, p),
        })
      } else if (source && !hit) {
        const node = addChildAt(source.id, clampPoint(p), connect.sourceSide)
        if (node) setSelectedId(node.id)
      }
      setConnect(null)
      return
    }

    if (edgeDrag) {
      const hit = nodeAtPoint(p)
      const target = resolveEdgeTarget(nodes, links, byId, hit, p, edgeDrag)

      if (target) {
        if (edgeDrag.kind === "link" && edgeDrag.linkId) {
          updateLink(
            edgeDrag.linkId,
            edgeDrag.moving === "from"
              ? { from: target.node.id, fromSide: target.side }
              : { to: target.node.id, toSide: target.side },
          )
        } else if (edgeDrag.kind === "tree" && edgeDrag.childId) {
          if (edgeDrag.moving === "from") {
            // The parent end moved: the original child gets a new parent.
            reparentTree(edgeDrag.childId, target.node.id, target.side, edgeDrag.fixedSide)
          } else {
            // The child end moved: the target becomes the parent's child, and
            // the original child is detached so the edge visually lands where
            // it was dropped.
            reparentTree(target.node.id, edgeDrag.fixedNodeId, edgeDrag.fixedSide, target.side)
            detachTree(edgeDrag.childId)
          }
        }
      } else if (!hit) {
        if (edgeDrag.kind === "link" && edgeDrag.linkId) {
          removeLink(edgeDrag.linkId)
        } else if (edgeDrag.kind === "tree" && edgeDrag.childId) {
          detachTree(edgeDrag.childId)
        }
      }
      setEdgeDrag(null)
      return
    }

    setDrag(null)
  }

  function onPointerLeave() {
    setDrag(null)
    setConnect(null)
    setEdgeDrag(null)
    clearEdgeHoverTimer()
    setHoveredEdgeId(null)
  }

  const connectPoint = connect ? clampPoint({ x: connect.x, y: connect.y }) : null
  const connectHoverNode = connect ? nodeAtPoint({ x: connect.x, y: connect.y }) : null
  const ghostNode = buildGhostNode(connect, connectPoint, connectHoverNode)
  const connectPreview = buildConnectPreview(connect, byId, ghostNode)
  const edgePreview = buildEdgePreview(edgeDrag, byId)

  return {
    svgRef,
    drag,
    connect,
    edgeDrag,
    hoveredId,
    hoveredEdgeId,
    ghostNode,
    connectPreview,
    edgePreview,
    onBackgroundPointerDown,
    onNodePointerDown,
    onNodePointerEnter,
    onNodePointerLeave,
    startConnect,
    startEdgeDrag,
    showEdge,
    scheduleEdgeHide,
    clearEdgeHoverTimer,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
  }
}

export type MindmapInteractions = ReturnType<typeof useMindmapInteractions>
