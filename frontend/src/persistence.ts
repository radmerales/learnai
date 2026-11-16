import type { Link, Node } from "./graph"
import type {
  MindmapDocument,
  MindmapLinkDocument,
  MindmapNodeDocument,
} from "./api/types"

export const UNTITLED_MINDMAP = "Untitled mindmap"

export type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error"

function normalizeTitle(title: string): string {
  return title.trim() || UNTITLED_MINDMAP
}

function toDocumentNode(node: Node): MindmapNodeDocument {
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
  }
}

export function toMindmapDocument(
  title: string,
  nodes: Node[],
  links: Link[],
): MindmapDocument {
  return {
    schemaVersion: 1,
    title: normalizeTitle(title),
    nodes: nodes.map(toDocumentNode),
    links: links.map(toDocumentLink),
  }
}

export function fromMindmapDocument(document: MindmapDocument): {
  nodes: Node[]
  links: Link[]
} {
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
    })),
  }
}

export function emptyMindmap(): MindmapDocument {
  return toMindmapDocument(UNTITLED_MINDMAP, [], [])
}
