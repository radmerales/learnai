import { useState, type PointerEvent } from "react"

import type { Point, TextBox } from "../graph"

type DragState = {
  id: string
  startX: number
  startY: number
  originX: number
  originY: number
}

type Options = {
  texts: TextBox[]
  moveText: (id: string, x: number, y: number) => void
  selectText: (id: string, additive?: boolean) => void
  toSvgPoint: (clientX: number, clientY: number) => Point
}

/** Drag a free-standing canvas text annotation. */
export function useTextDrag({ texts, moveText, selectText, toSvgPoint }: Options) {
  const [drag, setDrag] = useState<DragState | null>(null)

  function start(event: PointerEvent<SVGForeignObjectElement>, id: string) {
    event.stopPropagation()
    if (event.button !== 0) return
    const text = texts.find((item) => item.id === id)
    if (!text) return
    selectText(id, event.shiftKey || event.metaKey || event.ctrlKey)
    const point = toSvgPoint(event.clientX, event.clientY)
    setDrag({
      id,
      startX: point.x,
      startY: point.y,
      originX: text.x,
      originY: text.y,
    })
  }

  function move(event: PointerEvent<SVGSVGElement>) {
    if (!drag) return
    const point = toSvgPoint(event.clientX, event.clientY)
    moveText(
      drag.id,
      drag.originX + point.x - drag.startX,
      drag.originY + point.y - drag.startY,
    )
  }

  function finish() {
    setDrag(null)
  }

  function cancel() {
    setDrag(null)
  }

  return { drag, start, move, finish, cancel }
}
