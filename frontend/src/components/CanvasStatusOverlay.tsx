/**
 * A presentational component: it receives plain data and callbacks as props
 * (similar to function arguments) and returns JSX, which React turns into DOM.
 * It does not call the API or own map state.
 *
 * The final condition means the overlay is invisible once a map is loaded and
 * has nodes. Loading and errors take priority over the empty-canvas message.
 */
type Props = {
  loading: boolean
  error: string | null
  isEmpty: boolean
  onRetry: () => void
  onCreateFirstNode: () => void
}

export function CanvasStatusOverlay({
  loading,
  error,
  isEmpty,
  onRetry,
  onCreateFirstNode,
}: Props) {
  if (!loading && !error && !isEmpty) return null

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm border border-hairline bg-surface px-6 py-5 text-center">
        {loading ? (
          <>
            <p className="font-medium">Loading map</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink">
              Fetching nodes, notes, and questions…
            </p>
          </>
        ) : error ? (
          <>
            <p className="font-medium">Could not load map</p>
            <p className="mt-1 break-words text-sm text-[#3f3e3e]">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 border border-ink bg-accent px-3 py-2 text-sm font-medium text-accentink hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Retry
            </button>
          </>
        ) : (
          <>
            <p className="font-medium">Empty canvas</p>
            <p className="mt-1 max-w-xs text-sm text-[#3f3e3e]">
              Start with one node, then drag from its edge handles to grow the map.
            </p>
            <button
              type="button"
              onClick={onCreateFirstNode}
              className="mt-4 border border-ink bg-accent px-3 py-2 text-sm font-medium text-accentink hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Create first node
            </button>
          </>
        )}
      </div>
    </div>
  )
}
