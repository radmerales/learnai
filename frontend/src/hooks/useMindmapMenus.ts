import type { MouseEvent } from "react"

import {
  canvasContextMenu,
  edgeContextMenu,
  nodeContextMenu,
  textBoxContextMenu,
} from "../contextMenus"
import type { Node, Point, RenderedEdge, TextBox } from "../graph"
import { useMindmapContextMenu } from "./useMindmapContextMenu"

type Options = {
  menu: ReturnType<typeof useMindmapContextMenu>
  toSvgPoint: (clientX: number, clientY: number) => Point
  selectNode: (id: string) => void
  focusNode: (id: string) => void
  selectEdge: (id: string) => void
  selectText: (id: string) => void
  closePanel: () => void
  addNode: (point: Point) => Node
  addText: (point: Point) => TextBox
  updateLink: (id: string, patch: { arrow: "none" | "forward" | "backward" | "both" }) => void
  deleteNode: (id: string) => void
  deleteEdge: (id: string) => void
  beginEdgeText: (id: string) => void
  cancelEdgeText: () => void
  beginText: (id: string) => void
  deleteText: (id: string) => void
}

/** Build the context menu for every right-click target on the canvas. */
export function useMindmapMenus({
  menu,
  toSvgPoint,
  selectNode,
  focusNode,
  selectEdge,
  selectText,
  closePanel,
  addNode,
  addText,
  updateLink,
  deleteNode,
  deleteEdge,
  beginEdgeText,
  cancelEdgeText,
  beginText,
  deleteText,
}: Options) {
  function handleNodeContextMenu(node: Node, event: MouseEvent<SVGGElement>) {
    selectNode(node.id)
    closePanel()
    menu.open(nodeContextMenu(node, event.clientX, event.clientY, () => deleteNode(node.id)))
  }

  function handleEdgeContextMenu(edge: RenderedEdge, event: MouseEvent<SVGPathElement>) {
    selectEdge(edge.id)
    menu.open(
      edgeContextMenu(edge, event.clientX, event.clientY, {
        onEditText: () => beginEdgeText(edge.id),
        onArrow: (arrow) => updateLink(edge.id, { arrow }),
        onDelete: () => {
          cancelEdgeText()
          deleteEdge(edge.id)
        },
      }),
    )
  }

  function handleCanvasContextMenu(event: MouseEvent<SVGSVGElement>) {
    event.preventDefault()
    const point = toSvgPoint(event.clientX, event.clientY)
    menu.open(
      canvasContextMenu(event.clientX, event.clientY, {
        onNewNode: () => {
          const node = addNode(point)
          focusNode(node.id)
        },
        onNewText: () => {
          const text = addText(point)
          beginText(text.id)
        },
      }),
    )
  }

  function handleTextContextMenu(
    text: TextBox,
    event: MouseEvent<SVGForeignObjectElement>,
  ) {
    selectText(text.id)
    menu.open(
      textBoxContextMenu(text, event.clientX, event.clientY, {
        onEdit: () => beginText(text.id),
        onDelete: () => deleteText(text.id),
      }),
    )
  }

  return {
    handleNodeContextMenu,
    handleEdgeContextMenu,
    handleCanvasContextMenu,
    handleTextContextMenu,
  }
}
