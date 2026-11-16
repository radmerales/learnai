import { useCallback, useMemo, useReducer, useRef } from "react"

import { uid, type Link, type Node, type Point } from "../graph"
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
    const node: Node = {
      id: uid(),
      label: `Node ${labelCounter.current++}`,
      x: point.x,
      y: point.y,
    }
    dispatch({ type: "add-node", node })
    return node
  }, [])

  const removeNode = useCallback((id: string) => {
    dispatch({ type: "remove-node", id })
  }, [])

  const renameNode = useCallback((id: string, label: string) => {
    dispatch({ type: "rename", id, label })
  }, [])

  const moveNode = useCallback((id: string, x: number, y: number) => {
    dispatch({ type: "move-node", id, x, y })
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
    moveNode,
    addLink,
    updateLink,
    removeLink,
  }
}

export type MindmapGraph = ReturnType<typeof useMindmapGraph>
