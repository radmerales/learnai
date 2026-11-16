import type { RenderedEdge } from "../graph"
import { EdgeStroke } from "./EdgeStroke"

type Props = {
  edges: RenderedEdge[]
  hiddenEdgeId: string | null
  selectedEdgeId: string | null
  onHoverStart: (id: string) => void
  onHoverEnd: (id: string) => void
  onSelect: (id: string) => void
}

export function EdgePaths({ edges, hiddenEdgeId, selectedEdgeId, onHoverStart, onHoverEnd, onSelect }: Props) {
  return (
    <>
      {edges.map((edge) =>
        edge.id === hiddenEdgeId ? null : (
          <g key={edge.id} pointerEvents="none">
            <EdgeStroke path={edge.path} selected={edge.id === selectedEdgeId} />
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
              onSelect(edge.id)
            }}
          />
        ),
      )}
    </>
  )
}
