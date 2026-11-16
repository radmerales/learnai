import { useEffect, useRef, useState, type PointerEvent } from "react"

import { oppositeSide, type RenderedEdge, type Side } from "../graph"
import {
  clampNewNodePoint,
  findConnectCandidate,
  hitTestNode,
  resolveConnectTarget,
  resolveEdgeTarget,
  type ConnectDrag,
  type EdgeDrag,
} from "../interaction"
import { buildConnectPreview, buildEdgePreview, buildGhostNode } from "../previews"
import { useCanvasSize } from "./useCanvasSize"
import type { MindmapGraph } from "./useMindmapGraph"

type Options = Pick<
  MindmapGraph,
  "nodes" | "links" | "byId" | "moveNode" | "addNode" | "addLink" | "updateLink" | "removeLink"
> & {
  selectNode: (id: string | null) => void
  clearEdgeSelection: () => void
  onNodeFocus: (id: string) => void
}

type DragState = {
  id: string
  ox: number
  oy: number
  startX: number
  startY: number
  moved: boolean
}

export function useMindmapInteractions({
  nodes,
  links,
  byId,
  moveNode,
  addNode,
  addLink,
  updateLink,
  removeLink,
  selectNode,
  clearEdgeSelection,
  onNodeFocus,
}: Options) {
  const [drag, setDrag] = useState<DragState | null>(null)
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

  function onBackgroundPointerDown(e: PointerEvent<SVGSVGElement>) {
    if (e.button !== 0) return
    selectNode(null)
  }

  function onNodePointerDown(e: PointerEvent<SVGGElement>, id: string) {
    e.stopPropagation()
    if (e.button !== 0) return
    const node = byId.get(id)
    if (!node) return
    clearEdgeHoverTimer()
    setHoveredEdgeId(null)
    const p = toSvgPoint(e.clientX, e.clientY)
    selectNode(id)
    setDrag({ id, ox: p.x - node.x, oy: p.y - node.y, startX: p.x, startY: p.y, moved: false })
    ;(e.currentTarget as SVGGElement).setPointerCapture?.(e.pointerId)
  }

  function onNodePointerEnter(id: string) {
    setHoveredId(id)
  }

  function onNodePointerLeave(id: string) {
    setHoveredId((prev) => (prev === id ? null : prev))
  }

  function startConnect(e: PointerEvent<SVGPathElement>, id: string, side: Side) {
    e.stopPropagation()
    if (e.button !== 0) return
    clearEdgeSelection()
    clearEdgeHoverTimer()
    setHoveredEdgeId(null)
    const p = toSvgPoint(e.clientX, e.clientY)
    setConnect({ sourceId: id, sourceSide: side, x: p.x, y: p.y, targetId: null, targetSide: null })
  }

  function startEdgeDrag(e: PointerEvent<SVGCircleElement>, edge: RenderedEdge, moving: "from" | "to") {
    e.stopPropagation()
    if (e.button !== 0) return
    clearEdgeSelection()
    clearEdgeHoverTimer()
    setHoveredEdgeId(edge.id)
    const fixed = moving === "from" ? edge.to : edge.from
    const fixedSide = moving === "from" ? edge.toSide : edge.fromSide
    const p = toSvgPoint(e.clientX, e.clientY)
    setEdgeDrag({
      edgeId: edge.id,
      moving,
      fixedNodeId: fixed.id,
      fixedSide,
      x: p.x,
      y: p.y,
      targetNodeId: null,
      targetSide: null,
    })
  }

  function onPointerMove(e: PointerEvent<SVGSVGElement>) {
    const p = toSvgPoint(e.clientX, e.clientY)

    if (drag) {
      const moved = drag.moved || Math.hypot(p.x - drag.startX, p.y - drag.startY) > 3
      moveNode(drag.id, p.x - drag.ox, p.y - drag.oy)
      if (moved !== drag.moved) setDrag((prev) => (prev ? { ...prev, moved } : prev))
      return
    }

    if (connect) {
      const target = resolveConnectTarget(nodes, links, p, connect.sourceId)
      setConnect((prev) =>
        prev ? { ...prev, x: p.x, y: p.y, targetId: target?.node.id ?? null, targetSide: target?.side ?? null } : prev,
      )
      return
    }

    if (edgeDrag) {
      const hit = nodeAtPoint(p)
      const target = resolveEdgeTarget(links, byId, hit, p, edgeDrag)
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
      const candidate = findConnectCandidate(nodes, p)
      const target = resolveConnectTarget(nodes, links, p, connect.sourceId)
      if (source && target) {
        addLink({
          from: source.id,
          to: target.node.id,
          fromSide: connect.sourceSide,
          toSide: target.side,
        })
      } else if (source && !candidate) {
        const node = addNode(clampPoint(p))
        addLink({
          from: source.id,
          to: node.id,
          fromSide: connect.sourceSide,
          toSide: oppositeSide(connect.sourceSide),
        })
        onNodeFocus(node.id)
      }
      setConnect(null)
      return
    }

    if (edgeDrag) {
      const hit = nodeAtPoint(p)
      const target = resolveEdgeTarget(links, byId, hit, p, edgeDrag)

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
      return
    }

    if (drag && !drag.moved) {
      const moved = Math.hypot(p.x - drag.startX, p.y - drag.startY) > 3
      if (!moved) onNodeFocus(drag.id)
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
  const connectCandidate = connect ? findConnectCandidate(nodes, { x: connect.x, y: connect.y }) : null
  const ghostNode = buildGhostNode(connect, connectPoint, connectCandidate?.node ?? null)
  const connectPreview = buildConnectPreview(connect, byId, ghostNode)
  const edgePreview = buildEdgePreview(edgeDrag, byId)

  return {
    svgRef,
    canvasSize,
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
