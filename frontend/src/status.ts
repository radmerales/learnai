export type NoteStatus = "todo" | "learn" | "quiz" | "master"

export type NoteStatusStyle = {
  label: string
  outline: string
  background: string
  text: string
}

export const NOTE_STATUSES: Record<NoteStatus, NoteStatusStyle> = {
  todo: {
    label: "To do",
    outline: "#6b6a6a",
    background: "#e1e0dd",
    text: "#1d1d1d",
  },
  learn: {
    label: "Learn",
    outline: "#1d4ed8",
    background: "#dbeafe",
    text: "#1e3a8a",
  },
  quiz: {
    label: "Quiz",
    outline: "#6d28d9",
    background: "#ede9fe",
    text: "#4c1d95",
  },
  master: {
    label: "Master",
    outline: "#15803d",
    background: "#dcfce7",
    text: "#14532d",
  },
}

export const NOTE_STATUS_ORDER: NoteStatus[] = ["todo", "learn", "quiz", "master"]
export const DEFAULT_NOTE_STATUS: NoteStatus = "todo"
