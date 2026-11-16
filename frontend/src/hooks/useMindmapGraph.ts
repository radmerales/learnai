import { useCallback, useMemo, useReducer, useRef } from "react"

import { measureNodeWidth, uid, type Link, type Node, type Point } from "../graph"
import { initialMindmapState, mindmapReducer } from "../state/mindmapReducer"

export function useMindmapGraph() {
  const [state, dispatch] = useReducer(mindmapReducer, initialMindmapState)
  const labelCounter = useRef(1)

  const byId = useMemo(() => {
    const map = new Map<string, Node>()
    state.nodes.forEach((node) => map.set(node.id, node))
    return map
  }, [state.nodes])

  const addNode = useCallback((point: Point) => {
    const label = `Node ${labelCounter.current++}`
    const node: Node = {
      id: uid(),
      label,
      content: "",
      x: point.x,
      y: point.y,
      width: measureNodeWidth(label),
    }
    dispatch({ type: "add-node", node })
    return node
  }, [])

  const removeNode = useCallback((id: string) => {
    dispatch({ type: "remove-node", id })
  }, [])

  const renameNode = useCallback((id: string, label: string) => {
    dispatch({ type: "rename", id, label, width: measureNodeWidth(label) })
  }, [])

  const setNodeContent = useCallback((id: string, content: string) => {
    dispatch({ type: "set-content", id, content })
  }, [])

  const moveNodes = useCallback((moves: { id: string; x: number; y: number }[]) => {
    dispatch({ type: "move-nodes", moves })
  }, [])

  const addLink = useCallback((link: Omit<Link, "id">) => {
    dispatch({ type: "add-link", link: { ...link, id: uid() } })
  }, [])

  const updateLink = useCallback(
    (id: string, patch: Partial<Pick<Link, "from" | "to" | "fromSide" | "toSide">>) => {
      dispatch({ type: "update-link", id, patch })
    },
    [],
  )

  const removeLink = useCallback((id: string) => {
    dispatch({ type: "remove-link", id })
  }, [])

  return {
    nodes: state.nodes,
    links: state.links,
    byId,
    addNode,
    removeNode,
    renameNode,
    setNodeContent,
    moveNodes,
    addLink,
    updateLink,
    removeLink,
  }
}

export type MindmapGraph = ReturnType<typeof useMindmapGraph>
