import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react"

import { buildRenderedEdges, type Node } from "../graph"
import { useLabelEditing } from "../hooks/useLabelEditing"
import { useMindmapGraph } from "../hooks/useMindmapGraph"
import { useMindmapInteractions } from "../hooks/useMindmapInteractions"
import { useMindmapSelection } from "../hooks/useMindmapSelection"
import { InlineNodeEditor } from "./InlineNodeEditor"
import { MindmapCanvas } from "./MindmapCanvas"
import { MindmapFooter } from "./MindmapFooter"
import { MindmapHeader } from "./MindmapHeader"
import { NodeContextMenu } from "./NodeContextMenu"
import { NodePanel } from "./NodePanel"

type ContextMenuState = {
  nodeId: string
  label: string
  x: number
  y: number
}

export function MindmapPage() {
  const graph = useMindmapGraph()
  const selection = useMindmapSelection()
  const editing = useLabelEditing({ byId: graph.byId, renameNode: graph.renameNode })
  const { cancelEditing } = editing
  const {
    selectedNodeIds,
    selectedEdgeIds,
    panelOpen,
    selectNode,
    focusNode,
    selectEdge,
    selectMarquee,
    clearSelection,
    clearEdgeSelection,
    closePanel,
  } = selection
  const { removeNode, removeLink, moveNodes } = graph
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  const edges = useMemo(
    () => buildRenderedEdges(graph.links, graph.byId),
    [graph.byId, graph.links],
  )

  const interactions = useMindmapInteractions({
    nodes: graph.nodes,
    links: graph.links,
    byId: graph.byId,
    edges,
    moveNodes,
    addNode: graph.addNode,
    addLink: graph.addLink,
    updateLink: graph.updateLink,
    removeLink,
    selectedNodeIds,
    selectNode,
    focusNode,
    selectMarquee,
    clearEdgeSelection,
  })

  const { svgRef, ...canvasInteractions } = interactions
  const selectedNode =
    selectedNodeIds.length === 1 ? graph.byId.get(selectedNodeIds[0]) ?? null : null
  const panelNode = panelOpen && selectedNodeIds.length === 1 ? selectedNode : null
  const selectedCount = selectedNodeIds.length + selectedEdgeIds.length

  const deleteSelection = useCallback(() => {
    selectedEdgeIds.forEach((id) => removeLink(id))
    selectedNodeIds.forEach((id) => removeNode(id))
    clearSelection()
    cancelEditing()
  }, [cancelEditing, clearSelection, removeLink, removeNode, selectedEdgeIds, selectedNodeIds])

  const deleteNodeById = useCallback(
    (id: string) => {
      removeNode(id)
      clearSelection()
      cancelEditing()
      setContextMenu(null)
    },
    [cancelEditing, clearSelection, removeNode],
  )

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Backspace" && e.key !== "Delete") return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const target = e.target as HTMLElement | null
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return

      e.preventDefault()
      if (selectedCount > 0) deleteSelection()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [deleteSelection, selectedCount])

  function handleCreateFirstNode() {
    const { width, height } = interactions.canvasSize
    const node = graph.addNode({
      x: width ? width / 2 : 420,
      y: height ? height / 2 : 220,
    })
    focusNode(node.id)
  }

  function handleDeleteSelection() {
    if (selectedCount > 0) deleteSelection()
  }

  function handleNodeDoubleClick(node: Node) {
    selectNode(node.id)
    editing.startEditing(node)
  }

  function handleNodeContextMenu(node: Node, e: MouseEvent<SVGGElement>) {
    selectNode(node.id)
    closePanel()
    setContextMenu({ nodeId: node.id, label: node.label, x: e.clientX, y: e.clientY })
  }

  const deleteLabel =
    selectedCount > 1
      ? `Delete ${selectedCount} items`
      : selectedNodeIds.length === 1
        ? "Delete node"
        : selectedEdgeIds.length === 1
          ? "Delete edge"
          : "Delete"

  return (
    <div className="flex h-full flex-col bg-paper text-ink">
      <MindmapHeader
        canDelete={selectedCount > 0}
        deleteLabel={deleteLabel}
        onDelete={handleDeleteSelection}
      />

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
          selectedNodeIds={selectedNodeIds}
          selectedEdgeIds={selectedEdgeIds}
          editingId={editing.editingId}
          svgRef={svgRef}
          interactions={canvasInteractions}
          onNodeDoubleClick={handleNodeDoubleClick}
          onNodeContextMenu={handleNodeContextMenu}
          onSelectEdge={selectEdge}
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

        {panelNode && (
          <NodePanel
            node={panelNode}
            onClose={closePanel}
            onTitleChange={(title) => graph.renameNode(panelNode.id, title)}
            onContentChange={(content) => graph.setNodeContent(panelNode.id, content)}
            onStatusChange={(status) => graph.setNodeStatus(panelNode.id, status)}
          />
        )}
      </div>

      <MindmapFooter
        selectedLabel={selectedNode?.label ?? null}
        selectedNodeCount={selectedNodeIds.length}
        selectedEdgeCount={selectedEdgeIds.length}
        nodeCount={graph.nodes.length}
        linkCount={graph.links.length}
      />

      {contextMenu && (
        <NodeContextMenu
          label={contextMenu.label}
          x={contextMenu.x}
          y={contextMenu.y}
          onDelete={() => deleteNodeById(contextMenu.nodeId)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
