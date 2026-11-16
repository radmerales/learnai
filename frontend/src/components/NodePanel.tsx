import { useState } from "react"

import type { Node } from "../graph"
import type { QuizQuestion } from "../quiz"
import { NOTE_STATUSES, NOTE_STATUS_ORDER, type NoteStatus } from "../status"
import { LearnTab } from "./LearnTab"
import { NodeQuiz } from "./NodeQuiz"

type PanelTab = "learn" | "quiz"

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
  onBlocksChange: (blocks: string[]) => void
  onQuestionsChange: (questions: QuizQuestion[]) => void
  onStatusChange: (status: NoteStatus) => void
}

export function NodePanel({
  node,
  onClose,
  onTitleChange,
  onBlocksChange,
  onQuestionsChange,
  onStatusChange,
}: Props) {
  const [tab, setTab] = useState<PanelTab>("learn")

  return (
    <aside
      aria-label="Node details"
      className="absolute inset-y-0 right-0 z-30 flex w-full flex-col border-l border-ink bg-paper md:w-1/2"
    >
      <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <input
              aria-label="Node title"
              value={node.label}
              onChange={(e) => onTitleChange(e.target.value)}
              className="min-w-0 flex-1 border-b border-transparent bg-transparent text-2xl font-semibold leading-tight text-ink outline-none focus:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
            />
            <div
              role="group"
              aria-label="Note status"
              className="inline-flex shrink-0 overflow-hidden rounded-md border border-ink"
            >
              {NOTE_STATUS_ORDER.map((status, index) => {
                const style = NOTE_STATUSES[status]
                const active = node.status === status
                return (
                  <button
                    key={status}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onStatusChange(status)}
                    style={active ? { backgroundColor: style.outline } : undefined}
                    className={`${
                      index < NOTE_STATUS_ORDER.length - 1 ? "border-r border-hairline" : ""
                    } px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink ${
                      active
                        ? "font-bold text-white"
                        : "bg-surface text-mutedink hover:bg-paper hover:text-ink"
                    }`}
                  >
                    {style.label}
                  </button>
                )
              })}
            </div>
          </div>
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

      <div role="tablist" aria-label="Node details sections" className="flex border-b border-hairline px-5">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "learn"}
          aria-controls="node-learn-panel"
          onClick={() => setTab("learn")}
          className={`-mb-px border-b-2 px-3 py-3 font-mono text-[10px] uppercase tracking-[0.08em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
            tab === "learn" ? "border-ink text-ink" : "border-transparent text-mutedink hover:text-ink"
          }`}
        >
          Learn
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

      {tab === "learn" ? (
        <div id="node-learn-panel" role="tabpanel" aria-label="Learn notes" className="min-h-0 flex-1">
          <LearnTab key={node.id} blocks={node.blocks} onChange={onBlocksChange} />
        </div>
      ) : (
        <div id="node-quiz-panel" role="tabpanel" aria-label="Node quiz" className="min-h-0 flex-1">
          <NodeQuiz key={node.id} questions={node.questions} onChange={onQuestionsChange} />
        </div>
      )}
    </aside>
  )
}
