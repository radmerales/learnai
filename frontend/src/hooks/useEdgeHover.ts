import { useEffect, useRef, useState } from "react"

export function useEdgeHover() {
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [])

  function clear() {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }

  function show(id: string) {
    clear()
    setHoveredEdgeId(id)
  }

  function scheduleHide(id: string) {
    clear()
    timer.current = window.setTimeout(() => {
      setHoveredEdgeId((prev) => (prev === id ? null : prev))
      timer.current = null
    }, 180)
  }

  function reset() {
    clear()
    setHoveredEdgeId(null)
  }

  return { hoveredEdgeId, show, scheduleHide, clear, reset }
}

export type EdgeHover = ReturnType<typeof useEdgeHover>
