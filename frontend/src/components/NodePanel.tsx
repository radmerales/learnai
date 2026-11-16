import { useState } from "react"

import type { Node } from "../graph"
import { NOTE_STATUSES, NOTE_STATUS_ORDER, type NoteStatus } from "../status"
import { NodeQuiz } from "./NodeQuiz"

type PanelTab = "contents" | "quiz"

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
    >
      <path d="M3 3l10 10M13 3L3 13" />
    </svg>
  )
}

type Props = {
  node: Node
  onClose: () => void
  onTitleChange: (title: string) => void
  onContentChange: (content: string) => void
  onStatusChange: (status: NoteStatus) => void
}

export function NodePanel({ node, onClose, onTitleChange, onContentChange, onStatusChange }: Props) {
  const [tab, setTab] = useState<PanelTab>("contents")

  return (
    <aside
      aria-label="Node details"
      className="absolute inset-y-0 right-0 z-30 flex w-full flex-col border-l border-ink bg-paper md:w-1/2"
    >
      <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4">
        <div className="min-w-0 flex-1">
          <input
            aria-label="Node title"
            value={node.label}
            onChange={(e) => onTitleChange(e.target.value)}
            className="mt-2 w-full border-b border-transparent bg-transparent text-2xl font-semibold leading-tight text-ink outline-none focus:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          />
        </div>
        <button
          type="button"
          aria-label="Close node panel"
          onClick={onClose}
          className="shrink-0 border border-hairline bg-paper p-2 text-ink hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-hairline px-5 py-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink">Status</span>
        <div role="group" aria-label="Note status" className="inline-flex overflow-hidden rounded-md border border-ink">
          {NOTE_STATUS_ORDER.map((status, index) => {
            const style = NOTE_STATUSES[status]
            const active = node.status === status
            return (
              <button
                key={status}
                type="button"
                aria-pressed={active}
                onClick={() => onStatusChange(status)}
                style={{
                  backgroundColor: active ? style.outline : style.background,
                  color: active ? "#ffffff" : style.text,
                }}
                className={`${
                  index < NOTE_STATUS_ORDER.length - 1 ? "border-r border-hairline" : ""
                } px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink`}
              >
                {style.label}
              </button>
            )
          })}
        </div>
      </div>

      <div role="tablist" aria-label="Node details sections" className="flex border-b border-hairline px-5">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "contents"}
          aria-controls="node-contents-panel"
          onClick={() => setTab("contents")}
          className={`-mb-px border-b-2 px-3 py-3 font-mono text-[10px] uppercase tracking-[0.08em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
            tab === "contents" ? "border-ink text-ink" : "border-transparent text-mutedink hover:text-ink"
          }`}
        >
          Contents
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "quiz"}
          aria-controls="node-quiz-panel"
          onClick={() => setTab("quiz")}
          className={`-mb-px border-b-2 px-3 py-3 font-mono text-[10px] uppercase tracking-[0.08em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
            tab === "quiz" ? "border-ink text-ink" : "border-transparent text-mutedink hover:text-ink"
          }`}
        >
          Quiz
        </button>
      </div>

      {tab === "contents" ? (
        <div
          id="node-contents-panel"
          role="tabpanel"
          aria-label="Node contents"
          className="flex min-h-0 flex-1 flex-col px-5 py-4"
        >
          <textarea
            aria-label="Node contents"
            value={node.content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Write notes for this node…"
            className="min-h-0 flex-1 resize-none border-0 bg-transparent font-sans text-sm leading-6 text-ink outline-none placeholder:text-[#6b6a6a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          />
        </div>
      ) : (
        <div id="node-quiz-panel" role="tabpanel" aria-label="Node quiz" className="min-h-0 flex-1">
          <NodeQuiz key={node.id} nodeLabel={node.label} />
        </div>
      )}
    </aside>
  )
}
