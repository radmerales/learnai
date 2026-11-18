type Props = {
  selectedLabel: string | null
  selectedNodeCount: number
  selectedEdgeCount: number
  selectedTextCount: number
  nodeCount: number
  linkCount: number
}

export function MindmapFooter({
  selectedLabel,
  selectedNodeCount,
  selectedEdgeCount,
  selectedTextCount,
  nodeCount,
  linkCount,
}: Props) {
  const selectedCount = selectedNodeCount + selectedEdgeCount + selectedTextCount

  return (
    <footer className="border-t border-hairline bg-surface px-6 py-2 font-mono text-xs text-mutedink">
      {selectedCount > 1 ? (
        <span>
          {selectedNodeCount} node{selectedNodeCount === 1 ? "" : "s"} · {selectedEdgeCount} edge
          {selectedEdgeCount === 1 ? "" : "s"} · {selectedTextCount} text
          {selectedTextCount === 1 ? "" : "s"} selected
          {selectedNodeCount > 0
            ? " · drag a selected node to move the group"
            : " · press Delete or Backspace to remove"}
        </span>
      ) : selectedEdgeCount === 1 ? (
        <span>Edge selected · press Delete or Backspace to remove it</span>
      ) : selectedTextCount === 1 ? (
        <span>Text selected · press Delete or Backspace to remove it</span>
      ) : selectedLabel ? (
        <span>
          Selected: <strong className="font-medium text-ink">{selectedLabel}</strong> · drag to move · double-click to
          rename · hover an edge to rewire it
        </span>
      ) : (
        <span>
          {nodeCount} node{nodeCount === 1 ? "" : "s"} · {linkCount} link{linkCount === 1 ? "" : "s"} · drag empty
          canvas to select · space-drag or wheel to pan · Ctrl/Cmd+wheel to zoom
        </span>
      )}
    </footer>
  )
}
