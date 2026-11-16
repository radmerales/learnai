import { useEffect, useState, type RefObject } from "react"

type Size = { width: number; height: number }

/**
 * Track the rendered size of the SVG canvas without reading the ref during
 * render. The initial measurement is deferred to a frame so the effect never
 * performs a synchronous cascading state update.
 */
export function useCanvasSize(ref: RefObject<SVGSVGElement | null>): Size {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    let frame = 0
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        setSize({ width: element.clientWidth, height: element.clientHeight })
      })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [ref])

  return size
}
