import type { Link, Node } from "../graph"

export type MindmapState = {
  nodes: Node[]
  links: Link[]
}

export const initialMindmapState: MindmapState = {
  nodes: [],
  links: [],
}

export type MindmapAction =
  | { type: "add-node"; node: Node }
  | { type: "remove-node"; id: string }
  | { type: "rename"; id: string; label: string }
  | { type: "move-node"; id: string; x: number; y: number }
  | { type: "add-link"; link: Link }
  | { type: "update-link"; id: string; patch: Partial<Pick<Link, "from" | "to" | "fromSide" | "toSide">> }
  | { type: "remove-link"; id: string }

export function mindmapReducer(state: MindmapState, action: MindmapAction): MindmapState {
  switch (action.type) {
    case "add-node":
      return { ...state, nodes: [...state.nodes, action.node] }

    case "remove-node":
      return {
        ...state,
        nodes: state.nodes.filter((n) => n.id !== action.id),
        links: state.links.filter((l) => l.from !== action.id && l.to !== action.id),
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
  }
}
