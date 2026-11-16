import type { MouseEvent, PointerEvent } from "react"

import { HANDLE_R, NODE_H, SIDES, localHandleHitPath, localHandlePoint, type Node, type Side } from "../graph"
import { NOTE_STATUSES } from "../status"

type Props = {
  node: Node
  selected: boolean
  dropTarget: boolean
  anchorSide: Side | null
  showAnchors: boolean
  showHandles: boolean
  editing: boolean
  onPointerDown: (e: PointerEvent<SVGGElement>, id: string) => void
  onPointerEnter: (id: string) => void
  onPointerLeave: (id: string) => void
  onDoubleClick: (node: Node) => void
  onContextMenu: (node: Node, e: MouseEvent<SVGGElement>) => void
  onConnectStart: (e: PointerEvent<SVGPathElement>, id: string, side: Side) => void
}

export function MindmapNode({
  node,
  selected,
  dropTarget,
  anchorSide,
  showAnchors,
  showHandles,
  editing,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  onDoubleClick,
  onContextMenu,
  onConnectStart,
}: Props) {
  const status = NOTE_STATUSES[node.status]

  return (
    <g
      transform={`translate(${node.x - node.width / 2}, ${node.y - NODE_H / 2})`}
      onPointerDown={(e) => onPointerDown(e, node.id)}
      onPointerEnter={() => onPointerEnter(node.id)}
      onPointerLeave={() => onPointerLeave(node.id)}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onDoubleClick(node)
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onContextMenu(node, e)
      }}
      className="cursor-grab active:cursor-grabbing"
    >
      <rect width={node.width} height={NODE_H} fill={status.background} stroke={status.outline} strokeWidth={1.5} />

      {selected && !dropTarget && (
        <rect
          x={-4}
          y={-4}
          width={node.width + 8}
          height={NODE_H + 8}
          fill="none"
          stroke="#f5c518"
          strokeWidth={3}
          pointerEvents="none"
        />
      )}

      {dropTarget && (
        <rect
          x={-4}
          y={-4}
          width={node.width + 8}
          height={NODE_H + 8}
          fill="none"
          stroke="#000000"
          strokeWidth={1.5}
          strokeDasharray="4 2"
          pointerEvents="none"
        />
      )}

      {!editing && (
        <text
          x={node.width / 2}
          y={NODE_H / 2 + 5}
          textAnchor="middle"
          fontSize="14"
          fontFamily="IBM Plex Sans, sans-serif"
          fill={status.text}
        >
          {node.label}
        </text>
      )}

      {showAnchors && (
        <g pointerEvents="none">
          {SIDES.map((side) => {
            const p = localHandlePoint(node.width, side)
            const active = side === anchorSide
            return (
              <circle
                key={`anchor-${side}`}
                cx={p.x}
                cy={p.y}
                r={active ? 7 : 5.5}
                fill={active ? "#000000" : "#e1e0dd"}
                stroke={active ? "#f5c518" : "#3f3e3e"}
                strokeWidth={1}
              />
            )
          })}
        </g>
      )}

      {SIDES.map((side) => {
        const p = localHandlePoint(node.width, side)
        return (
          <g key={`handle-${side}`}>
            <path
              d={localHandleHitPath(node.width, side)}
              fill="transparent"
              pointerEvents="all"
              className="cursor-crosshair"
              onPointerEnter={() => onPointerEnter(node.id)}
              onPointerDown={(e) => onConnectStart(e, node.id, side)}
            >
              <title>Drag to connect from the {side} edge</title>
            </path>
            {showHandles && (
              <circle
                cx={p.x}
                cy={p.y}
                r={HANDLE_R}
                fill="#f5c518"
                stroke="#000000"
                strokeWidth={1}
                pointerEvents="none"
              />
            )}
          </g>
        )
      })}
    </g>
  )
}
