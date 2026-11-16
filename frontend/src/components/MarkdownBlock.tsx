import { useEffect, useRef } from "react"

import { MarkdownPreview } from "./MarkdownPreview"

type Props = {
  content: string
  editing: boolean
  onChange: (content: string) => void
  onEdit: () => void
  onDone: () => void
}

const smallButton =
  "border border-hairline bg-paper px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink hover:bg-surface hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"

export function MarkdownBlock({ content, editing, onChange, onEdit, onDone }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!editing) return
    const element = textareaRef.current
    if (!element) return
    element.focus()
    element.setSelectionRange(element.value.length, element.value.length)
  }, [editing])

  if (!editing) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label="Markdown block. Double-click or press Enter to edit."
        title="Double-click to edit"
        onDoubleClick={onEdit}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onEdit()
          }
        }}
        className="group cursor-text border border-transparent px-3 py-2 hover:border-hairline focus-visible:border-ink focus-visible:outline-none"
      >
        {content.trim() ? (
          <MarkdownPreview content={content} />
        ) : (
          <p className="text-sm text-mutedink">Empty block. Double-click to edit.</p>
        )}
      </div>
    )
  }

  return (
    <div className="border border-ink bg-paper">
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-3 py-1.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink">Editing block</p>
        <button type="button" onClick={onDone} className={smallButton}>
          Done
        </button>
      </div>

      <div className="grid h-[60vh] min-h-[360px] grid-cols-1 grid-rows-[1fr_1fr] sm:grid-cols-2 sm:grid-rows-1">
        <div className="flex min-h-0 flex-col border-b border-hairline sm:border-b-0 sm:border-r">
          <p className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink">Source</p>
          <textarea
            ref={textareaRef}
            aria-label="Markdown source"
            spellCheck={false}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault()
                onDone()
              }
            }}
            className="min-h-0 flex-1 resize-none bg-surface px-4 py-3 font-mono text-sm leading-6 text-ink outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink"
          />
        </div>

        <div className="flex min-h-0 flex-col">
          <p className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink">Preview</p>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <MarkdownPreview content={content} />
          </div>
        </div>
      </div>
    </div>
  )
}
