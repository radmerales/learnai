import type { MindmapSummary } from "../api/types"
import type { SaveStatus } from "../persistence"

/**
 * The header is a "controlled" form area: the parent owns the title and map
 * selection, and this component reports every change through callbacks. This
 * is the React equivalent of callbacks/events being passed into a Python class.
 */
type Props = {
  title: string
  maps: MindmapSummary[]
  currentMapId: string | null
  saveStatus: SaveStatus
  saveError: string | null
  loading: boolean
  onTitleChange: (title: string) => void
  onOpenMap: (id: string) => void
  onNewMap: () => void
  onDeleteMap: () => void
  onRetrySave: () => void
}

const SAVE_LABELS: Record<SaveStatus, string> = {
  idle: "Saved",
  saved: "Saved",
  unsaved: "Unsaved changes",
  saving: "Saving…",
  error: "Save failed",
}

function SaveIndicator({
  status,
  error,
  onRetry,
}: {
  status: SaveStatus
  error: string | null
  onRetry: () => void
}) {
  // A small mapping table keeps the JSX below free of nested conditionals.
  const dot =
    status === "error"
      ? "bg-red-600"
      : status === "idle" || status === "saved"
        ? "bg-green-700"
        : "bg-mutedink"

  return (
    <div className="flex items-center gap-2" aria-live="polite">
      <span aria-hidden="true" className={`h-1.5 w-1.5 ${dot}`} />
      <span
        title={error ?? undefined}
        className="font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink"
      >
        {SAVE_LABELS[status]}
      </span>
      {status === "error" && (
        <button
          type="button"
          onClick={onRetry}
          className="font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink underline decoration-hairline underline-offset-4 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Retry
        </button>
      )}
    </div>
  )
}

export function MindmapHeader({
  title,
  maps,
  currentMapId,
  saveStatus,
  saveError,
  loading,
  onTitleChange,
  onOpenMap,
  onNewMap,
  onDeleteMap,
  onRetrySave,
}: Props) {
  return (
    <header className="border-b border-hairline bg-surface px-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-xs uppercase tracking-[0.08em] text-mutedink">learn.ai</p>
            <SaveIndicator status={saveStatus} error={saveError} onRetry={onRetrySave} />
          </div>
          <input
            aria-label="Map title"
            value={title}
            maxLength={200}
            placeholder="Untitled mindmap"
            disabled={loading}
            onChange={(e) => onTitleChange(e.target.value)}
            className="mt-1 w-full min-w-0 border-b border-transparent bg-transparent text-2xl font-semibold leading-tight text-ink outline-none placeholder:text-mutedink focus:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink disabled:opacity-60"
          />
          <p className="mt-1 max-w-2xl text-sm text-[#1d1d1d]">
            Edits save automatically. Double-click a node to rename it, or drag a side handle to
            connect nodes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink">
              Map
            </span>
            <select
              aria-label="Open mindmap"
              value={currentMapId ?? ""}
              disabled={loading || maps.length === 0}
              onChange={(e) => {
                if (e.target.value) onOpenMap(e.target.value)
              }}
              className="max-w-[14rem] border border-hairline bg-paper px-2 py-1.5 text-sm text-ink outline-none focus-visible:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
            >
              {maps.length === 0 && <option value="">No maps</option>}
              {maps.map((map) => (
                <option key={map.id} value={map.id}>
                  {map.title || "Untitled mindmap"}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            disabled={loading}
            onClick={onNewMap}
            className="border border-ink bg-accent px-3 py-1.5 text-sm font-medium text-accentink hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            New map
          </button>

          <button
            type="button"
            disabled={loading || !currentMapId}
            onClick={onDeleteMap}
            className="border border-red-700 bg-paper px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-600 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:border-hairline disabled:text-mutedink disabled:hover:bg-paper"
          >
            Delete
          </button>
        </div>
      </div>
    </header>
  )
}
