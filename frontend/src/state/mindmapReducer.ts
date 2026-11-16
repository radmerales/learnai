import type { Link, Node, Side, TreeSides } from "../graph"

export type MindmapState = {
  nodes: Node[]
  links: Link[]
  treeSides: TreeSides
}

export const initialMindmapState: MindmapState = {
  nodes: [],
  links: [],
  treeSides: {},
}

export type MindmapAction =
  | { type: "add-root"; node: Node }
  | { type: "add-child"; node: Node; fromSide: Side; toSide: Side }
  | { type: "remove-subtree"; id: string }
  | { type: "rename"; id: string; label: string }
  | { type: "move-node"; id: string; x: number; y: number }
  | { type: "add-link"; link: Link }
  | { type: "update-link"; id: string; patch: Partial<Pick<Link, "from" | "to" | "fromSide" | "toSide">> }
  | { type: "remove-link"; id: string }
  | { type: "reparent-tree"; childId: string; parentId: string; fromSide: Side; toSide: Side }
  | { type: "detach-tree"; childId: string }

function collectSubtreeIds(nodes: Node[], rootId: string): Set<string> {
  const ids = new Set<string>([rootId])
  let changed = true

  while (changed) {
    changed = false
    for (const node of nodes) {
      if (node.parentId && ids.has(node.parentId) && !ids.has(node.id)) {
        ids.add(node.id)
        changed = true
      }
    }
  }

  return ids
}

export function mindmapReducer(state: MindmapState, action: MindmapAction): MindmapState {
  switch (action.type) {
    case "add-root":
      return { ...state, nodes: [...state.nodes, action.node] }

    case "add-child":
      return {
        ...state,
        nodes: [...state.nodes, action.node],
        treeSides: {
          ...state.treeSides,
          [action.node.id]: { fromSide: action.fromSide, toSide: action.toSide },
        },
      }

    case "remove-subtree": {
      const ids = collectSubtreeIds(state.nodes, action.id)
      const treeSides = { ...state.treeSides }
      ids.forEach((id) => delete treeSides[id])
      return {
        ...state,
        nodes: state.nodes.filter((n) => !ids.has(n.id)),
        links: state.links.filter((l) => !ids.has(l.from) && !ids.has(l.to)),
        treeSides,
      }
    }

    case "rename":
      return {
        ...state,
        nodes: state.nodes.map((n) => (n.id === action.id ? { ...n, label: action.label } : n)),
      }

    case "move-node":
      return {
        ...state,
        nodes: state.nodes.map((n) => (n.id === action.id ? { ...n, x: action.x, y: action.y } : n)),
      }

    case "add-link":
      return { ...state, links: [...state.links, action.link] }

    case "update-link":
      return {
        ...state,
        links: state.links.map((l) => (l.id === action.id ? { ...l, ...action.patch } : l)),
      }

    case "remove-link":
      return { ...state, links: state.links.filter((l) => l.id !== action.id) }

    case "reparent-tree":
      return {
        ...state,
        nodes: state.nodes.map((n) => (n.id === action.childId ? { ...n, parentId: action.parentId } : n)),
        treeSides: {
          ...state.treeSides,
          [action.childId]: { fromSide: action.fromSide, toSide: action.toSide },
        },
      }

    case "detach-tree": {
      const treeSides = { ...state.treeSides }
      delete treeSides[action.childId]
      return {
        ...state,
        nodes: state.nodes.map((n) => (n.id === action.childId ? { ...n, parentId: null } : n)),
        treeSides,
      }
    }
  }
}
