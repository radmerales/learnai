import { useCallback, useMemo, useReducer, useRef } from "react"

import { nearestSide, uid, type Link, type Node, type Point, type Side } from "../graph"
import { initialMindmapState, mindmapReducer } from "../state/mindmapReducer"

export function useMindmapGraph() {
  const [state, dispatch] = useReducer(mindmapReducer, initialMindmapState)
  const labelCounter = useRef(1)

  const byId = useMemo(() => {
    const map = new Map<string, Node>()
    state.nodes.forEach((node) => map.set(node.id, node))
    return map
  }, [state.nodes])

  const addRoot = useCallback(() => {
    const node: Node = {
      id: uid(),
      label: `Topic ${labelCounter.current++}`,
      x: 420,
      y: 120 + state.nodes.length * 30,
      parentId: null,
    }
    dispatch({ type: "add-root", node })
    return node
  }, [state.nodes.length])

  const addChild = useCallback(
    (parentId: string) => {
      const parent = byId.get(parentId)
      if (!parent) return null
      const childCount = state.nodes.filter((n) => n.parentId === parentId).length
      const node: Node = {
        id: uid(),
        label: `Node ${labelCounter.current++}`,
        x: parent.x + 200,
        y: parent.y + childCount * 70 - 20,
        parentId,
      }
      dispatch({
        type: "add-child",
        node,
        fromSide: nearestSide(parent, node),
        toSide: nearestSide(node, parent),
      })
      return node
    },
    [byId, state.nodes],
  )

  const addChildAt = useCallback(
    (parentId: string, point: Point, fromSide: Side) => {
      const parent = byId.get(parentId)
      if (!parent) return null
      const node: Node = {
        id: uid(),
        label: `Node ${labelCounter.current++}`,
        x: point.x,
        y: point.y,
        parentId,
      }
      dispatch({
        type: "add-child",
        node,
        fromSide,
        toSide: nearestSide(node, parent),
      })
      return node
    },
    [byId],
  )

  const removeSubtree = useCallback((id: string) => {
    dispatch({ type: "remove-subtree", id })
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

  const reparentTree = useCallback(
    (childId: string, parentId: string, fromSide: Side, toSide: Side) => {
      dispatch({ type: "reparent-tree", childId, parentId, fromSide, toSide })
    },
    [],
  )

  const detachTree = useCallback((childId: string) => {
    dispatch({ type: "detach-tree", childId })
  }, [])

  return {
    nodes: state.nodes,
    links: state.links,
    treeSides: state.treeSides,
    byId,
    addRoot,
    addChild,
    addChildAt,
    removeSubtree,
    renameNode,
    moveNode,
    addLink,
    updateLink,
    removeLink,
    reparentTree,
    detachTree,
  }
}

export type MindmapGraph = ReturnType<typeof useMindmapGraph>
