import type { PointerEvent } from "react"

import { HANDLE_HIT_R, HANDLE_R, type Point, type RenderedEdge } from "../graph"

function Handle({
  point,
  onPointerDown,
}: {
  point: Point
  onPointerDown: (e: PointerEvent<SVGCircleElement>) => void
}) {
  return (
    <g>
      <circle
        cx={point.x}
        cy={point.y}
        r={HANDLE_HIT_R}
        fill="transparent"
        className="cursor-crosshair"
        onPointerDown={onPointerDown}
      >
        <title>Drag to reconnect this edge</title>
      </circle>
      <circle
        cx={point.x}
        cy={point.y}
        r={HANDLE_R}
        fill="#f5c518"
        stroke="#000000"
        strokeWidth={1}
        pointerEvents="none"
      />
    </g>
  )
}

type Props = {
  edges: RenderedEdge[]
  hoveredEdgeId: string | null
  disabled: boolean
  onStart: (e: PointerEvent<SVGCircleElement>, edge: RenderedEdge, moving: "from" | "to") => void
  onHoverStart: () => void
  onHoverEnd: (id: string) => void
}

export function EdgeHandles({ edges, hoveredEdgeId, disabled, onStart, onHoverStart, onHoverEnd }: Props) {
  if (disabled) return null

  return (
    <>
      {edges.map((edge) => {
        if (hoveredEdgeId !== edge.id) return null
        return (
          <g
            key={`handles-${edge.id}`}
            onPointerEnter={onHoverStart}
            onPointerLeave={() => onHoverEnd(edge.id)}
            onDoubleClick={(e) => e.stopPropagation()}
          >
            <Handle point={edge.fromPoint} onPointerDown={(e) => onStart(e, edge, "from")} />
            <Handle point={edge.toPoint} onPointerDown={(e) => onStart(e, edge, "to")} />
          </g>
        )
      })}
    </>
  )
}
