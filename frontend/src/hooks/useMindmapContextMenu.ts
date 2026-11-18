import { useCallback, useState } from "react"

import type { ContextMenuState } from "../contextMenu"

/**
 * Owns the right-click menu position, title, and items. Components build the
 * item list; this hook only handles opening/closing the shared menu.
 */
export function useMindmapContextMenu() {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  const open = useCallback((menu: ContextMenuState) => {
    setContextMenu(menu)
  }, [])

  const close = useCallback(() => {
    setContextMenu(null)
  }, [])

  return { contextMenu, open, close }
}
