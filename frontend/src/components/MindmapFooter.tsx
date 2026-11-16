type Props = {
  selectedLabel: string | null
  selectedEdge: boolean
  nodeCount: number
  linkCount: number
}

export function MindmapFooter({ selectedLabel, selectedEdge, nodeCount, linkCount }: Props) {
  return (
    <footer className="border-t border-hairline bg-surface px-6 py-2 font-mono text-xs text-mutedink">
      {selectedEdge ? (
        <span>Edge selected · press Delete or Backspace to remove it</span>
      ) : selectedLabel ? (
        <span>
          Selected: <strong className="font-medium text-ink">{selectedLabel}</strong> · drag to move · double-click to
          rename · hover an edge to rewire it
        </span>
      ) : (
        <span>
          {nodeCount} node{nodeCount === 1 ? "" : "s"} · {linkCount} link{linkCount === 1 ? "" : "s"} · hover nodes to
          connect, drop on empty space to add a node
        </span>
      )}
    </footer>
  )
}
