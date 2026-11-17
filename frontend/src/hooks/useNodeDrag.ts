import { useState, type PointerEvent } from "react"

import type { Node, Point } from "../graph"

type DragState = {
  ids: string[]
  starts: Record<string, { x: number; y: number }>
  startX: number
  startY: number
  moved: boolean
  additive: boolean
  anchorId: string
}

type Options = {
  byId: Map<string, Node>
  moveNodes: (moves: { id: string; x: number; y: number }[]) => void
  selectedNodeIds: string[]
  selectNode: (id: string, additive?: boolean) => void
  focusNode: (id: string) => void
  toSvgPoint: (clientX: number, clientY: number) => Point
  /** Called after the pointer is validated, e.g. to clear edge hover. */
  onStart?: () => void
}

/**
 * Node dragging and group dragging.
 *
 * The starting position of every selected node is captured once, then all
 * nodes receive the same pointer delta. That avoids accumulating rounding
 * errors or letting nodes drift apart during a drag.
 */
export function useNodeDrag({
  byId,
  moveNodes,
  selectedNodeIds,
  selectNode,
  focusNode,
  toSvgPoint,
  onStart,
}: Options) {
  const [drag, setDrag] = useState<DragState | null>(null)

  function start(event: PointerEvent<SVGGElement>, id: string) {
    event.stopPropagation()
    if (event.button !== 0) return

    const node = byId.get(id)
    if (!node) return

    onStart?.()
    const point = toSvgPoint(event.clientX, event.clientY)
    const additive = event.shiftKey || event.metaKey || event.ctrlKey
    selectNode(id, additive)

    const alreadySelected = selectedNodeIds.includes(id)
    const ids = additive
      ? alreadySelected
        ? selectedNodeIds
        : [...selectedNodeIds, id]
      : alreadySelected
        ? selectedNodeIds
        : [id]

    const starts: DragState["starts"] = {}
    ids.forEach((dragId) => {
      const dragNode = byId.get(dragId)
      if (dragNode) starts[dragId] = { x: dragNode.x, y: dragNode.y }
    })

    setDrag({
      ids,
      starts,
      startX: point.x,
      startY: point.y,
      moved: false,
      additive,
      anchorId: id,
    })

    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function move(event: PointerEvent<SVGSVGElement>) {
    if (!drag) return

    const point = toSvgPoint(event.clientX, event.clientY)
    const moved = drag.moved || Math.hypot(point.x - drag.startX, point.y - drag.startY) > 3
    const dx = point.x - drag.startX
    const dy = point.y - drag.startY

    moveNodes(
      Object.entries(drag.starts).map(([id, start]) => ({
        id,
        x: start.x + dx,
        y: start.y + dy,
      })),
    )

    if (moved !== drag.moved) {
      setDrag((previous) => (previous ? { ...previous, moved } : previous))
    }
  }

  function finish(event: PointerEvent<SVGSVGElement>) {
    if (!drag) return

    const point = toSvgPoint(event.clientX, event.clientY)
    const moved = drag.moved || Math.hypot(point.x - drag.startX, point.y - drag.startY) > 3
    // A click without movement focuses the node; a drag should not.
    if (!moved && !drag.additive) focusNode(drag.anchorId)
    setDrag(null)
  }

  function cancel() {
    setDrag(null)
  }

  return { drag, start, move, finish, cancel }
}
