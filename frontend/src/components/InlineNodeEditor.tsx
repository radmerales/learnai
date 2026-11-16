import type { Node } from "../graph"
import { NODE_H, NODE_W } from "../graph"

type Props = {
  node: Node
  value: string
  onChange: (value: string) => void
  onCommit: () => void
  onCancel: () => void
}

export function InlineNodeEditor({ node, value, onChange, onCommit, onCancel }: Props) {
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
        left: node.x - NODE_W / 2,
        top: node.y - NODE_H / 2,
        width: NODE_W,
        height: NODE_H,
      }}
      className="absolute z-10 border-2 border-ink bg-accent px-2 text-center font-sans text-sm text-accentink outline-none focus:ring-2 focus:ring-ink"
    />
  )
}
