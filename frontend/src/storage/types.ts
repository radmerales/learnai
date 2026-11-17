/**
 * The JSON document shape stored in localStorage.
 *
 * These types mirror the portable document format: Learn content lives under
 * `learn.blocks`, quiz content under `quiz.questions`, and metadata such as
 * `createdAt` / `updatedAt` is managed by the storage layer.
 */
import type { Side } from "../graph"
import type { QuizQuestion } from "../quiz"
import type { NoteStatus } from "../status"

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

/** The complete document saved for one map. */
export type MindmapDocument = {
  schemaVersion: 1
  title: string
  nodes: MindmapNodeDocument[]
  links: MindmapLinkDocument[]
}

/** A saved document plus locally managed metadata. */
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
