import { describe, expect, it, vi } from "vitest"

import { canvasContextMenu, edgeContextMenu, textBoxContextMenu } from "./contextMenus"
import { buildRenderedEdges } from "./graph"
import { makeLink, makeNode } from "./test/fixtures"

function edge() {
  const nodes = [makeNode({ id: "a", label: "A" }), makeNode({ id: "b", label: "B", x: 300 })]
  return buildRenderedEdges(
    [makeLink({ id: "l1", from: "a", to: "b", text: "causes", arrow: "forward" })],
    new Map(nodes.map((node) => [node.id, node])),
  )[0]
}

describe("context menu builders", () => {
  it("offers new node and new text on blank canvas", () => {
    const onNewNode = vi.fn()
    const onNewText = vi.fn()

    const menu = canvasContextMenu(10, 20, { onNewNode, onNewText })

    expect(menu.items.map((item) => item.label)).toEqual(["New node", "New text"])
  })

  it("offers edge text, arrow choices, and delete", () => {
    const onArrow = vi.fn()
    const menu = edgeContextMenu(edge(), 10, 20, {
      onEditText: vi.fn(),
      onArrow,
      onDelete: vi.fn(),
    })

    expect(menu.label).toBe("A → B")
    expect(menu.items.map((item) => item.label)).toContain("Edit edge text")
    expect(menu.items.map((item) => item.label)).toEqual([
      "Edit edge text",
      "Arrow",
      "Delete edge",
    ])
    const arrows = menu.items.find((item) => item.label === "Arrow")?.submenu
    expect(arrows?.map((item) => item.label)).toEqual([
      "No arrow",
      "Arrow to target →",
      "Arrow to source ←",
      "Arrows both ways ↔",
    ])
    expect(arrows?.find((item) => item.label === "Arrow to target →")).toMatchObject({
      checked: true,
    })
    expect(menu.items.at(-1)).toMatchObject({ label: "Delete edge", danger: true })
  })

  it("offers edit and delete for text boxes", () => {
    const menu = textBoxContextMenu(
      { id: "t1", text: "Remember", x: 0, y: 0, width: 220 },
      10,
      20,
      { onEdit: vi.fn(), onDelete: vi.fn() },
    )

    expect(menu.items.map((item) => item.label)).toEqual(["Edit text", "Delete text"])
  })
})
