import { useCallback } from "react"

type Options = {
  selectedNodeIds: string[]
  selectedEdgeIds: string[]
  selectedTextIds: string[]
  removeNode: (id: string) => void
  removeLink: (id: string) => void
  removeText: (id: string) => void
  clearSelection: () => void
  cancelEditing: () => void
}

/** Delete selected graph items or a single item from a context menu. */
export function useMindmapDeletion({
  selectedNodeIds,
  selectedEdgeIds,
  selectedTextIds,
  removeNode,
  removeLink,
  removeText,
  clearSelection,
  cancelEditing,
}: Options) {
  const deleteSelection = useCallback(() => {
    selectedEdgeIds.forEach((id) => removeLink(id))
    selectedNodeIds.forEach((id) => removeNode(id))
    selectedTextIds.forEach((id) => removeText(id))
    clearSelection()
    cancelEditing()
  }, [
    cancelEditing,
    clearSelection,
    removeLink,
    removeNode,
    removeText,
    selectedEdgeIds,
    selectedNodeIds,
    selectedTextIds,
  ])

  const deleteNodeById = useCallback(
    (id: string) => {
      removeNode(id)
      clearSelection()
      cancelEditing()
    },
    [cancelEditing, clearSelection, removeNode],
  )

  const deleteEdgeById = useCallback(
    (id: string) => {
      removeLink(id)
      clearSelection()
      cancelEditing()
    },
    [cancelEditing, clearSelection, removeLink],
  )

  return { deleteSelection, deleteNodeById, deleteEdgeById }
}
