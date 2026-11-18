import type { Link, Node, TextBox } from "../graph"
import type { QuizQuestion } from "../quiz"
import type { NoteStatus } from "../status"

export type MindmapState = {
  nodes: Node[]
  links: Link[]
  texts: TextBox[]
}

export const initialMindmapState: MindmapState = {
  nodes: [],
  links: [],
  texts: [],
}

export type MindmapAction =
  | { type: "add-node"; node: Node }
  | { type: "remove-node"; id: string }
  | { type: "rename"; id: string; label: string; width: number }
  | { type: "set-blocks"; id: string; blocks: string[] }
  | { type: "set-questions"; id: string; questions: QuizQuestion[] }
  | { type: "set-status"; id: string; status: NoteStatus }
  | { type: "replace"; nodes: Node[]; links: Link[]; texts: TextBox[] }
  | { type: "move-nodes"; moves: { id: string; x: number; y: number }[] }
  | { type: "add-link"; link: Link }
  | {
      type: "update-link"
      id: string
      patch: Partial<Pick<Link, "from" | "to" | "fromSide" | "toSide" | "text" | "arrow">>
    }
  | { type: "remove-link"; id: string }
  | { type: "add-text"; text: TextBox }
  | { type: "update-text"; id: string; text: string }
  | { type: "move-text"; id: string; x: number; y: number }
  | { type: "remove-text"; id: string }

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
        nodes: state.nodes.map((n) =>
          n.id === action.id ? { ...n, label: action.label, width: action.width } : n,
        ),
      }

    case "set-blocks":
      return {
        ...state,
        nodes: state.nodes.map((n) => (n.id === action.id ? { ...n, blocks: action.blocks } : n)),
      }

    case "set-questions":
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.id ? { ...n, questions: action.questions } : n,
        ),
      }

    case "set-status":
      return {
        ...state,
        nodes: state.nodes.map((n) => (n.id === action.id ? { ...n, status: action.status } : n)),
      }

    case "replace":
      // Loading a saved map replaces the entire graph in one transition.
      return { nodes: action.nodes, links: action.links, texts: action.texts }

    case "move-nodes": {
      const moves = new Map(action.moves.map((move) => [move.id, move]))
      return {
        ...state,
        nodes: state.nodes.map((n) => {
          const move = moves.get(n.id)
          return move ? { ...n, x: move.x, y: move.y } : n
        }),
      }
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

    case "add-text":
      return { ...state, texts: [...state.texts, action.text] }

    case "update-text":
      return {
        ...state,
        texts: state.texts.map((text) =>
          text.id === action.id ? { ...text, text: action.text } : text,
        ),
      }

    case "move-text":
      return {
        ...state,
        texts: state.texts.map((text) =>
          text.id === action.id ? { ...text, x: action.x, y: action.y } : text,
        ),
      }

    case "remove-text":
      return { ...state, texts: state.texts.filter((text) => text.id !== action.id) }
  }
}
