import type { ContextMenuState } from "./contextMenu"
import type { ArrowMode, Node, RenderedEdge, TextBox } from "./graph"

type CanvasActions = {
  onNewNode: () => void
  onNewText: () => void
}

type EdgeActions = {
  onEditText: () => void
  onArrow: (arrow: ArrowMode) => void
  onDelete: () => void
}

type TextBoxActions = {
  onEdit: () => void
  onDelete: () => void
}

export function canvasContextMenu(
  x: number,
  y: number,
  actions: CanvasActions,
): ContextMenuState {
  return {
    label: "Canvas",
    x,
    y,
    items: [
      { label: "New node", onSelect: actions.onNewNode },
      { label: "New text", onSelect: actions.onNewText },
    ],
  }
}

export function nodeContextMenu(
  node: Node,
  x: number,
  y: number,
  onDelete: () => void,
): ContextMenuState {
  return {
    label: node.label || "Untitled node",
    x,
    y,
    items: [{ label: "Delete node", danger: true, onSelect: onDelete }],
  }
}

export function edgeContextMenu(
  edge: RenderedEdge,
  x: number,
  y: number,
  actions: EdgeActions,
): ContextMenuState {
  const arrows: { mode: ArrowMode; label: string }[] = [
    { mode: "none", label: "No arrow" },
    { mode: "forward", label: "Arrow to target →" },
    { mode: "backward", label: "Arrow to source ←" },
    { mode: "both", label: "Arrows both ways ↔" },
  ]

  return {
    label: `${edge.from.label} → ${edge.to.label}`,
    x,
    y,
    items: [
      {
        label: edge.text.trim() ? "Edit edge text" : "Add edge text",
        onSelect: actions.onEditText,
      },
      {
        label: "Arrow",
        submenu: arrows.map(({ mode, label }) => ({
          label,
          checked: edge.arrow === mode,
          onSelect: () => actions.onArrow(mode),
        })),
      },
      { label: "Delete edge", danger: true, onSelect: actions.onDelete },
    ],
  }
}

export function textBoxContextMenu(
  text: TextBox,
  x: number,
  y: number,
  actions: TextBoxActions,
): ContextMenuState {
  return {
    label: text.text.trim() || "Text box",
    x,
    y,
    items: [
      { label: "Edit text", onSelect: actions.onEdit },
      { label: "Delete text", danger: true, onSelect: actions.onDelete },
    ],
  }
}
