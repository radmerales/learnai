import { useRef, useState, type MouseEvent, type PointerEvent } from "react"

import { toSvgPoint as clientToSvgPoint } from "../canvasPoint"
import type { RenderedEdge } from "../graph"
import { clampNewNodePoint, type SelectionResult } from "../interaction"
import { useCanvasSize } from "./useCanvasSize"
import { useConnectDrag } from "./useConnectDrag"
import { useEdgeDrag } from "./useEdgeDrag"
import { useEdgeHover } from "./useEdgeHover"
import { useMarqueeSelection } from "./useMarqueeSelection"
import type { MindmapGraph } from "./useMindmapGraph"
import { useNodeDrag } from "./useNodeDrag"

type GraphActions = Pick<
  MindmapGraph,
  "nodes" | "links" | "byId" | "moveNodes" | "addNode" | "addLink" | "updateLink" | "removeLink"
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
    byId,
    edges,
    moveNodes,
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
  const svgRef = useRef<SVGSVGElement | null>(null)
  const canvasSize = useCanvasSize(svgRef)
  const edgeHover = useEdgeHover()

  function toSvgPoint(clientX: number, clientY: number) {
    return clientToSvgPoint(svgRef.current, clientX, clientY)
  }

  function clampPoint(point: { x: number; y: number }) {
    return clampNewNodePoint(point, canvasSize.width, canvasSize.height)
  }

  const marquee = useMarqueeSelection({ toSvgPoint, nodes, edges, onSelect: selectMarquee })

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
    clampPoint,
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
    marquee.start(event)
  }

  function onCanvasDoubleClick(event: MouseEvent<SVGSVGElement>) {
    if (event.button !== 0) return
    const node = addNode(clampPoint(toSvgPoint(event.clientX, event.clientY)))
    focusNode(node.id)
  }

  function onNodePointerEnter(id: string) {
    setHoveredId(id)
  }

  function onNodePointerLeave(id: string) {
    setHoveredId((previous) => (previous === id ? null : previous))
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
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
    nodeDrag.cancel()
    connectDrag.cancel()
    edgeDrag.cancel()
    marquee.cancel()
    edgeHover.reset()
  }

  return {
    svgRef,
    canvasSize,
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
