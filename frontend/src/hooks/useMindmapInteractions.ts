import { useRef, useState, type PointerEvent } from "react"

import { oppositeSide, type RenderedEdge, type Side } from "../graph"
import {
  clampNewNodePoint,
  findConnectCandidate,
  hitTestNode,
  resolveConnectTarget,
  resolveEdgeTarget,
  type ConnectDrag,
  type EdgeDrag,
  type SelectionResult,
} from "../interaction"
import { buildConnectPreview, buildEdgePreview, buildGhostNode } from "../previews"
import { useCanvasSize } from "./useCanvasSize"
import { useEdgeHover } from "./useEdgeHover"
import { useMarqueeSelection } from "./useMarqueeSelection"
import type { MindmapGraph } from "./useMindmapGraph"

type GraphActions = Pick<MindmapGraph, "nodes" | "links" | "byId" | "moveNodes" | "addNode" | "addLink" | "updateLink" | "removeLink">
type Options = GraphActions & {
  edges: RenderedEdge[]
  selectedNodeIds: string[]
  selectNode: (id: string, additive?: boolean) => void
  focusNode: (id: string) => void
  selectMarquee: (result: SelectionResult, additive: boolean) => void
  clearEdgeSelection: () => void
}

type DragState = { ids: string[]; starts: Record<string, { x: number; y: number }>; startX: number; startY: number; moved: boolean; additive: boolean; anchorId: string }

export function useMindmapInteractions(options: Options) {
  const { nodes, links, byId, edges, moveNodes, addNode, addLink, updateLink, removeLink, selectedNodeIds, selectNode, focusNode, selectMarquee, clearEdgeSelection } = options
  const [drag, setDrag] = useState<DragState | null>(null)
  const [connect, setConnect] = useState<ConnectDrag | null>(null)
  const [edgeDrag, setEdgeDrag] = useState<EdgeDrag | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const canvasSize = useCanvasSize(svgRef)
  const edgeHover = useEdgeHover()

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

  const marquee = useMarqueeSelection({ toSvgPoint, nodes, edges, onSelect: selectMarquee })

  function nodeAtPoint(p: { x: number; y: number }) {
    return hitTestNode(nodes, p)
  }

  function clampPoint(p: { x: number; y: number }) {
    return clampNewNodePoint(p, canvasSize.width, canvasSize.height)
  }

  function onBackgroundPointerDown(e: PointerEvent<SVGSVGElement>) {
    marquee.start(e)
  }

  function onNodePointerDown(e: PointerEvent<SVGGElement>, id: string) {
    e.stopPropagation()
    if (e.button !== 0) return
    const node = byId.get(id)
    if (!node) return

    edgeHover.reset()
    const p = toSvgPoint(e.clientX, e.clientY)
    const additive = e.shiftKey || e.metaKey || e.ctrlKey
    selectNode(id, additive)

    const alreadySelected = selectedNodeIds.includes(id)
    const ids = additive
      ? alreadySelected
        ? selectedNodeIds
        : [...selectedNodeIds, id]
      : alreadySelected
        ? selectedNodeIds
        : [id]

    const starts: DragState["starts"] = {}
    ids.forEach((dragId) => {
      const dragNode = byId.get(dragId)
      if (dragNode) starts[dragId] = { x: dragNode.x, y: dragNode.y }
    })

    setDrag({
      ids,
      starts,
      startX: p.x,
      startY: p.y,
      moved: false,
      additive,
      anchorId: id,
    })
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
    edgeHover.reset()
    const p = toSvgPoint(e.clientX, e.clientY)
    setConnect({ sourceId: id, sourceSide: side, x: p.x, y: p.y, targetId: null, targetSide: null })
  }

  function startEdgeDrag(e: PointerEvent<SVGCircleElement>, edge: RenderedEdge, moving: "from" | "to") {
    e.stopPropagation()
    if (e.button !== 0) return
    clearEdgeSelection()
    edgeHover.reset()
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
    if (marquee.active) {
      marquee.move(e)
      return
    }

    const p = toSvgPoint(e.clientX, e.clientY)

    if (drag) {
      const moved = drag.moved || Math.hypot(p.x - drag.startX, p.y - drag.startY) > 3
      const dx = p.x - drag.startX
      const dy = p.y - drag.startY
      moveNodes(
        Object.entries(drag.starts).map(([id, start]) => ({
          id,
          x: start.x + dx,
          y: start.y + dy,
        })),
      )
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
    if (marquee.active) {
      marquee.finish(e)
      return
    }

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
        focusNode(node.id)
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
      if (!moved && !drag.additive) focusNode(drag.anchorId)
    }

    setDrag(null)
  }

  function onPointerLeave() {
    setDrag(null)
    setConnect(null)
    setEdgeDrag(null)
    marquee.cancel()
    edgeHover.reset()
  }

  const connectPoint = connect ? clampPoint({ x: connect.x, y: connect.y }) : null
  const connectCandidate = connect ? findConnectCandidate(nodes, { x: connect.x, y: connect.y }) : null
  const ghostNode = buildGhostNode(connect, connectPoint, connectCandidate?.node ?? null)
  const connectPreview = buildConnectPreview(connect, byId, ghostNode)
  const edgePreview = buildEdgePreview(edgeDrag, byId)

  return {
    svgRef,
    canvasSize,
    marquee: marquee.rect,
    drag,
    connect,
    edgeDrag,
    hoveredId,
    hoveredEdgeId: edgeHover.hoveredEdgeId,
    ghostNode,
    connectPreview,
    edgePreview,
    onBackgroundPointerDown,
    onNodePointerDown,
    onNodePointerEnter,
    onNodePointerLeave,
    startConnect,
    startEdgeDrag,
    showEdge: edgeHover.show,
    scheduleEdgeHide: edgeHover.scheduleHide,
    clearEdgeHoverTimer: edgeHover.clear,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
  }
}

export type MindmapInteractions = ReturnType<typeof useMindmapInteractions>
