import type { MouseEvent } from "react"

import type { RenderedEdge } from "../graph"
import { EdgeStroke } from "./EdgeStroke"

type Props = {
  edges: RenderedEdge[]
  hiddenEdgeId: string | null
  selectedEdgeIds: string[]
  onHoverStart: (id: string) => void
  onHoverEnd: (id: string) => void
  onSelect: (id: string, additive: boolean) => void
  onContextMenu: (edge: RenderedEdge, e: MouseEvent<SVGPathElement>) => void
}

export function EdgePaths({
  edges,
  hiddenEdgeId,
  selectedEdgeIds,
  onHoverStart,
  onHoverEnd,
  onSelect,
  onContextMenu,
}: Props) {
  return (
    <>
      {edges.map((edge) => {
        if (edge.id === hiddenEdgeId) return null
        const selected = selectedEdgeIds.includes(edge.id)
        const marker = selected ? "edge-arrow-selected" : "edge-arrow"
        return (
          <g key={edge.id} pointerEvents="none">
            <EdgeStroke
              path={edge.path}
              selected={selected}
              markerStart={edge.arrow === "backward" || edge.arrow === "both" ? `url(#${marker})` : undefined}
              markerEnd={edge.arrow === "forward" || edge.arrow === "both" ? `url(#${marker})` : undefined}
            />
          </g>
        )
      })}

      {edges.map((edge) => {
        if (edge.id === hiddenEdgeId || !edge.text.trim()) return null
        return (
          <text
            key={`label-${edge.id}`}
            x={edge.midpoint.x}
            y={edge.midpoint.y + 4}
            textAnchor="middle"
            fontSize="11"
            fontFamily="IBM Plex Sans, sans-serif"
            fill="#1d1d1d"
            pointerEvents="none"
          >
            {edge.text}
          </text>
        )
      })}

      {edges.map((edge) =>
        edge.id === hiddenEdgeId ? null : (
          <path
            key={`hit-${edge.id}`}
            d={edge.path}
            fill="none"
            stroke="transparent"
            strokeWidth={16}
            pointerEvents="stroke"
            className="cursor-pointer"
            onPointerEnter={() => onHoverStart(edge.id)}
            onPointerLeave={() => onHoverEnd(edge.id)}
            onPointerDown={(e) => {
              e.stopPropagation()
              onSelect(edge.id, e.shiftKey || e.metaKey || e.ctrlKey)
            }}
            onDoubleClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onContextMenu(edge, e)
            }}
          />
        ),
      )}
    </>
  )
}
