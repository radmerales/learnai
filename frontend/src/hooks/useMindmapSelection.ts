import { useCallback, useState } from "react"

import type { SelectionResult } from "../interaction"

export function useMindmapSelection() {
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([])
  const [selectedTextIds, setSelectedTextIds] = useState<string[]>([])
  const [panelOpen, setPanelOpen] = useState(false)

  const selectNode = useCallback(
    (id: string, additive = false) => {
      if (additive) {
        setSelectedNodeIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
        setPanelOpen(false)
        return
      }
      if (selectedNodeIds.includes(id)) return
      setSelectedNodeIds([id])
      setSelectedEdgeIds([])
      setSelectedTextIds([])
    },
    [selectedNodeIds],
  )

  const focusNode = useCallback((id: string) => {
    setSelectedNodeIds([id])
    setSelectedEdgeIds([])
    setSelectedTextIds([])
    setPanelOpen(true)
  }, [])

  const selectEdge = useCallback((id: string, additive = false) => {
    if (additive) {
      setSelectedEdgeIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
      setPanelOpen(false)
      return
    }
    setSelectedNodeIds([])
    setSelectedEdgeIds([id])
    setSelectedTextIds([])
    setPanelOpen(false)
  }, [])

  const selectText = useCallback((id: string, additive = false) => {
    if (additive) {
      setSelectedTextIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
      setPanelOpen(false)
      return
    }
    setSelectedNodeIds([])
    setSelectedEdgeIds([])
    setSelectedTextIds([id])
    setPanelOpen(false)
  }, [])

  const selectMarquee = useCallback((result: SelectionResult, additive: boolean) => {
    if (additive) {
      setSelectedNodeIds((prev) => Array.from(new Set([...prev, ...result.nodeIds])))
      setSelectedEdgeIds((prev) => Array.from(new Set([...prev, ...result.edgeIds])))
      setSelectedTextIds((prev) => Array.from(new Set([...prev, ...result.textIds])))
    } else {
      setSelectedNodeIds(result.nodeIds)
      setSelectedEdgeIds(result.edgeIds)
      setSelectedTextIds(result.textIds)
    }
    setPanelOpen(false)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedNodeIds([])
    setSelectedEdgeIds([])
    setSelectedTextIds([])
    setPanelOpen(false)
  }, [])

  const clearEdgeSelection = useCallback(() => {
    setSelectedEdgeIds([])
  }, [])

  const closePanel = useCallback(() => {
    setPanelOpen(false)
  }, [])

  return {
    selectedNodeIds,
    selectedEdgeIds,
    selectedTextIds,
    panelOpen,
    selectNode,
    focusNode,
    selectEdge,
    selectText,
    selectMarquee,
    clearSelection,
    clearEdgeSelection,
    closePanel,
  }
}
