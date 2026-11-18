import { useCallback, useEffect, useMemo } from "react"

import { buildRenderedEdges } from "../graph"
import { getSelectionBounds } from "../selectionBounds"
import { useCanvasAnnotations } from "../hooks/useCanvasAnnotations"
import { useLabelEditing } from "../hooks/useLabelEditing"
import { useMindmapContextMenu } from "../hooks/useMindmapContextMenu"
import { useMindmapGraph } from "../hooks/useMindmapGraph"
import { useMindmapInteractions } from "../hooks/useMindmapInteractions"
import { useMindmapMenus } from "../hooks/useMindmapMenus"
import { useMindmapSelection } from "../hooks/useMindmapSelection"
import { useMindmapSync } from "../hooks/useMindmapSync"
import { usePanelCanvasFocus } from "../hooks/usePanelCanvasFocus"
import { CanvasStatusOverlay } from "./CanvasStatusOverlay"
import { CanvasZoomControls } from "./CanvasZoomControls"
import { InlineEdgeEditor } from "./InlineEdgeEditor"
import { InlineNodeEditor } from "./InlineNodeEditor"
import { ContextMenu } from "./ContextMenu"
import { MindmapCanvas } from "./MindmapCanvas"
import { MindmapFooter } from "./MindmapFooter"
import { MindmapHeader } from "./MindmapHeader"
import { NodePanel } from "./NodePanel"

export function MindmapPage() {
  const graph = useMindmapGraph()
  // `onLoad` is how loaded JSON enters the graph reducer; the sync hook also
  // reads nodes/links so it knows when the document has changed.
  const sync = useMindmapSync({
    nodes: graph.nodes,
    links: graph.links,
    texts: graph.texts,
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
  const { removeNode, removeLink, moveNodes, moveText, addText, updateText, removeText } = graph

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
    texts: graph.texts,
    byId: graph.byId,
    edges,
    moveNodes,
    moveText,
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

  usePanelCanvasFocus({
    node: panelNode,
    canvasWidth: interactions.canvasSize.width,
    canvasHeight: interactions.canvasSize.height,
    viewport: interactions.viewport,
    manualVersion: interactions.manualVersion,
    mapId: sync.currentId,
    animateTo: interactions.animateTo,
    resetViewport: interactions.resetViewport,
  })

  const annotations = useCanvasAnnotations({
    texts: graph.texts,
    edges,
    addText,
    updateText,
    removeText,
    updateLink: graph.updateLink,
  })

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
    },
    [cancelEditing, clearSelection, removeNode],
  )

  const deleteEdgeById = useCallback(
    (id: string) => {
      removeLink(id)
      clearSelection()
      cancelEditing()
    },
    [cancelEditing, clearSelection, removeLink],
  )

  const menu = useMindmapContextMenu()
  const menus = useMindmapMenus({
    menu,
    toSvgPoint: interactions.toSvgPoint,
    selectNode,
    focusNode,
    selectEdge,
    closePanel,
    addNode: graph.addNode,
    addText,
    updateLink: graph.updateLink,
    deleteNode: deleteNodeById,
    deleteEdge: deleteEdgeById,
    beginEdgeText: annotations.beginEdgeText,
    cancelEdgeText: annotations.cancelEdgeText,
    beginText: annotations.beginText,
    deleteText: annotations.deleteText,
  })

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (!panelOpen) return
        e.preventDefault()
        closePanel()
        return
      }

      if (e.key !== "Backspace" && e.key !== "Delete") return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const target = e.target as HTMLElement | null
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return

      e.preventDefault()
      if (selectedCount > 0) deleteSelection()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [closePanel, deleteSelection, panelOpen, selectedCount])

  function handleCreateFirstNode() {
    const { width, height } = interactions.canvasSize
    const { x, y, scale } = interactions.viewport
    const node = graph.addNode({
      x: width ? (width / 2 - x) / scale : 420,
      y: height ? (height / 2 - y) / scale : 220,
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
          texts={graph.texts}
          selectedNodeIds={selectedNodeIds}
          selectedEdgeIds={selectedEdgeIds}
          editingId={editing.editingId}
          editingTextId={annotations.editingTextId}
          selectionBox={selectionBox}
          viewport={interactions.viewport}
          svgRef={svgRef}
          interactions={canvasInteractions}
          onNodeDoubleClick={(node) => {
            selectNode(node.id)
            editing.startEditing(node)
          }}
          onNodeContextMenu={menus.handleNodeContextMenu}
          onEdgeContextMenu={menus.handleEdgeContextMenu}
          onCanvasContextMenu={menus.handleCanvasContextMenu}
          onTextContextMenu={menus.handleTextContextMenu}
          onTextStartEdit={annotations.beginText}
          onTextCommit={annotations.commitText}
          onTextCancel={annotations.cancelText}
          onSelectEdge={selectEdge}
        />

        <CanvasZoomControls
          zoom={interactions.viewport.scale}
          canZoomIn={interactions.canZoomIn}
          canZoomOut={interactions.canZoomOut}
          onZoomIn={interactions.zoomIn}
          onZoomOut={interactions.zoomOut}
        />

        {editing.editingNode && (
          <InlineNodeEditor
            node={editing.editingNode}
            viewport={interactions.viewport}
            value={editing.draftLabel}
            onChange={editing.setDraftLabel}
            onCommit={editing.commitEditing}
            onCancel={editing.cancelEditing}
          />
        )}

        {annotations.editingEdge && (
          <InlineEdgeEditor
            edge={annotations.editingEdge}
            viewport={interactions.viewport}
            onCommit={annotations.commitEdgeText}
            onCancel={annotations.cancelEdgeText}
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

      {menu.contextMenu && (
        <ContextMenu menu={menu.contextMenu} onClose={menu.close} />
      )}
    </div>
  )
}
