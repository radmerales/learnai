import { useEffect, useRef, useState } from "react"

import type { RenderedEdge } from "../graph"
import type { Viewport } from "../hooks/useCanvasViewport"

type Props = {
  edge: RenderedEdge
  viewport: Viewport
  onCommit: (text: string) => void
  onCancel: () => void
}

/** Compact input anchored to an edge midpoint for label editing. */
export function InlineEdgeEditor({ edge, viewport, onCommit, onCancel }: Props) {
  const [draft, setDraft] = useState(edge.text)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.focus()
    input.select()
  }, [])

  function commit() {
    onCommit(draft)
  }

  return (
    <input
      ref={inputRef}
      aria-label="Edge text"
      value={draft}
      placeholder="Edge text"
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault()
          commit()
        } else if (event.key === "Escape") {
          event.preventDefault()
          onCancel()
        }
      }}
      style={{
        left: viewport.x + edge.midpoint.x * viewport.scale,
        top: viewport.y + edge.midpoint.y * viewport.scale,
        width: 200 * viewport.scale,
        fontSize: `${13 * viewport.scale}px`,
      }}
      className="absolute z-20 -translate-x-1/2 -translate-y-1/2 border border-ink bg-paper px-2 py-1 text-center text-ink outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink"
    />
  )
}
