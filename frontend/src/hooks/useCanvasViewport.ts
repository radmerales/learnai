import { useCallback, useEffect, useRef, useState, type RefObject } from "react"

import type { Point } from "../graph"

export type Viewport = {
  x: number
  y: number
  scale: number
}

export const MIN_ZOOM = 0.25
export const MAX_ZOOM = 3
export const ZOOM_STEP = 1.25

type Size = { width: number; height: number }

function clampZoom(scale: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale))
}

/**
 * Infinite-canvas viewport state.
 *
 * The SVG root stays fixed to the window. A single `<g transform>` moves the
 * world, so node coordinates never need to change when the canvas is panned or
 * zoomed. `toWorld` converts root SVG coordinates back into that world space.
 */
export function useCanvasViewport(
  svgRef: RefObject<SVGSVGElement | null>,
  canvasSize: Size,
) {
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 })
  const viewportRef = useRef(viewport)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    viewportRef.current = viewport
  }, [viewport])

  const cancelAnimation = useCallback(() => {
    if (animationRef.current === null) return
    cancelAnimationFrame(animationRef.current)
    animationRef.current = null
  }, [])

  const zoomAt = useCallback(
    (factor: number, anchor: Point) => {
      cancelAnimation()
      setViewport((current) => {
        const scale = clampZoom(current.scale * factor)
        if (scale === current.scale) return current

        // Keep the world point under the cursor fixed while the scale changes.
        const worldX = (anchor.x - current.x) / current.scale
        const worldY = (anchor.y - current.y) / current.scale
        return {
          x: anchor.x - worldX * scale,
          y: anchor.y - worldY * scale,
          scale,
        }
      })
    },
    [cancelAnimation],
  )

  const zoomIn = useCallback(() => {
    zoomAt(ZOOM_STEP, {
      x: canvasSize.width / 2,
      y: canvasSize.height / 2,
    })
  }, [canvasSize.height, canvasSize.width, zoomAt])

  const zoomOut = useCallback(() => {
    zoomAt(1 / ZOOM_STEP, {
      x: canvasSize.width / 2,
      y: canvasSize.height / 2,
    })
  }, [canvasSize.height, canvasSize.width, zoomAt])

  const setOffset = useCallback(
    (x: number, y: number) => {
      cancelAnimation()
      setViewport((current) => ({ ...current, x, y }))
    },
    [cancelAnimation],
  )

  const panBy = useCallback(
    (dx: number, dy: number) => {
      cancelAnimation()
      setViewport((current) => ({ ...current, x: current.x + dx, y: current.y + dy }))
    },
    [cancelAnimation],
  )

  const resetViewport = useCallback(() => {
    cancelAnimation()
    setViewport({ x: 0, y: 0, scale: 1 })
  }, [cancelAnimation])

  /** Animate only the canvas offset; manual gestures cancel the animation. */
  const animateTo = useCallback(
    (targetX: number, targetY: number, duration = 220) => {
      cancelAnimation()
      const start = viewportRef.current
      if (Math.abs(targetX - start.x) < 0.5 && Math.abs(targetY - start.y) < 0.5) {
        return
      }

      if (
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      ) {
        setViewport((current) => ({ ...current, x: targetX, y: targetY }))
        return
      }

      const startedAt = performance.now()
      const tick = (time: number) => {
        const progress = Math.min(1, (time - startedAt) / duration)
        const eased = 1 - (1 - progress) ** 3
        setViewport((current) => ({
          ...current,
          x: start.x + (targetX - start.x) * eased,
          y: start.y + (targetY - start.y) * eased,
        }))
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(tick)
        } else {
          animationRef.current = null
        }
      }
      animationRef.current = requestAnimationFrame(tick)
    },
    [cancelAnimation],
  )

  useEffect(() => () => cancelAnimation(), [cancelAnimation])

  const toWorld = useCallback(
    (point: Point): Point => ({
      x: (point.x - viewport.x) / viewport.scale,
      y: (point.y - viewport.y) / viewport.scale,
    }),
    [viewport],
  )

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    function onWheel(event: WheelEvent) {
      event.preventDefault()
      const rect = svg!.getBoundingClientRect()
      const anchor = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }

      if (event.ctrlKey || event.metaKey) {
        // Trackpad pinch gestures arrive as Ctrl+wheel in browsers.
        zoomAt(Math.exp(-event.deltaY * 0.0015), anchor)
      } else {
        panBy(-event.deltaX, -event.deltaY)
      }
    }

    svg.addEventListener("wheel", onWheel, { passive: false })
    return () => svg.removeEventListener("wheel", onWheel)
  }, [panBy, svgRef, zoomAt])

  return {
    viewport,
    zoomIn,
    zoomOut,
    setOffset,
    panBy,
    animateTo,
    resetViewport,
    toWorld,
    canZoomIn: viewport.scale < MAX_ZOOM,
    canZoomOut: viewport.scale > MIN_ZOOM,
  }
}
