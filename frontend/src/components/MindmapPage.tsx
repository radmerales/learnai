import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react"

import { buildRenderedEdges, type Node } from "../graph"
import { useLabelEditing } from "../hooks/useLabelEditing"
import { useMindmapGraph } from "../hooks/useMindmapGraph"
import { useMindmapInteractions } from "../hooks/useMindmapInteractions"
import { InlineNodeEditor } from "./InlineNodeEditor"
import { MindmapCanvas } from "./MindmapCanvas"
import { MindmapFooter } from "./MindmapFooter"
import { MindmapHeader } from "./MindmapHeader"
import { NodeContextMenu } from "./NodeContextMenu"

type ContextMenuState = {
  nodeId: string
  label: string
  x: number
  y: number
}

export function MindmapPage() {
  const graph = useMindmapGraph()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const editing = useLabelEditing({ byId: graph.byId, renameNode: graph.renameNode })

  const interactions = useMindmapInteractions({
    nodes: graph.nodes,
    links: graph.links,
    byId: graph.byId,
    moveNode: graph.moveNode,
    addNode: graph.addNode,
    addLink: graph.addLink,
    updateLink: graph.updateLink,
    removeLink: graph.removeLink,
    setSelectedId,
  })

  const { svgRef, ...canvasInteractions } = interactions
  const selected = selectedId ? graph.byId.get(selectedId) ?? null : null

  const edges = useMemo(
    () => buildRenderedEdges(graph.links, graph.byId),
    [graph.byId, graph.links],
  )

  const { removeNode } = graph
  const { cancelEditing } = editing

  const deleteNode = useCallback(
    (id: string) => {
      removeNode(id)
      setSelectedId((current) => (current === id ? null : current))
      cancelEditing()
      setContextMenu(null)
    },
    [cancelEditing, removeNode],
  )

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Backspace" && e.key !== "Delete") return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const target = e.target as HTMLElement | null
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return

      e.preventDefault()
      if (selectedId) deleteNode(selectedId)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [deleteNode, selectedId])

  function handleCreateFirstNode() {
    const { width, height } = interactions.canvasSize
    const node = graph.addNode({
      x: width ? width / 2 : 420,
      y: height ? height / 2 : 220,
    })
    setSelectedId(node.id)
  }

  function handleDelete() {
    if (!selected) return
    deleteNode(selected.id)
  }

  function handleNodeDoubleClick(node: Node) {
    setSelectedId(node.id)
    editing.startEditing(node)
  }

  function handleNodeContextMenu(node: Node, e: MouseEvent<SVGGElement>) {
    setSelectedId(node.id)
    setContextMenu({ nodeId: node.id, label: node.label, x: e.clientX, y: e.clientY })
  }

  return (
    <div className="flex h-full flex-col bg-paper text-ink">
      <MindmapHeader canDelete={Boolean(selected)} onDelete={handleDelete} />

      <div className="relative flex-1 overflow-hidden">
        {graph.nodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="pointer-events-auto border border-hairline bg-surface px-6 py-5 text-center">
              <p className="font-medium">Empty canvas</p>
              <p className="mt-1 max-w-xs text-sm text-[#3f3e3e]">
                Start with one node, then drag from its edge handles to grow the map.
              </p>
              <button
                onClick={handleCreateFirstNode}
                className="mt-4 border border-ink bg-accent px-3 py-2 text-sm font-medium text-accentink hover:brightness-95"
              >
                Create first node
              </button>
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
          onNodeContextMenu={handleNodeContextMenu}
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

      {contextMenu && (
        <NodeContextMenu
          label={contextMenu.label}
          x={contextMenu.x}
          y={contextMenu.y}
          onDelete={() => deleteNode(contextMenu.nodeId)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
