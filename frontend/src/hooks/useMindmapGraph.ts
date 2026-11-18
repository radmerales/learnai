import { useCallback, useMemo, useReducer, useRef } from "react"

import {
  makeTextBox,
  measureNodeWidth,
  nextNodeNumber,
  uid,
  type Link,
  type Node,
  type Point,
  type TextBox,
} from "../graph"
import { initialMindmapState, mindmapReducer } from "../state/mindmapReducer"
import { DEFAULT_NOTE_STATUS } from "../status"

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
      blocks: [""],
      questions: [],
      status: DEFAULT_NOTE_STATUS,
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

  const setNodeBlocks = useCallback((id: string, blocks: string[]) => {
    dispatch({ type: "set-blocks", id, blocks })
  }, [])

  const setNodeQuestions = useCallback((id: string, questions: Node["questions"]) => {
    dispatch({ type: "set-questions", id, questions })
  }, [])

  const setNodeStatus = useCallback((id: string, status: Node["status"]) => {
    dispatch({ type: "set-status", id, status })
  }, [])

  const replaceState = useCallback((nodes: Node[], links: Link[], texts: TextBox[] = []) => {
    labelCounter.current = nextNodeNumber(nodes)
    dispatch({ type: "replace", nodes, links, texts })
  }, [])

  const moveNodes = useCallback((moves: { id: string; x: number; y: number }[]) => {
    dispatch({ type: "move-nodes", moves })
  }, [])

  const addLink = useCallback(
    (
      link: Omit<Link, "id" | "text" | "arrow"> &
        Partial<Pick<Link, "text" | "arrow">>,
    ) => {
      dispatch({
        type: "add-link",
        link: { text: "", arrow: "none", ...link, id: uid() },
      })
    },
    [],
  )

  const updateLink = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<Link, "from" | "to" | "fromSide" | "toSide" | "text" | "arrow">
      >,
    ) => {
      dispatch({ type: "update-link", id, patch })
    },
    [],
  )

  const removeLink = useCallback((id: string) => {
    dispatch({ type: "remove-link", id })
  }, [])

  const addText = useCallback((point: Point, text = "") => {
    const next = makeTextBox(point, text)
    dispatch({ type: "add-text", text: next })
    return next
  }, [])

  const updateText = useCallback((id: string, text: string) => {
    dispatch({ type: "update-text", id, text })
  }, [])

  const moveText = useCallback((id: string, x: number, y: number) => {
    dispatch({ type: "move-text", id, x, y })
  }, [])

  const removeText = useCallback((id: string) => {
    dispatch({ type: "remove-text", id })
  }, [])

  return {
    nodes: state.nodes,
    links: state.links,
    texts: state.texts,
    byId,
    addNode,
    removeNode,
    renameNode,
    setNodeBlocks,
    setNodeQuestions,
    setNodeStatus,
    replaceState,
    moveNodes,
    addLink,
    updateLink,
    removeLink,
    addText,
    updateText,
    moveText,
    removeText,
  }
}

export type MindmapGraph = ReturnType<typeof useMindmapGraph>
