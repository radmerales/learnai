import { useCallback, useState, type MouseEvent } from "react"

import type { Node, RenderedEdge } from "../graph"

type ContextMenuState = {
  kind: "node" | "edge"
  id: string
  label: string
  deleteLabel: string
  x: number
  y: number
}

type Options = {
  onDeleteNode: (id: string) => void
  onDeleteEdge: (id: string) => void
}

/**
 * Owns the right-click menu state and the delete confirmation.
 *
 * React state lives here instead of in MindmapPage so the page only has to
 * open the menu and pass the resulting action back to the graph.
 */
export function useMindmapContextMenu({ onDeleteNode, onDeleteEdge }: Options) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  const openNode = useCallback((node: Node, event: MouseEvent<SVGGElement>) => {
    setContextMenu({
      kind: "node",
      id: node.id,
      label: node.label,
      deleteLabel: "Delete node",
      x: event.clientX,
      y: event.clientY,
    })
  }, [])

  const openEdge = useCallback((edge: RenderedEdge, event: MouseEvent<SVGPathElement>) => {
    setContextMenu({
      kind: "edge",
      id: edge.id,
      label: `${edge.from.label} → ${edge.to.label}`,
      deleteLabel: "Delete edge",
      x: event.clientX,
      y: event.clientY,
    })
  }, [])

  const close = useCallback(() => {
    setContextMenu(null)
  }, [])

  const confirmDelete = useCallback(() => {
    if (!contextMenu) return
    if (contextMenu.kind === "node") {
      onDeleteNode(contextMenu.id)
    } else {
      onDeleteEdge(contextMenu.id)
    }
    setContextMenu(null)
  }, [contextMenu, onDeleteEdge, onDeleteNode])

  return { contextMenu, openNode, openEdge, close, confirmDelete }
}
