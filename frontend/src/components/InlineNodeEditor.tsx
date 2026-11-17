import { NODE_H, type Node } from "../graph"
import { NOTE_STATUSES } from "../status"

type Props = {
  node: Node
  value: string
  onChange: (value: string) => void
  onCommit: () => void
  onCancel: () => void
}

export function InlineNodeEditor({ node, value, onChange, onCommit, onCancel }: Props) {
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
        left: node.x - node.width / 2,
        top: node.y - NODE_H / 2,
        width: node.width,
        height: NODE_H,
        color: status.text,
      }}
      className="absolute z-10 border-0 bg-transparent px-2 text-center font-sans text-sm outline-none"
    />
  )
}
