export function MindmapHeader() {
  return (
    <header className="border-b border-hairline bg-surface px-6 py-4">
      <p className="font-mono text-xs uppercase tracking-[0.08em] text-mutedink">Mindmap MVP</p>
      <h1 className="text-2xl font-semibold leading-tight">Topic node network</h1>
      <p className="mt-1 max-w-2xl text-sm text-[#1d1d1d]">
        Just nodes and edges. Double-click a node to rename it. Hover a node and drag a side handle onto empty space
        to create a connected node, or onto another node to link them.
      </p>
    </header>
  )
}
