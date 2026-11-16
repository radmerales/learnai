import type { Side } from "../graph"
import type { QuizQuestion } from "../quiz"
import type { NoteStatus } from "../status"

export type MindmapNodeDocument = {
  id: string
  label: string
  status: NoteStatus
  x: number
  y: number
  width: number
  learn: { blocks: string[] }
  quiz: { questions: QuizQuestion[] }
}

export type MindmapLinkDocument = {
  id: string
  from: string
  to: string
  fromSide: Side
  toSide: Side
}

export type MindmapDocument = {
  schemaVersion: 1
  title: string
  nodes: MindmapNodeDocument[]
  links: MindmapLinkDocument[]
}

export type MindmapResource = MindmapDocument & {
  id: string
  createdAt: string
  updatedAt: string
}

export type MindmapSummary = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}
