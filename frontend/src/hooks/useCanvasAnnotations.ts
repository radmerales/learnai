import { useCallback, useState } from "react"

import type { Point, RenderedEdge, TextBox } from "../graph"

type Options = {
  texts: TextBox[]
  edges: RenderedEdge[]
  addText: (point: Point, text?: string) => TextBox
  updateText: (id: string, text: string) => void
  removeText: (id: string) => void
  updateLink: (id: string, patch: { text: string }) => void
}

/** State and commit helpers for free text boxes and edge labels. */
export function useCanvasAnnotations({
  texts,
  edges,
  addText,
  updateText,
  removeText,
  updateLink,
}: Options) {
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null)

  const editingEdge = editingEdgeId
    ? edges.find((edge) => edge.id === editingEdgeId) ?? null
    : null

  const createText = useCallback(
    (point: Point) => {
      const text = addText(point)
      setEditingTextId(text.id)
    },
    [addText],
  )

  const commitText = useCallback(
    (id: string, text: string) => {
      if (text.trim()) updateText(id, text)
      else removeText(id)
      setEditingTextId(null)
    },
    [removeText, updateText],
  )

  const cancelText = useCallback(() => {
    if (editingTextId) {
      const text = texts.find((item) => item.id === editingTextId)
      if (text && !text.text.trim()) removeText(text.id)
    }
    setEditingTextId(null)
  }, [editingTextId, removeText, texts])

  const deleteText = useCallback(
    (id: string) => {
      removeText(id)
      setEditingTextId(null)
    },
    [removeText],
  )

  const commitEdgeText = useCallback(
    (text: string) => {
      if (editingEdgeId) updateLink(editingEdgeId, { text: text.trim() })
      setEditingEdgeId(null)
    },
    [editingEdgeId, updateLink],
  )

  return {
    editingTextId,
    editingEdge,
    beginText: setEditingTextId,
    createText,
    commitText,
    cancelText,
    deleteText,
    beginEdgeText: setEditingEdgeId,
    commitEdgeText,
    cancelEdgeText: () => setEditingEdgeId(null),
  }
}
