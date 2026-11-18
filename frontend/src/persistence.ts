/**
 * Translation layer between two shapes of the same data:
 *
 * 1. The UI's `Node` / `Link` objects (flat `blocks` and `questions` fields).
 * 2. The stored JSON document (`learn.blocks` and `quiz.questions`).
 *
 * Keeping this mapping in one pure module means components never need to know
 * about the storage format. "Pure" here means the functions only read arguments
 * and return new values; they do not mutate state or touch browser storage.
 */
import type { Link, Node, TextBox } from "./graph"
import type {
  MindmapDocument,
  MindmapLinkDocument,
  MindmapNodeDocument,
  MindmapTextBoxDocument,
} from "./storage/types"

export const UNTITLED_MINDMAP = "Untitled mindmap"

/** Save indicator shown in the header. */
export type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error"

/** A blank title is valid while typing, but saved maps need a real title. */
function normalizeTitle(title: string): string {
  return title.trim() || UNTITLED_MINDMAP
}

function toDocumentNode(node: Node): MindmapNodeDocument {
  // The spread/copy syntax (`[...array]`) prevents the stored document from
  // sharing arrays with React state. That makes later edits predictable.
  return {
    id: node.id,
    label: node.label,
    status: node.status,
    x: node.x,
    y: node.y,
    width: node.width,
    learn: { blocks: [...node.blocks] },
    quiz: {
      questions: node.questions.map((question) => ({
        ...question,
        options: [...question.options],
      })),
    },
  }
}

function toDocumentLink(link: Link): MindmapLinkDocument {
  return {
    id: link.id,
    from: link.from,
    to: link.to,
    fromSide: link.fromSide,
    toSide: link.toSide,
    text: link.text,
    arrow: link.arrow,
  }
}

function toDocumentText(text: TextBox): MindmapTextBoxDocument {
  return { id: text.id, text: text.text, x: text.x, y: text.y, width: text.width }
}

/** UI objects -> JSON document (used by autosave). */
export function toMindmapDocument(
  title: string,
  nodes: Node[],
  links: Link[],
  texts: TextBox[] = [],
): MindmapDocument {
  return {
    schemaVersion: 1,
    title: normalizeTitle(title),
    nodes: nodes.map(toDocumentNode),
    links: links.map(toDocumentLink),
    texts: texts.map(toDocumentText),
  }
}

/** JSON document -> UI objects (used after loading a map). */
export function fromMindmapDocument(document: MindmapDocument): {
  nodes: Node[]
  links: Link[]
  texts: TextBox[]
} {
  // The cast lets us compare a literal type (`1`) with a value that may have
  // come from older saved data at runtime.
  if ((document.schemaVersion as number) !== 1) {
    throw new Error(`Unsupported mindmap schema version: ${document.schemaVersion}`)
  }

  return {
    nodes: document.nodes.map((node) => ({
      id: node.id,
      label: node.label,
      blocks: [...node.learn.blocks],
      questions: node.quiz.questions.map((question) => ({
        ...question,
        options: [...question.options],
      })),
      status: node.status,
      x: node.x,
      y: node.y,
      width: node.width,
    })),
    links: document.links.map((link) => ({
      id: link.id,
      from: link.from,
      to: link.to,
      fromSide: link.fromSide,
      toSide: link.toSide,
      text: link.text ?? "",
      arrow: link.arrow ?? "none",
    })),
    texts: (document.texts ?? []).map((text) => ({ ...text })),
  }
}

/** A new map has a title but no nodes or links yet. */
export function emptyMindmap(): MindmapDocument {
  return toMindmapDocument(UNTITLED_MINDMAP, [], [])
}
