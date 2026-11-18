import { useEffect, useState } from "react"

import type { ContextMenuState } from "../contextMenu"
import { TrashIcon } from "./TrashIcon"

type Props = {
  menu: ContextMenuState
  onClose: () => void
}

function itemClass(danger: boolean) {
  return `flex w-full items-center gap-2 border-0 px-3 py-2 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset ${
    danger
      ? "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-white"
      : "bg-paper text-ink hover:bg-surface focus-visible:ring-ink"
  }`
}

/**
 * Shared right-click menu. Items can be danger actions, checked choices, or
 * parent items with a nested submenu (used for edge-arrow direction).
 */
export function ContextMenu({ menu, onClose }: Props) {
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      e.stopPropagation()
      if (openSubmenu) {
        setOpenSubmenu(null)
      } else {
        onClose()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose, openSubmenu])

  const left = Math.max(8, Math.min(menu.x, window.innerWidth - 248))
  const top = Math.max(8, Math.min(menu.y, window.innerHeight - (menu.items.length * 38 + 54)))
  const submenuToLeft = menu.x > window.innerWidth / 2

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
        className="fixed z-50 w-60 border border-ink bg-paper p-1"
        style={{ left, top }}
      >
        <p className="truncate px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink">
          {menu.label}
        </p>

        {menu.items.map((item) => (
          <div key={item.label} className="relative">
            <button
              role="menuitem"
              type="button"
              aria-haspopup={item.submenu ? "menu" : undefined}
              aria-expanded={item.submenu ? openSubmenu === item.label : undefined}
              onPointerEnter={() => setOpenSubmenu(item.submenu ? item.label : null)}
              onClick={() => {
                if (item.submenu) {
                  setOpenSubmenu((current) =>
                    current === item.label ? null : item.label,
                  )
                  return
                }
                item.onSelect?.()
                onClose()
              }}
              onKeyDown={(event) => {
                if (!item.submenu) return
                if (event.key === "ArrowRight" || event.key === "Enter") {
                  event.preventDefault()
                  setOpenSubmenu(item.label)
                } else if (event.key === "ArrowLeft") {
                  setOpenSubmenu(null)
                }
              }}
              className={itemClass(Boolean(item.danger))}
            >
              {item.danger ? (
                <TrashIcon />
              ) : (
                <span className="w-4 text-center">{item.checked ? "✓" : ""}</span>
              )}
              {item.label}
              {item.submenu ? <span className="ml-auto">›</span> : null}
            </button>

            {item.submenu && openSubmenu === item.label ? (
              <div
                role="menu"
                aria-label={`${item.label} options`}
                className={`absolute top-0 z-[60] w-52 border border-ink bg-paper p-1 ${
                  submenuToLeft ? "right-full mr-1" : "left-full ml-1"
                }`}
              >
                {item.submenu.map((child) => (
                  <button
                    key={child.label}
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      child.onSelect?.()
                      onClose()
                    }}
                    className={itemClass(Boolean(child.danger))}
                  >
                    {child.danger ? (
                      <TrashIcon />
                    ) : (
                      <span className="w-4 text-center">{child.checked ? "✓" : ""}</span>
                    )}
                    {child.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </>
  )
}
