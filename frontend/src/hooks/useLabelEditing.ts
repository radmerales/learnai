import { useCallback, useState } from "react"

import type { Node } from "../graph"
import type { MindmapGraph } from "./useMindmapGraph"

type Options = Pick<MindmapGraph, "byId" | "renameNode">

export function useLabelEditing({ byId, renameNode }: Options) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftLabel, setDraftLabel] = useState("")

  const editingNode = editingId ? byId.get(editingId) ?? null : null

  const startEditing = useCallback((node: Node) => {
    setEditingId(node.id)
    setDraftLabel(node.label)
  }, [])

  const commitEditing = useCallback(() => {
    if (!editingId) return
    const node = byId.get(editingId)
    const label = draftLabel.trim() || node?.label || "Untitled"
    renameNode(editingId, label)
    setEditingId(null)
    setDraftLabel("")
  }, [byId, draftLabel, editingId, renameNode])

  const cancelEditing = useCallback(() => {
    setEditingId(null)
    setDraftLabel("")
  }, [])

  return {
    editingId,
    editingNode,
    draftLabel,
    setDraftLabel,
    startEditing,
    commitEditing,
    cancelEditing,
  }
}
