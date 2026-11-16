import { NODE_H, type Node } from "../graph"
import type { Preview } from "../interaction"
import { EdgeStroke } from "./EdgeStroke"

function Marker({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r={4.5} fill="#f5c518" stroke="#000000" strokeWidth={1} />
}

function PreviewLine({ preview }: { preview: Preview }) {
  return (
    <g pointerEvents="none">
      <EdgeStroke path={preview.path} />
      <Marker x={preview.start.x} y={preview.start.y} />
      <Marker x={preview.end.x} y={preview.end.y} />
    </g>
  )
}

type Props = {
  ghostNode: Node | null
  connectPreview: Preview | null
  edgePreview: Preview | null
}

export function EdgePreview({ ghostNode, connectPreview, edgePreview }: Props) {
  return (
    <>
      {ghostNode && (
        <g pointerEvents="none">
          <rect
            x={ghostNode.x - ghostNode.width / 2}
            y={ghostNode.y - NODE_H / 2}
            width={ghostNode.width}
            height={NODE_H}
            fill="#e1e0dd"
            stroke="#3f3e3e"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            opacity={0.92}
          />
          <text
            x={ghostNode.x}
            y={ghostNode.y + 5}
            textAnchor="middle"
            fontSize="14"
            fontFamily="IBM Plex Sans, sans-serif"
            fill="#3f3e3e"
          >
            New node
          </text>
        </g>
      )}
      {connectPreview && <PreviewLine preview={connectPreview} />}
      {edgePreview && <PreviewLine preview={edgePreview} />}
    </>
  )
}
