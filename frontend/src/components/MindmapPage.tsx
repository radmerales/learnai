import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react"

import { buildRenderedEdges, type Node, type RenderedEdge } from "../graph"
import { getSelectionBounds } from "../selectionBounds"
import { useLabelEditing } from "../hooks/useLabelEditing"
import { useMindmapGraph } from "../hooks/useMindmapGraph"
import { useMindmapInteractions } from "../hooks/useMindmapInteractions"
import { useMindmapSelection } from "../hooks/useMindmapSelection"
import { useMindmapSync } from "../hooks/useMindmapSync"
import { CanvasStatusOverlay } from "./CanvasStatusOverlay"
import { InlineNodeEditor } from "./InlineNodeEditor"
import { ContextMenu } from "./ContextMenu"
import { MindmapCanvas } from "./MindmapCanvas"
import { MindmapFooter } from "./MindmapFooter"
import { MindmapHeader } from "./MindmapHeader"
import { NodePanel } from "./NodePanel"

type ContextMenuState = {
  kind: "node" | "edge"
  id: string
  label: string
  deleteLabel: string
  x: number
  y: number
}

export function MindmapPage() {
  const graph = useMindmapGraph()
  // `onLoad` is how loaded JSON enters the graph reducer; the sync hook also
  // reads nodes/links so it knows when the document has changed.
  const sync = useMindmapSync({
    nodes: graph.nodes,
    links: graph.links,
    onLoad: graph.replaceState,
  })
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

  // A map switch replaces every node ID, so old selections no longer point at
  // real nodes. Clearing them also closes the note panel.
  useEffect(() => {
    clearSelection()
  }, [clearSelection, sync.currentId])

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
  const selectionBox = useMemo(
    () => getSelectionBounds(graph.nodes, edges, selectedNodeIds, selectedEdgeIds),
    [edges, graph.nodes, selectedEdgeIds, selectedNodeIds],
  )

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

  function handleDeleteMap() {
    if (!sync.currentId) return
    const label = sync.title.trim() || "Untitled mindmap"
    if (window.confirm(`Delete "${label}"? This cannot be undone.`)) {
      void sync.deleteMap(sync.currentId)
    }
  }

  function handleNodeDoubleClick(node: Node) {
    selectNode(node.id)
    editing.startEditing(node)
  }

  function handleNodeContextMenu(node: Node, e: MouseEvent<SVGGElement>) {
    selectNode(node.id)
    closePanel()
    setContextMenu({
      kind: "node",
      id: node.id,
      label: node.label,
      deleteLabel: "Delete node",
      x: e.clientX,
      y: e.clientY,
    })
  }

  function handleEdgeContextMenu(edge: RenderedEdge, e: MouseEvent<SVGPathElement>) {
    selectEdge(edge.id)
    setContextMenu({
      kind: "edge",
      id: edge.id,
      label: `${edge.from.label} → ${edge.to.label}`,
      deleteLabel: "Delete edge",
      x: e.clientX,
      y: e.clientY,
    })
  }

  function handleContextDelete() {
    if (!contextMenu) return
    if (contextMenu.kind === "node") {
      deleteNodeById(contextMenu.id)
      return
    }
    removeLink(contextMenu.id)
    clearSelection()
    cancelEditing()
    setContextMenu(null)
  }

  return (
    <div className="flex h-full flex-col bg-paper text-ink">
      <MindmapHeader
        title={sync.title}
        maps={sync.summaries}
        currentMapId={sync.currentId}
        saveStatus={sync.saveStatus}
        saveError={sync.saveError}
        loading={sync.loading}
        onTitleChange={sync.setTitle}
        onOpenMap={(id) => void sync.openMap(id)}
        onNewMap={() => void sync.newMap()}
        onDeleteMap={handleDeleteMap}
        onRetrySave={sync.retrySave}
      />

      <div className="relative flex-1 overflow-hidden">
        <CanvasStatusOverlay
          loading={sync.loading}
          error={sync.loadError}
          isEmpty={graph.nodes.length === 0}
          onRetry={() => void sync.reload()}
          onCreateFirstNode={handleCreateFirstNode}
        />

        <MindmapCanvas
          nodes={graph.nodes}
          edges={edges}
          selectedNodeIds={selectedNodeIds}
          selectedEdgeIds={selectedEdgeIds}
          editingId={editing.editingId}
          selectionBox={selectionBox}
          svgRef={svgRef}
          interactions={canvasInteractions}
          onNodeDoubleClick={handleNodeDoubleClick}
          onNodeContextMenu={handleNodeContextMenu}
          onEdgeContextMenu={handleEdgeContextMenu}
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
            onBlocksChange={(blocks) => graph.setNodeBlocks(panelNode.id, blocks)}
            onQuestionsChange={(questions) => graph.setNodeQuestions(panelNode.id, questions)}
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
        <ContextMenu
          label={contextMenu.label}
          deleteLabel={contextMenu.deleteLabel}
          x={contextMenu.x}
          y={contextMenu.y}
          onDelete={handleContextDelete}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
