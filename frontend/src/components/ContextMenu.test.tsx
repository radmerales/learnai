import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { ContextMenuState } from "../contextMenu"
import { ContextMenu } from "./ContextMenu"

function renderMenu(overrides: Partial<ContextMenuState> = {}) {
  const onSelect = vi.fn()
  const onClose = vi.fn()
  const menu: ContextMenuState = {
    label: "Biology",
    x: 100,
    y: 80,
    items: [
      {
        label: "Arrow",
        submenu: [
          { label: "No arrow", onSelect: vi.fn() },
          { label: "Arrow to target →", onSelect: vi.fn(), checked: true },
          { label: "Arrow to source ←", onSelect: vi.fn() },
          { label: "Arrows both ways ↔", onSelect: vi.fn() },
        ],
      },
      { label: "Delete node", onSelect, danger: true },
    ],
    ...overrides,
  }
  const view = render(<ContextMenu menu={menu} onClose={onClose} />)
  return { ...view, menu, onSelect, onClose }
}

describe("ContextMenu", () => {
  it("renders the label and top-level items", () => {
    renderMenu()

    expect(screen.getByRole("menu", { name: "Actions for Biology" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /Arrow/ })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /Delete node/ })).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: /Arrow to target/ })).not.toBeInTheDocument()
  })

  it("opens the arrow submenu and selects a direction", () => {
    const { onClose, menu } = renderMenu()
    const arrowItem = screen.getByRole("menuitem", { name: /Arrow/ })

    fireEvent.pointerEnter(arrowItem)
    const submenu = screen.getByRole("menu", { name: "Arrow options" })
    expect(submenu).toBeInTheDocument()

    fireEvent.click(screen.getByRole("menuitem", { name: /Arrow to target/ }))

    expect(menu.items[0].submenu?.[1].onSelect).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("selects an item and closes", () => {
    const { onSelect, onClose } = renderMenu()

    fireEvent.click(screen.getByRole("menuitem", { name: /Delete node/ }))

    expect(onSelect).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("does not draw a border on the delete action", () => {
    renderMenu()

    expect(screen.getByRole("menuitem", { name: /Delete node/ })).toHaveClass("border-0")
  })

  it("closes on Escape and outside pointer-down", () => {
    const { onClose, container } = renderMenu()

    fireEvent.keyDown(window, { key: "Escape" })
    fireEvent.pointerDown(container.querySelector(".fixed.inset-0")!)

    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
