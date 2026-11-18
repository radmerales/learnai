import { NODE_H, type Node } from "../graph"
import type { Viewport } from "../hooks/useCanvasViewport"
import { NOTE_STATUSES } from "../status"

type Props = {
  node: Node
  viewport: Viewport
  value: string
  onChange: (value: string) => void
  onCommit: () => void
  onCancel: () => void
}

export function InlineNodeEditor({ node, viewport, value, onChange, onCommit, onCancel }: Props) {
  const status = NOTE_STATUSES[node.status]

  return (
    <input
      key={node.id}
      autoFocus
      aria-label="Node label"
      spellCheck={false}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={onCommit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          onCommit()
        } else if (e.key === "Escape") {
          e.preventDefault()
          onCancel()
        }
      }}
      style={{
        left: viewport.x + (node.x - node.width / 2) * viewport.scale,
        top: viewport.y + (node.y - NODE_H / 2) * viewport.scale,
        width: node.width * viewport.scale,
        height: NODE_H * viewport.scale,
        color: status.text,
        fontSize: `${14 * viewport.scale}px`,
      }}
      className="absolute z-10 border-0 bg-transparent px-2 text-center font-sans text-sm outline-none"
    />
  )
}
