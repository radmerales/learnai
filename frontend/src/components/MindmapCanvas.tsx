import type { MouseEvent } from "react"

import { edgeLabelBox, type Node, type RenderedEdge, type TextBox } from "../graph"
import type { SelectionBox } from "../selectionBounds"
import type { MindmapInteractions } from "../hooks/useMindmapInteractions"
import type { Viewport } from "../hooks/useCanvasViewport"
import { CanvasTextBox } from "./CanvasTextBox"
import { EdgeHandles } from "./EdgeHandles"
import { EdgePaths } from "./EdgePaths"
import { EdgePreview } from "./EdgePreview"
import { MindmapNode } from "./MindmapNode"

type Props = {
  nodes: Node[]
  edges: RenderedEdge[]
  texts: TextBox[]
  selectedNodeIds: string[]
  selectedEdgeIds: string[]
  editingId: string | null
  editingTextId: string | null
  selectionBox: SelectionBox | null
  viewport: Viewport
  svgRef: MindmapInteractions["svgRef"]
  interactions: Omit<MindmapInteractions, "svgRef">
  onNodeDoubleClick: (node: Node) => void
  onNodeContextMenu: (node: Node, e: MouseEvent<SVGGElement>) => void
  onEdgeContextMenu: (edge: RenderedEdge, e: MouseEvent<SVGPathElement>) => void
  onCanvasContextMenu: (e: MouseEvent<SVGSVGElement>) => void
  onTextContextMenu: (text: TextBox, e: MouseEvent<SVGForeignObjectElement>) => void
  onTextStartEdit: (id: string) => void
  onTextCommit: (id: string, text: string) => void
  onTextCancel: () => void
  onSelectEdge: (id: string, additive: boolean) => void
}

export function MindmapCanvas({
  nodes,
  edges,
  texts,
  selectedNodeIds,
  selectedEdgeIds,
  editingId,
  editingTextId,
  selectionBox,
  viewport,
  svgRef,
  interactions,
  onNodeDoubleClick,
  onNodeContextMenu,
  onEdgeContextMenu,
  onCanvasContextMenu,
  onTextContextMenu,
  onTextStartEdit,
  onTextCommit,
  onTextCancel,
  onSelectEdge,
}: Props) {
  const interactionActive = Boolean(interactions.drag || interactions.connect || interactions.edgeDrag)

  return (
    <svg
      ref={svgRef}
      className={`h-full w-full touch-none select-none ${
        interactions.panning ? "cursor-grabbing" : interactions.panReady ? "cursor-grab" : ""
      }`}
      onPointerMove={interactions.onPointerMove}
      onPointerUp={interactions.onPointerUp}
      onPointerLeave={interactions.onPointerLeave}
      onPointerDown={interactions.onBackgroundPointerDown}
      onDoubleClick={interactions.onCanvasDoubleClick}
      onContextMenu={onCanvasContextMenu}
    >
      <defs>
        <marker
          id="edge-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill="#3f3e3e" />
        </marker>
        <marker
          id="edge-arrow-selected"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill="#000000" />
        </marker>
        <mask
          id="edge-label-mask"
          maskUnits="userSpaceOnUse"
          x="-10000"
          y="-10000"
          width="20000"
          height="20000"
        >
          <rect x="-10000" y="-10000" width="20000" height="20000" fill="white" />
          {edges.map((edge) => {
            if (!edge.text.trim()) return null
            const box = edgeLabelBox(edge, 3)
            return (
              <rect
                key={`mask-${edge.id}`}
                x={box.x}
                y={box.y}
                width={box.width}
                height={box.height}
                fill="black"
              />
            )
          })}
        </mask>
        <pattern
          id="grid"
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`}
        >
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#d8d7d3" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      <g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`}>
        <EdgePaths
        edges={edges}
        hiddenEdgeId={interactions.edgeDrag?.edgeId ?? null}
        selectedEdgeIds={selectedEdgeIds}
        onHoverStart={interactions.showEdge}
        onHoverEnd={interactions.scheduleEdgeHide}
        onSelect={onSelectEdge}
        onContextMenu={onEdgeContextMenu}
      />

        {texts.map((text) => (
          <CanvasTextBox
            key={`${text.id}-${editingTextId === text.id ? "edit" : "view"}`}
            textBox={text}
            editing={editingTextId === text.id}
            onStartEdit={onTextStartEdit}
            onCommit={onTextCommit}
            onCancel={onTextCancel}
            onPointerDown={interactions.startTextDrag}
            onContextMenu={onTextContextMenu}
          />
        ))}

      {nodes.map((node) => {
        const connectTarget = interactions.connect?.targetId === node.id
        const edgeTarget = interactions.edgeDrag?.targetNodeId === node.id
        const showAnchors = connectTarget || edgeTarget
        const anchorSide = connectTarget
          ? interactions.connect?.targetSide ?? null
          : edgeTarget
            ? interactions.edgeDrag?.targetSide ?? null
            : null
        const showHandles =
          interactions.hoveredId === node.id && !interactions.drag && !interactions.connect && !interactions.edgeDrag
        return (
          <MindmapNode
            key={node.id}
            node={node}
            selected={selectedNodeIds.includes(node.id)}
            anchorSide={anchorSide}
            showAnchors={showAnchors}
            showHandles={showHandles}
            editing={node.id === editingId}
            onPointerDown={interactions.onNodePointerDown}
            onPointerEnter={interactions.onNodePointerEnter}
            onPointerLeave={interactions.onNodePointerLeave}
            onDoubleClick={onNodeDoubleClick}
            onContextMenu={onNodeContextMenu}
            onConnectStart={interactions.startConnect}
          />
        )
      })}

      <EdgeHandles
        edges={edges}
        hoveredEdgeId={interactions.hoveredEdgeId}
        disabled={interactionActive}
        onStart={interactions.startEdgeDrag}
        onHoverStart={interactions.clearEdgeHoverTimer}
        onHoverEnd={interactions.scheduleEdgeHide}
      />

      <EdgePreview
        ghostNode={interactions.ghostNode}
        connectPreview={interactions.connectPreview}
        edgePreview={interactions.edgePreview}
      />

      {selectionBox && !interactions.marquee && (
        <rect
          x={selectionBox.x}
          y={selectionBox.y}
          width={selectionBox.width}
          height={selectionBox.height}
          fill="none"
          stroke="#3f3e3e"
          strokeWidth={1}
          strokeDasharray="5 4"
          pointerEvents="none"
        />
      )}

      {interactions.marquee && (
        <rect
          x={interactions.marquee.x}
          y={interactions.marquee.y}
          width={interactions.marquee.width}
          height={interactions.marquee.height}
          fill="#f5c518"
          fillOpacity={0.12}
          stroke="#3f3e3e"
          strokeWidth={1}
          pointerEvents="none"
        />
      )}
      </g>
    </svg>
  )
}
