/**
 * These types describe the JSON that the FastAPI backend sends and receives.
 *
 * If you know Python: a TypeScript `type` is like a `TypedDict` or a Pydantic
 * model for the editor. It is erased when the app runs, so the backend must
 * still validate the data (which it does with Pydantic).
 *
 * `import type` only imports the shape for type-checking; it adds no JavaScript
 * to the production bundle.
 */
import type { Side } from "../graph"
import type { QuizQuestion } from "../quiz"
import type { NoteStatus } from "../status"

/**
 * A node as stored on the server. The Learn tab lives under `learn.blocks` and
 * the Quiz tab under `quiz.questions`, which keeps the JSON self-describing.
 */
export type MindmapNodeDocument = {
  id: string
  label: string
  status: NoteStatus
  /** Canvas coordinates and measured width, in pixels. */
  x: number
  y: number
  width: number
  learn: { blocks: string[] }
  quiz: { questions: QuizQuestion[] }
}

/**
 * An edge between two nodes. `fromSide` / `toSide` remember which side of the
 * node the curve attaches to, so moving a node does not re-route the edge.
 */
export type MindmapLinkDocument = {
  id: string
  from: string
  to: string
  fromSide: Side
  toSide: Side
}

/**
 * The complete document a browser sends when saving. `schemaVersion` lets the
 * backend and frontend agree on the JSON shape as the format evolves.
 */
export type MindmapDocument = {
  schemaVersion: 1
  title: string
  nodes: MindmapNodeDocument[]
  links: MindmapLinkDocument[]
}

/** A saved document plus server-managed metadata. */
export type MindmapResource = MindmapDocument & {
  id: string
  createdAt: string
  updatedAt: string
}

/** The small row shown in the map picker; it does not include nodes or links. */
export type MindmapSummary = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}
