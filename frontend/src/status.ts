export type NoteStatus = "todo" | "doing" | "done"

export type NoteStatusStyle = {
  label: string
  outline: string
  background: string
  text: string
}

export const NOTE_STATUSES: Record<NoteStatus, NoteStatusStyle> = {
  todo: {
    label: "To Do",
    outline: "#6b6a6a",
    background: "#e1e0dd",
    text: "#1d1d1d",
  },
  doing: {
    label: "Doing",
    outline: "#1d4ed8",
    background: "#dbeafe",
    text: "#1e3a8a",
  },
  done: {
    label: "Done",
    outline: "#15803d",
    background: "#dcfce7",
    text: "#14532d",
  },
}

export const NOTE_STATUS_ORDER: NoteStatus[] = ["todo", "doing", "done"]
export const DEFAULT_NOTE_STATUS: NoteStatus = "todo"
