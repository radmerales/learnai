import { useEffect } from "react"

type Props = {
  label: string
  deleteLabel: string
  x: number
  y: number
  onDelete: () => void
  onClose: () => void
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
    >
      <path d="M3 4.5h10M6 4.5V3h4v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5M6.5 7v3.5M9.5 7v3.5" />
    </svg>
  )
}

export function ContextMenu({ label, deleteLabel, x, y, onDelete, onClose }: Props) {
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

  const left = Math.max(8, Math.min(x, window.innerWidth - 200))
  const top = Math.max(8, Math.min(y, window.innerHeight - 108))

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
        aria-label={`Actions for ${label}`}
        className="fixed z-50 w-48 border border-ink bg-paper p-1"
        style={{ left, top }}
      >
        <p className="truncate px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink">
          {label}
        </p>
        <button
          autoFocus
          role="menuitem"
          onClick={onDelete}
          className="flex w-full items-center gap-2 bg-red-600 px-3 py-2 text-left text-sm font-medium text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <TrashIcon />
          {deleteLabel}
        </button>
      </div>
    </>
  )
}
