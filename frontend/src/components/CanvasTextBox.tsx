import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react"

import { measureTextBoxHeight, type TextBox } from "../graph"

type Props = {
  textBox: TextBox
  selected: boolean
  editing: boolean
  onStartEdit: (id: string) => void
  onCommit: (id: string, text: string) => void
  onCancel: () => void
  onPointerDown: (event: PointerEvent<SVGForeignObjectElement>, id: string) => void
  onContextMenu: (textBox: TextBox, event: MouseEvent<SVGForeignObjectElement>) => void
}

/** Free-standing, draggable text annotation rendered inside the SVG world. */
export function CanvasTextBox({
  textBox,
  selected,
  editing,
  onStartEdit,
  onCommit,
  onCancel,
  onPointerDown,
  onContextMenu,
}: Props) {
  const [draft, setDraft] = useState(textBox.text)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const height = measureTextBoxHeight(editing ? draft : textBox.text)

  useEffect(() => {
    if (!editing) return
    const element = textareaRef.current
    if (!element) return
    element.focus()
    element.select()
  }, [editing])

  function commit() {
    onCommit(textBox.id, draft.trim() ? draft : "")
  }

  return (
    <foreignObject
      x={textBox.x}
      y={textBox.y}
      width={textBox.width}
      height={height}
      onPointerDown={(event) => {
        if (editing) return
        onPointerDown(event, textBox.id)
      }}
      onContextMenu={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (!editing) onContextMenu(textBox, event)
      }}
    >
      {editing ? (
        <textarea
          ref={textareaRef}
          aria-label="Text box content"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault()
              onCancel()
            } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              event.preventDefault()
              commit()
            }
          }}
          className="h-full w-full resize-none border-0 bg-transparent px-2 py-2 font-sans text-sm leading-5 text-ink outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink"
        />
      ) : (
        <div
          role="textbox"
          tabIndex={0}
          aria-label="Canvas text"
          title="Double-click to edit"
          onDoubleClick={(event) => {
            event.stopPropagation()
            onStartEdit(textBox.id)
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              onStartEdit(textBox.id)
            }
          }}
          className={`h-full w-full cursor-grab overflow-hidden whitespace-pre-wrap border-0 bg-transparent px-2 py-2 font-sans text-sm leading-5 text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-1px] focus-visible:outline-ink ${
            selected ? "outline outline-2 outline-offset-2 outline-ink" : ""
          }`}
        >
          {textBox.text || <span className="text-mutedink">Double-click to edit text</span>}
        </div>
      )}
    </foreignObject>
  )
}
