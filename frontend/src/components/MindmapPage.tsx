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
import { NodePanel } from "./NodePanel"

type ContextMenuState = {
  nodeId: string
  label: string
  x: number
  y: number
}

export function MindmapPage() {
  const graph = useMindmapGraph()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [panelNodeId, setPanelNodeId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const editing = useLabelEditing({ byId: graph.byId, renameNode: graph.renameNode })
  const { cancelEditing } = editing

  const selectNode = useCallback((id: string | null) => {
    setSelectedId(id)
    setSelectedEdgeId(null)
    if (!id) setPanelNodeId(null)
  }, [])

  const selectEdge = useCallback(
    (id: string) => {
      setSelectedId(null)
      setSelectedEdgeId(id)
      setPanelNodeId(null)
      cancelEditing()
    },
    [cancelEditing],
  )

  const handleNodeFocus = useCallback(
    (id: string) => {
      selectNode(id)
      setPanelNodeId(id)
    },
    [selectNode],
  )

  const clearEdgeSelection = useCallback(() => {
    setSelectedEdgeId(null)
  }, [])

  const interactions = useMindmapInteractions({
    nodes: graph.nodes,
    links: graph.links,
    byId: graph.byId,
    moveNode: graph.moveNode,
    addNode: graph.addNode,
    addLink: graph.addLink,
    updateLink: graph.updateLink,
    removeLink: graph.removeLink,
    selectNode,
    clearEdgeSelection,
    onNodeFocus: handleNodeFocus,
  })

  const { svgRef, ...canvasInteractions } = interactions
  const selected = selectedId ? graph.byId.get(selectedId) ?? null : null
  const panelNode = panelNodeId ? graph.byId.get(panelNodeId) ?? null : null

  const edges = useMemo(
    () => buildRenderedEdges(graph.links, graph.byId),
    [graph.byId, graph.links],
  )

  const { removeNode, removeLink } = graph

  const deleteNode = useCallback(
    (id: string) => {
      removeNode(id)
      setSelectedId((current) => (current === id ? null : current))
      setSelectedEdgeId(null)
      setPanelNodeId((current) => (current === id ? null : current))
      cancelEditing()
      setContextMenu(null)
    },
    [cancelEditing, removeNode],
  )

  const deleteEdge = useCallback(
    (id: string) => {
      removeLink(id)
      setSelectedEdgeId((current) => (current === id ? null : current))
    },
    [removeLink],
  )

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Backspace" && e.key !== "Delete") return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const target = e.target as HTMLElement | null
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return

      e.preventDefault()
      if (selectedEdgeId) {
        deleteEdge(selectedEdgeId)
      } else if (selectedId) {
        deleteNode(selectedId)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [deleteEdge, deleteNode, selectedEdgeId, selectedId])

  function handleCreateFirstNode() {
    const { width, height } = interactions.canvasSize
    const node = graph.addNode({
      x: width ? width / 2 : 420,
      y: height ? height / 2 : 220,
    })
    selectNode(node.id)
  }

  function handleDeleteSelection() {
    if (selectedEdgeId) {
      deleteEdge(selectedEdgeId)
      return
    }
    if (selected) deleteNode(selected.id)
  }

  function handleNodeDoubleClick(node: Node) {
    selectNode(node.id)
    editing.startEditing(node)
  }

  function handleNodeContextMenu(node: Node, e: MouseEvent<SVGGElement>) {
    selectNode(node.id)
    setPanelNodeId(null)
    setContextMenu({ nodeId: node.id, label: node.label, x: e.clientX, y: e.clientY })
  }

  const deleteLabel = selectedEdgeId ? "Delete edge" : selected ? "Delete node" : "Delete"

  return (
    <div className="flex h-full flex-col bg-paper text-ink">
      <MindmapHeader
        canDelete={Boolean(selected || selectedEdgeId)}
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
          selectedId={selectedId}
          selectedEdgeId={selectedEdgeId}
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
            onClose={() => setPanelNodeId(null)}
            onTitleChange={(title) => graph.renameNode(panelNode.id, title)}
            onContentChange={(content) => graph.setNodeContent(panelNode.id, content)}
          />
        )}
      </div>

      <MindmapFooter
        selectedLabel={selected?.label ?? null}
        selectedEdge={Boolean(selectedEdgeId)}
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
