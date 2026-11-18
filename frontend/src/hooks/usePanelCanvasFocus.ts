import { useEffect, useRef } from "react"

import type { Node } from "../graph"
import { panelFocusTarget } from "../panelViewport"
import type { Viewport } from "./useCanvasViewport"

type Options = {
  node: Node | null
  canvasWidth: number
  canvasHeight: number
  viewport: Viewport
  manualVersion: number
  mapId: string | null
  animateTo: (x: number, y: number) => void
  resetViewport: () => void
}

/**
 * Center the selected node in the left canvas area while the detail panel is
 * open. On close, return to the pre-panel viewport only if the user did not
 * pan or zoom while previewing.
 */
export function usePanelCanvasFocus({
  node,
  canvasWidth,
  canvasHeight,
  viewport,
  manualVersion,
  mapId,
  animateTo,
  resetViewport,
}: Options) {
  const originalRef = useRef<Viewport | null>(null)
  const savedManualVersionRef = useRef<number | null>(null)
  const nodeRef = useRef(node)
  const viewportRef = useRef(viewport)
  const manualVersionRef = useRef(manualVersion)

  useEffect(() => {
    nodeRef.current = node
    viewportRef.current = viewport
    manualVersionRef.current = manualVersion
  })

  useEffect(() => {
    originalRef.current = null
    savedManualVersionRef.current = null
    resetViewport()
  }, [mapId, resetViewport])

  useEffect(() => {
    const current = viewportRef.current

    if (!nodeRef.current) {
      const original = originalRef.current
      const manualChanged =
        savedManualVersionRef.current !== manualVersionRef.current
      originalRef.current = null
      savedManualVersionRef.current = null
      if (original && !manualChanged) animateTo(original.x, original.y)
      return
    }

    if (!canvasWidth || !canvasHeight) return
    if (!originalRef.current) {
      originalRef.current = { ...current }
      savedManualVersionRef.current = manualVersionRef.current
    }

    const panelWidth = canvasWidth >= 768 ? canvasWidth / 2 : 0
    if (!panelWidth) return

    const target = panelFocusTarget(
      current,
      nodeRef.current,
      canvasWidth,
      canvasHeight,
      panelWidth,
    )
    if (target) animateTo(target.x, target.y)
  }, [
    animateTo,
    canvasHeight,
    canvasWidth,
    node?.id,
    viewport.scale,
  ])
}
