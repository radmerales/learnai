import type { RenderedEdge } from "../graph"
import { EdgeStroke } from "./EdgeStroke"

type Props = {
  edges: RenderedEdge[]
  hiddenEdgeId: string | null
  selectedEdgeIds: string[]
  onHoverStart: (id: string) => void
  onHoverEnd: (id: string) => void
  onSelect: (id: string, additive: boolean) => void
}

export function EdgePaths({ edges, hiddenEdgeId, selectedEdgeIds, onHoverStart, onHoverEnd, onSelect }: Props) {
  return (
    <>
      {edges.map((edge) =>
        edge.id === hiddenEdgeId ? null : (
          <g key={edge.id} pointerEvents="none">
            <EdgeStroke path={edge.path} selected={selectedEdgeIds.includes(edge.id)} />
          </g>
        ),
      )}

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
          />
        ),
      )}
    </>
  )
}
