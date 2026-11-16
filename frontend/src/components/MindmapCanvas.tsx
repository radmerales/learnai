import type { MouseEvent } from "react"

import type { Node, RenderedEdge } from "../graph"
import type { MindmapInteractions } from "../hooks/useMindmapInteractions"
import { EdgeHandles } from "./EdgeHandles"
import { EdgePaths } from "./EdgePaths"
import { EdgePreview } from "./EdgePreview"
import { MindmapNode } from "./MindmapNode"

type Props = {
  nodes: Node[]
  edges: RenderedEdge[]
  selectedNodeIds: string[]
  selectedEdgeIds: string[]
  editingId: string | null
  svgRef: MindmapInteractions["svgRef"]
  interactions: Omit<MindmapInteractions, "svgRef">
  onNodeDoubleClick: (node: Node) => void
  onNodeContextMenu: (node: Node, e: MouseEvent<SVGGElement>) => void
  onSelectEdge: (id: string, additive: boolean) => void
}

export function MindmapCanvas({
  nodes,
  edges,
  selectedNodeIds,
  selectedEdgeIds,
  editingId,
  svgRef,
  interactions,
  onNodeDoubleClick,
  onNodeContextMenu,
  onSelectEdge,
}: Props) {
  const interactionActive = Boolean(interactions.drag || interactions.connect || interactions.edgeDrag)

  return (
    <svg
      ref={svgRef}
      className="h-full w-full touch-none select-none"
      onPointerMove={interactions.onPointerMove}
      onPointerUp={interactions.onPointerUp}
      onPointerLeave={interactions.onPointerLeave}
      onPointerDown={interactions.onBackgroundPointerDown}
    >
      <defs>
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#d8d7d3" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      <EdgePaths
        edges={edges}
        hiddenEdgeId={interactions.edgeDrag?.edgeId ?? null}
        selectedEdgeIds={selectedEdgeIds}
        onHoverStart={interactions.showEdge}
        onHoverEnd={interactions.scheduleEdgeHide}
        onSelect={onSelectEdge}
      />

      {nodes.map((node) => {
        const connectTarget = interactions.connect?.targetId === node.id
        const edgeTarget = interactions.edgeDrag?.targetNodeId === node.id
        const dropTarget = connectTarget || edgeTarget
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
            dropTarget={dropTarget}
            anchorSide={anchorSide}
            showAnchors={dropTarget}
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
    </svg>
  )
}
