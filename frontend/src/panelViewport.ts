import type { Node } from "./graph"
import type { Viewport } from "./hooks/useCanvasViewport"

const EDGE_PADDING = 28

/**
 * Compute the viewport x offset needed to keep a selected node left of the
 * detail panel. The panel covers the right side of the canvas, so this shifts
 * the world left when the node would otherwise sit underneath it.
 *
 * Returns `null` when the node is already visible or the panel leaves no room.
 */
export function panelShiftX(
  viewport: Viewport,
  node: Node,
  canvasWidth: number,
  panelWidth: number,
  padding = EDGE_PADDING,
): number | null {
  const visibleRight = canvasWidth - panelWidth
  if (visibleRight <= padding * 2) return null

  const nodeLeft = viewport.x + (node.x - node.width / 2) * viewport.scale
  const nodeRight = viewport.x + (node.x + node.width / 2) * viewport.scale
  let targetX = viewport.x

  if (nodeRight > visibleRight - padding) {
    targetX -= nodeRight - (visibleRight - padding)
  }
  if (nodeLeft < padding) {
    targetX += padding - nodeLeft
  }

  return Math.abs(targetX - viewport.x) < 0.5 ? null : targetX
}
