import { useEffect } from "react"

import type { ContextMenuState } from "../contextMenu"
import { TrashIcon } from "./TrashIcon"

type Props = {
  menu: ContextMenuState
  onClose: () => void
}

/**
 * Shared right-click menu. Items can be marked danger (red delete actions) or
 * checked (the active edge-arrow mode).
 */
export function ContextMenu({ menu, onClose }: Props) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  const left = Math.max(8, Math.min(menu.x, window.innerWidth - 248))
  const top = Math.max(8, Math.min(menu.y, window.innerHeight - (menu.items.length * 38 + 54)))

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onPointerDown={onClose}
        onContextMenu={(e) => {
          e.preventDefault()
          onClose()
        }}
      />
      <div
        role="menu"
        aria-label={`Actions for ${menu.label}`}
        className="fixed z-50 w-60 max-h-[70vh] overflow-y-auto border border-ink bg-paper p-1"
        style={{ left, top }}
      >
        <p className="truncate px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink">
          {menu.label}
        </p>
        {menu.items.map((item) => (
          <button
            key={item.label}
            role="menuitem"
            type="button"
            onClick={() => {
              item.onSelect()
              onClose()
            }}
            className={`flex w-full items-center gap-2 border-0 px-3 py-2 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset ${
              item.danger
                ? "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-white"
                : "bg-paper text-ink hover:bg-surface focus-visible:ring-ink"
            }`}
          >
            {item.danger ? <TrashIcon /> : <span className="w-4 text-center">{item.checked ? "✓" : ""}</span>}
            {item.label}
          </button>
        ))}
      </div>
    </>
  )
}
