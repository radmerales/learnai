import { useMemo, useState } from "react"

import { buildRenderedEdges, type Node } from "../graph"
import { useLabelEditing } from "../hooks/useLabelEditing"
import { useMindmapGraph } from "../hooks/useMindmapGraph"
import { useMindmapInteractions } from "../hooks/useMindmapInteractions"
import { InlineNodeEditor } from "./InlineNodeEditor"
import { MindmapCanvas } from "./MindmapCanvas"
import { MindmapFooter } from "./MindmapFooter"
import { MindmapHeader } from "./MindmapHeader"

export function MindmapPage() {
  const graph = useMindmapGraph()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const editing = useLabelEditing({ byId: graph.byId, renameNode: graph.renameNode })

  const interactions = useMindmapInteractions({
    nodes: graph.nodes,
    links: graph.links,
    byId: graph.byId,
    moveNode: graph.moveNode,
    addChildAt: graph.addChildAt,
    addLink: graph.addLink,
    updateLink: graph.updateLink,
    removeLink: graph.removeLink,
    reparentTree: graph.reparentTree,
    detachTree: graph.detachTree,
    setSelectedId,
  })

  const { svgRef, ...canvasInteractions } = interactions
  const selected = selectedId ? graph.byId.get(selectedId) ?? null : null

  const edges = useMemo(
    () => buildRenderedEdges(graph.nodes, graph.links, graph.treeSides, graph.byId),
    [graph.byId, graph.links, graph.nodes, graph.treeSides],
  )

  function handleAddRoot() {
    const node = graph.addRoot()
    setSelectedId(node.id)
  }

  function handleAddChild() {
    if (!selected) return
    const node = graph.addChild(selected.id)
    if (node) setSelectedId(node.id)
  }

  function handleDelete() {
    if (!selected) return
    graph.removeSubtree(selected.id)
    setSelectedId(null)
    editing.cancelEditing()
  }

  function handleNodeDoubleClick(node: Node) {
    setSelectedId(node.id)
    editing.startEditing(node)
  }

  return (
    <div className="flex h-full flex-col bg-paper text-ink">
      <MindmapHeader
        canAddChild={Boolean(selected)}
        canDelete={Boolean(selected)}
        onAddRoot={handleAddRoot}
        onAddChild={handleAddChild}
        onDelete={handleDelete}
      />

      <div className="relative flex-1 overflow-hidden">
        {graph.nodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="border border-hairline bg-surface px-6 py-5 text-center">
              <p className="font-medium">Empty canvas</p>
              <p className="mt-1 text-sm text-[#3f3e3e]">Click “+ Root node” to create your first topic.</p>
            </div>
          </div>
        )}

        <MindmapCanvas
          nodes={graph.nodes}
          edges={edges}
          selectedId={selectedId}
          editingId={editing.editingId}
          svgRef={svgRef}
          interactions={canvasInteractions}
          onNodeDoubleClick={handleNodeDoubleClick}
        />

        {editing.editingNode && (
          <InlineNodeEditor
            node={editing.editingNode}
            value={editing.draftLabel}
            onChange={editing.setDraftLabel}
            onCommit={editing.commitEditing}
            onCancel={editing.cancelEditing}
          />
        )}
      </div>

      <MindmapFooter
        selectedLabel={selected?.label ?? null}
        nodeCount={graph.nodes.length}
        linkCount={graph.links.length}
      />
    </div>
  )
}
