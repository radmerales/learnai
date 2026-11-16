import { useEffect, useRef, useState } from "react"

import { MarkdownPreview } from "./MarkdownPreview"

type Props = {
  content: string
  onChange: (content: string) => void
}

const smallButton =
  "border border-hairline bg-paper px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink hover:bg-surface hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"

export function MarkdownCell({ content, onChange }: Props) {
  const [editing, setEditing] = useState(false)
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
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink">Markdown</p>
          <button type="button" onClick={() => setEditing(true)} className={smallButton}>
            Edit
          </button>
        </div>
        <div
          className="min-h-0 flex-1 overflow-y-auto px-5 py-4"
          onDoubleClick={() => setEditing(true)}
        >
          <MarkdownPreview content={content} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink">Editing markdown</p>
        <button type="button" onClick={() => setEditing(false)} className={smallButton}>
          Done
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[1fr_1fr] sm:grid-cols-2 sm:grid-rows-1">
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
                setEditing(false)
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
