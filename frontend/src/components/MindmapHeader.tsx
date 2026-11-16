type Props = {
  canDelete: boolean
  deleteLabel: string
  onDelete: () => void
}

export function MindmapHeader({ canDelete, deleteLabel, onDelete }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline bg-surface px-6 py-4">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-mutedink">Mindmap MVP</p>
        <h1 className="text-2xl font-semibold leading-tight">Topic node network</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#1d1d1d]">
          Just nodes and edges. Double-click a node to rename it. Hover a node and drag a side handle onto empty space
          to create a connected node, or onto another node to link them.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onDelete}
          disabled={!canDelete}
          className="border border-hairline bg-paper px-3 py-2 text-sm font-medium text-ink disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#e1e0dd]"
        >
          {deleteLabel}
        </button>
      </div>
    </header>
  )
}
