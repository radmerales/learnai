import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react"

import { toSvgPoint as clientToSvgPoint } from "../canvasPoint"
import type { RenderedEdge } from "../graph"
import type { SelectionResult } from "../interaction"
import { useCanvasSize } from "./useCanvasSize"
import { useCanvasViewport } from "./useCanvasViewport"
import { useTextDrag } from "./useTextDrag"
import { useConnectDrag } from "./useConnectDrag"
import { useEdgeDrag } from "./useEdgeDrag"
import { useEdgeHover } from "./useEdgeHover"
import { useMarqueeSelection } from "./useMarqueeSelection"
import type { MindmapGraph } from "./useMindmapGraph"
import { useNodeDrag } from "./useNodeDrag"

type GraphActions = Pick<
  MindmapGraph,
  | "nodes"
  | "links"
  | "texts"
  | "byId"
  | "moveNodes"
  | "moveText"
  | "addNode"
  | "addLink"
  | "updateLink"
  | "removeLink"
>

type Options = GraphActions & {
  edges: RenderedEdge[]
  selectedNodeIds: string[]
  selectNode: (id: string, additive?: boolean) => void
  focusNode: (id: string) => void
  selectMarquee: (result: SelectionResult, additive: boolean) => void
  clearEdgeSelection: () => void
}

/**
 * Pointer-interaction coordinator.
 *
 * Each interaction mode owns its own state in a focused hook:
 * - useNodeDrag: moving nodes and groups
 * - useConnectDrag: dragging from a side handle to create an edge
 * - useEdgeDrag: moving an existing edge endpoint
 * - useMarqueeSelection: box selection
 *
 * This hook decides which mode receives pointer move/up events and assembles
 * the preview data consumed by the presentational canvas.
 */
export function useMindmapInteractions(options: Options) {
  const {
    nodes,
    links,
    texts,
    byId,
    edges,
    moveNodes,
    moveText,
    addNode,
    addLink,
    updateLink,
    removeLink,
    selectedNodeIds,
    selectNode,
    focusNode,
    selectMarquee,
    clearEdgeSelection,
  } = options

  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [pan, setPan] = useState<{
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)
  const [spaceHeld, setSpaceHeld] = useState(false)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const canvasSize = useCanvasSize(svgRef)
  const view = useCanvasViewport(svgRef, canvasSize)
  const edgeHover = useEdgeHover()

  function toSvgPoint(clientX: number, clientY: number) {
    const rootPoint = clientToSvgPoint(svgRef.current, clientX, clientY)
    return view.toWorld(rootPoint)
  }

  useEffect(() => {
    function isInteractive(target: EventTarget | null) {
      return (
        target instanceof HTMLElement &&
        Boolean(
          target.closest(
            "input, textarea, select, button, a[href], [contenteditable='true']",
          ),
        )
      )
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space" || isInteractive(event.target)) return
      setSpaceHeld(true)
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.code === "Space") setSpaceHeld(false)
    }

    function onBlur() {
      setSpaceHeld(false)
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("blur", onBlur)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      window.removeEventListener("blur", onBlur)
    }
  }, [])

  const marquee = useMarqueeSelection({ toSvgPoint, nodes, edges, onSelect: selectMarquee })
  const textDrag = useTextDrag({ texts, moveText, toSvgPoint })

  const nodeDrag = useNodeDrag({
    byId,
    moveNodes,
    selectedNodeIds,
    selectNode,
    focusNode,
    toSvgPoint,
    onStart: edgeHover.reset,
  })

  const connectDrag = useConnectDrag({
    nodes,
    links,
    byId,
    addNode,
    addLink,
    focusNode,
    toSvgPoint,
    onStart: () => {
      clearEdgeSelection()
      edgeHover.reset()
    },
  })

  const edgeDrag = useEdgeDrag({
    nodes,
    links,
    byId,
    updateLink,
    removeLink,
    toSvgPoint,
    onStart: () => {
      clearEdgeSelection()
      edgeHover.reset()
    },
  })

  function onBackgroundPointerDown(event: PointerEvent<SVGSVGElement>) {
    const wantsPan = event.button === 1 || (event.button === 0 && (spaceHeld || event.altKey))
    if (wantsPan) {
      event.preventDefault()
      marquee.cancel()
      setPan({
        startX: event.clientX,
        startY: event.clientY,
        originX: view.viewport.x,
        originY: view.viewport.y,
      })
      event.currentTarget.setPointerCapture?.(event.pointerId)
      return
    }
    marquee.start(event)
  }

  function onCanvasDoubleClick(event: MouseEvent<SVGSVGElement>) {
    if (event.button !== 0) return
    const node = addNode(toSvgPoint(event.clientX, event.clientY))
    focusNode(node.id)
  }

  function onNodePointerEnter(id: string) {
    setHoveredId(id)
  }

  function onNodePointerLeave(id: string) {
    setHoveredId((previous) => (previous === id ? null : previous))
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    if (pan) {
      view.setOffset(
        pan.originX + event.clientX - pan.startX,
        pan.originY + event.clientY - pan.startY,
      )
      return
    }
    if (textDrag.drag) {
      textDrag.move(event)
      return
    }
    if (marquee.active) {
      marquee.move(event)
      return
    }
    if (nodeDrag.drag) {
      nodeDrag.move(event)
      return
    }
    if (connectDrag.connect) {
      connectDrag.move(event)
      return
    }
    if (edgeDrag.edgeDrag) {
      edgeDrag.move(event)
    }
  }

  function onPointerUp(event: PointerEvent<SVGSVGElement>) {
    if (pan) {
      setPan(null)
      return
    }
    if (textDrag.drag) {
      textDrag.finish()
      return
    }
    if (marquee.active) {
      marquee.finish(event)
      return
    }
    if (connectDrag.connect) {
      connectDrag.finish(event)
      return
    }
    if (edgeDrag.edgeDrag) {
      edgeDrag.finish(event)
      return
    }
    nodeDrag.finish(event)
  }

  function onPointerLeave() {
    setPan(null)
    textDrag.cancel()
    nodeDrag.cancel()
    connectDrag.cancel()
    edgeDrag.cancel()
    marquee.cancel()
    edgeHover.reset()
  }

  return {
    svgRef,
    canvasSize,
    viewport: view.viewport,
    zoomIn: view.zoomIn,
    zoomOut: view.zoomOut,
    animateTo: view.animateTo,
    resetViewport: view.resetViewport,
    manualVersion: view.manualVersion,
    canZoomIn: view.canZoomIn,
    canZoomOut: view.canZoomOut,
    panning: pan !== null,
    panReady: spaceHeld,
    marquee: marquee.rect,
    drag: nodeDrag.drag,
    connect: connectDrag.connect,
    edgeDrag: edgeDrag.edgeDrag,
    hoveredId,
    hoveredEdgeId: edgeHover.hoveredEdgeId,
    ghostNode: connectDrag.ghostNode,
    connectPreview: connectDrag.connectPreview,
    edgePreview: edgeDrag.edgePreview,
    onBackgroundPointerDown,
    onCanvasDoubleClick,
    onNodePointerDown: nodeDrag.start,
    onNodePointerEnter,
    onNodePointerLeave,
    startTextDrag: textDrag.start,
    toSvgPoint,
    startConnect: connectDrag.start,
    startEdgeDrag: edgeDrag.start,
    showEdge: edgeHover.show,
    scheduleEdgeHide: edgeHover.scheduleHide,
    clearEdgeHoverTimer: edgeHover.clear,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
  }
}

export type MindmapInteractions = ReturnType<typeof useMindmapInteractions>
