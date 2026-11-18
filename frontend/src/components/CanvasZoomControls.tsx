type Props = {
  zoom: number
  canZoomIn: boolean
  canZoomOut: boolean
  onZoomIn: () => void
  onZoomOut: () => void
}

function MinusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <path d="M3 8h10" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <path d="M3 8h10M8 3v10" />
    </svg>
  )
}

/**
 * Bottom-left zoom HUD for the infinite canvas. The percentage is announced
 * politely when it changes so keyboard/screen-reader users hear the new level.
 */
export function CanvasZoomControls({
  zoom,
  canZoomIn,
  canZoomOut,
  onZoomIn,
  onZoomOut,
}: Props) {
  return (
    <div
      role="group"
      aria-label="Canvas zoom"
      title="Scroll to pan · Ctrl/Cmd+scroll to zoom · Space-drag to pan"
      className="absolute bottom-4 left-4 z-20 flex items-center border border-ink bg-paper"
    >
      <button
        type="button"
        aria-label="Zoom out"
        title="Zoom out"
        disabled={!canZoomOut}
        onClick={onZoomOut}
        onMouseDown={(event) => event.preventDefault()}
        className="flex h-9 w-9 items-center justify-center text-ink hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink disabled:cursor-not-allowed disabled:text-mutedink disabled:opacity-40"
      >
        <MinusIcon />
      </button>
      <span
        aria-live="polite"
        aria-label={`Zoom ${Math.round(zoom * 100)} percent`}
        className="w-14 border-x border-hairline py-2 text-center font-mono text-[10px] tabular-nums text-mutedink"
      >
        {Math.round(zoom * 100)}%
      </span>
      <button
        type="button"
        aria-label="Zoom in"
        title="Zoom in"
        disabled={!canZoomIn}
        onClick={onZoomIn}
        onMouseDown={(event) => event.preventDefault()}
        className="flex h-9 w-9 items-center justify-center text-ink hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink disabled:cursor-not-allowed disabled:text-mutedink disabled:opacity-40"
      >
        <PlusIcon />
      </button>
    </div>
  )
}
