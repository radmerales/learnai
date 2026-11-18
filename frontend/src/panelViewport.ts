import type { Node } from "./graph"
import type { Viewport } from "./hooks/useCanvasViewport"

const EDGE_PADDING = 28

export type PanelFocusTarget = {
  x: number
  y: number
}

/**
 * Center the selected node in the canvas area that remains to the left of the
 * detail panel. The panel covers the right side of the canvas, so the target
 * screen center is half of `canvasWidth - panelWidth`.
 *
 * Returns `null` when the panel leaves no usable canvas or the node is already
 * centered there.
 */
export function panelFocusTarget(
  viewport: Viewport,
  node: Node,
  canvasWidth: number,
  canvasHeight: number,
  panelWidth: number,
  padding = EDGE_PADDING,
): PanelFocusTarget | null {
  const visibleWidth = canvasWidth - panelWidth
  if (visibleWidth <= padding * 2 || canvasHeight <= padding * 2) return null

  const x = visibleWidth / 2 - node.x * viewport.scale
  const y = canvasHeight / 2 - node.y * viewport.scale
  if (Math.abs(x - viewport.x) < 0.5 && Math.abs(y - viewport.y) < 0.5) {
    return null
  }
  return { x, y }
}
